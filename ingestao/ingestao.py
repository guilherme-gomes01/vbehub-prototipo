import json
import feedparser
import google.generativeai as genai
import psycopg2
import time
from datetime import datetime


# CONFIGURAÇÃO
DB_CONFIG = "dbname=vigimanaus user=postgres password=postgres host=localhost port=5433"
GEMINI_KEY = "" # Pegue no Google AI Studio
genai.configure(api_key=GEMINI_KEY)

# Conexão com Banco
conn = psycopg2.connect(DB_CONFIG)
cur = conn.cursor()

# ==========================================================
# 1. PROCESSAR GUARDIÕES DA SAÚDE (JSON LOCAL)
# ==========================================================
def processar_gds():
    print("--- Processando Guardiões da Saúde ---")
    with open('gds-json-exemplos.json', 'r', encoding='utf-8') as f:
        dados = json.load(f)

    for registro in dados:
        time.sleep(5) # Para evitar rate limit da API
        answers = {item['field']: item['value'] for item in registro['answers']}
        
        titulo = answers.get('evento_descricao', 'Relato GdS')
        descricao = answers.get('evento_detalhes', '')
        local = answers.get('evento_local_ocorrencia', '')
        data_str = answers.get('evento_data_ocorrencia', '')
        
        # O GdS já vem estruturado, mas vamos usar o Gemini para 
        # estimar o Nível de Risco e validar se é relevante
        prompt = f"""
        Analise este relato de saúde participativa:
        Título: {titulo}
        Detalhes: {descricao}
        Local: {local}
        
        Responda APENAS um JSON:
        {{
            "nivel_risco": "Alto, Médio ou Baixo",
            "bairro_estimado": "Nome do bairro em Manaus (se não for Manaus, coloque 'Externo')",
            "latitude": "float (estime a lat de Manaus)",
            "longitude": "float (estime a long de Manaus)"
        }}
        """
        
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            # Limpeza básica do JSON retornado pela IA
            texto_limpo = response.text.replace('```json', '').replace('```', '')
            ai_data = json.loads(texto_limpo)
            
            # Inserir no Banco (Fonte ID 3 = Guardiões)
            sql = """
                INSERT INTO sinal (titulo, descricao, status, nivel_risco, localizacao_bairro, geom, fonte_id)
                VALUES (%s, %s, 'Pendente', %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), 3)
            """
            cur.execute(sql, (
                titulo, 
                descricao, 
                ai_data.get('nivel_risco', 'Baixo'),
                ai_data.get('bairro_estimado', 'Desconhecido'),
                ai_data.get('longitude', -60.0217), # Fallback Longitude
                ai_data.get('latitude', -3.1190)    # Fallback Latitude
            ))
            conn.commit()
            print(f"✅ GdS Importado: {titulo}")
            
        except Exception as e:
            print(f"❌ Erro GdS: {e}")

# ==========================================================
# 2. PROCESSAR EIOS (RSS ONLINE)
# ==========================================================
def processar_eios():
    print("\n--- Processando Feed EIOS ---")
    # URL real que você passou
    url = "https://portal.who.int/eios/API/News/Monitoring/getBoardRssFeed?queryId=1693"
    feed = feedparser.parse(url)

    for entry in feed.entries:
        time.sleep(5) # Para evitar rate limit da API
        titulo = entry.title
        resumo = entry.description
        link = entry.link
        
        # AQUI ESTÁ O PULO DO GATO: FILTRAGEM COM IA
        # O feed tem notícias do mundo todo. Vamos filtrar só o que parece ser ameaça.
        prompt = f"""
        Analise esta notícia de saúde pública global:
        Título: {titulo}
        Resumo: {resumo}
        
        1. É uma doença infecciosa ou surto?
        2. É relevante para o Brasil/Amazonas? (Sim/Não)
        3. Qual o nível de risco?
        
        Responda estritamente neste formato JSON:
        {{
            "relevante": true/false,
            "doenca": "Nome da doença",
            "local": "Cidade/País mencionado",
            "nivel_risco": "Alto/Médio/Baixo"
        }}
        """
        
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            texto_limpo = response.text.replace('```json', '').replace('```', '')
            ai_data = json.loads(texto_limpo)
            
            # Só salvamos se a IA achar relevante OU se quisermos demonstrar a ingestão global
            # Para o MVP, vou salvar tudo mas marcar como 'Descartado' se não for relevante
            status = 'Pendente' if ai_data['relevante'] else 'Descartado'
            
            sql = """
                INSERT INTO sinal (titulo, descricao, status, nivel_risco, localizacao_bairro, geom, fonte_id)
                VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(-60.02, -3.10), 4326), 1)
            """
            # Nota: Fixei a coordenada de Manaus para o EIOS pois as noticias são globais,
            # mas no TCC você diz que monitora riscos para Manaus.
            
            cur.execute(sql, (
                f"[{ai_data['doenca']}] {titulo}", 
                f"{resumo} (Fonte Original: {link})", 
                status,
                ai_data.get('nivel_risco', 'Baixo'),
                ai_data.get('local', 'Global')
            ))
            conn.commit()
            print(f"✅ EIOS Processado: {titulo} -> Relevante? {ai_data['relevante']}")
            
        except Exception as e:
            print(f"❌ Erro EIOS: {e}")

# Executar
if __name__ == "__main__":
    processar_gds()
    processar_eios()
    cur.close()
    conn.close()