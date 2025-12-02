import json
import feedparser
import google.generativeai as genai
import psycopg2
import time
import re   # Função para limpeza de JSON
from datetime import datetime


# CONFIGURAÇÃO
DB_CONFIG = "dbname=vigimanaus user=postgres password=postgres host=localhost port=5433"
GEMINI_KEY = "" # Pegue a chave no Google AI Studio e jogue dentro das aspas
genai.configure(api_key=GEMINI_KEY)

# Conexão com Banco
conn = psycopg2.connect(DB_CONFIG)
cur = conn.cursor()

# ==========================================================
# FUNÇÃO AUXILIAR: LIMPEZA DE JSON
# ==========================================================
def limpar_json(texto):
    """
    Remove marcadores de código (```json) e tenta encontrar
    o JSON válido dentro da resposta da IA.
    """
    # Remove blocos de código markdown
    texto = texto.replace('```json', '').replace('```', '')
    
    # Tenta encontrar o conteúdo entre a primeira { e a última }
    # Isso ajuda caso a IA escreva texto antes ou depois do JSON
    match = re.search(r'\{.*\}', texto, re.DOTALL)
    if match:
        return match.group(0)
    return texto

# ==========================================================
# 1. PROCESSAR GUARDIÕES DA SAÚDE (JSON LOCAL)
# ==========================================================
def processar_gds():
    print("--- Processando Guardiões da Saúde ---")
    try:
        with open('gds-json-exemplos.json', 'r', encoding='utf-8') as f:
            dados = json.load(f)
    except FileNotFoundError:
        print("Arquivo 'gds-json-exemplos.json' não encontrado. Pulando etapa.")
        return

    for registro in dados:
        time.sleep(10) # Para evitar rate limit da API
        try:
            answers = {item['field']: item['value'] for item in registro['answers']}
            
            titulo = answers.get('evento_descricao', 'Relato GdS')
            descricao = answers.get('evento_detalhes', '')
            local = answers.get('evento_local_ocorrencia', '')
            data_str = answers.get('evento_data_ocorrencia', '')
            
            # O GdS já vem estruturado, mas utiliza-se o Gemini para 
            # estimar o Nível de Risco e validar relevância
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
            
            model = genai.GenerativeModel('gemini-2.5-flash-lite')
            response = model.generate_content(prompt)
            
            # Limpeza
            texto_limpo = limpar_json(response.text)
            ai_data = json.loads(texto_limpo)
            
            # Ajuste para limites do banco
            bairro_tratado = ai_data.get('bairro_estimado', 'Desconhecido')[:499] 
            
            sql = """
                INSERT INTO sinais_dois (titulo, descricao, status, nivel_risco, localizacao_bairro, geom, fonte_id)
                VALUES (%s, %s, 'Pendente', %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), 3)
            """
            cur.execute(sql, (
                titulo, 
                descricao, 
                ai_data.get('nivel_risco', 'Baixo'),
                bairro_tratado,
                ai_data.get('longitude', -60.0217), # Fallback para Manaus
                ai_data.get('latitude', -3.1190) # Fallback para Manaus
            ))
            conn.commit()
            print(f"✅ GdS Importado: {titulo}")
            
        except Exception as e:
            conn.rollback() 
            print(f"❌ Erro GdS: {e}")

# ==========================================================
# 2. PROCESSAR EIOS (RSS ONLINE)
# ==========================================================
def processar_eios():
    print("\n--- Processando Feed EIOS ---")
    url = "https://portal.who.int/eios/API/News/Monitoring/getBoardRssFeed?queryId=1693"
    
    print(f"📡 Conectando a: {url} ...")
    
    try:
        feed = feedparser.parse(url)
        
        # === DIAGNÓSTICO DE CONEXÃO ===
        status = getattr(feed, 'status', 'N/A')
        total_entries = len(feed.entries)
        print(f"📡 Status HTTP: {status}")
        print(f"📄 Notícias encontradas: {total_entries}")
        
        if total_entries == 0:
            print("⚠️ Nenhuma notícia encontrada. O feed pode estar vazio ou inacessível.")
            if hasattr(feed, 'bozo_exception'):
                print(f"🔍 Erro interno do parser: {feed.bozo_exception}")
            return

    except Exception as e:
        print(f"❌ Erro Crítico ao baixar feed: {e}")
        return

    for entry in feed.entries:
        time.sleep(10) # Para evitar rate limit da API
        try:
            titulo = entry.title
            resumo = entry.description
            link = entry.link
            
            # FILTRAGEM COM IA - O feed tem notícias do mundo todo. Filtra só o que parece ser ameaça.
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
            
            model = genai.GenerativeModel('gemini-2.5-flash-lite')
            response = model.generate_content(prompt)
            
            # Limpeza
            texto_limpo = limpar_json(response.text)
            ai_data = json.loads(texto_limpo)
            
            # Só salva se a IA achar relevante OU caso queira demonstrar a ingestão global
            # Para o protótipo, salva tudo, colocando 'Descartado' se não for relevante
            status = 'Pendente' if ai_data.get('relevante') else 'Descartado'
            
            titulo_completo = f"[{ai_data.get('doenca', 'Geral')}] {titulo}"
            
            local_db = ai_data.get('local', 'Global')[:499]
            
            descricao_db = f"{resumo} (Fonte Original: {link})"
            
            sql = """
                INSERT INTO sinais_dois (titulo, descricao, status, nivel_risco, localizacao_bairro, geom, fonte_id)
                VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(-60.02, -3.10), 4326), 1)
            """
            
            # Nota: Fixado a coordenada de Manaus para o EIOS pois as noticias são globais,
            # mas meu TCC monitora riscos para Manaus.

            cur.execute(sql, (
                titulo_completo, 
                descricao_db, 
                status,
                ai_data.get('nivel_risco', 'Baixo'),
                local_db
            ))
            conn.commit()
            print(f"✅ EIOS Processado: {titulo_completo[:50]}... -> Relevante? {ai_data.get('relevante')}")
            
        except Exception as e:
            conn.rollback() 
            print(f"❌ Erro EIOS no item '{titulo[:20]}...': {e}")

# Executar
if __name__ == "__main__":
    processar_gds()
    processar_eios()
    cur.close()
    conn.close()