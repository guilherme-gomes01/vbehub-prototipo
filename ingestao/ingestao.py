import json
import feedparser
import google.generativeai as genai
import psycopg2
import time
import logging
from datetime import datetime

import os
from dotenv import load_dotenv

# ==========================================================
# CONFIGURACAO DE LOGS
# ==========================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ingestao_execucao.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)

# ==========================================================
# CONFIGURACAO DE AMBIENTE E BANCO
# ==========================================================

load_dotenv()

logging.info("-- Iniciando script de ingestao...")

GEMINI_KEY = os.getenv("GOOGLE_API_KEY")

if not GEMINI_KEY:
    logging.critical("A chave GOOGLE_API_KEY nao foi encontrada no arquivo .env")
    raise ValueError("Chave de API ausente")

genai.configure(api_key=GEMINI_KEY)

DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5433")
DB_NAME = os.getenv("POSTGRES_DB", "vigimanaus")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD")

if not DB_PASS:
    logging.critical("A senha do banco (POSTGRES_PASSWORD) nao foi encontrada no arquivo .env")
    raise ValueError("Senha do banco ausente")

DB_CONFIG = f"dbname={DB_NAME} user={DB_USER} password={DB_PASS} host={DB_HOST} port={DB_PORT}"

try:
    conn = psycopg2.connect(DB_CONFIG)
    cur = conn.cursor()
    logging.info(f"✅ Conectado ao banco de dados via {DB_HOST}:{DB_PORT}")
except Exception as e:
    logging.critical(f"❌ Falha na conexao com o banco: {e}")
    exit(1)

# ==========================================================
# 1. PROCESSAR GUARDIOES DA SAUDE (JSON LOCAL)
# ==========================================================
def processar_gds():
    logging.info("--- Iniciando processamento: Guardioes da Saude ---")
    arquivo_json = 'gds-json-exemplos.json'
    
    try:
        with open(arquivo_json, 'r', encoding='utf-8') as f:
            dados = json.load(f)
    except FileNotFoundError:
        logging.warning(f"Arquivo '{arquivo_json}' nao encontrado. Pulando etapa.")
        return

    count_sucesso = 0
    count_erro = 0

    for registro in dados:
        time.sleep(10) # Delay para API
        answers = {item['field']: item['value'] for item in registro['answers']}
        
        titulo = answers.get('evento_descricao', 'Relato GdS')
        descricao = answers.get('evento_detalhes', '')
        
        prompt = f"""
        Analise este relato de saúde participativa:
        Título: {titulo}
        Detalhes: {descricao}
        Local: {answers.get('evento_local_ocorrencia', '')}
        
        Responda APENAS um JSON:
        {{
            "nivel_risco": "Alto, Médio ou Baixo",
            "bairro_estimado": "Nome do bairro em Manaus (se não for Manaus, coloque 'Externo')",
            "latitude": "float (estime a lat de Manaus)",
            "longitude": "float (estime a long de Manaus)"
        }}
        """
        
        try:
            model = genai.GenerativeModel('gemini-2.5-flash-lite')
            response = model.generate_content(prompt)
            texto_limpo = response.text.replace('```json', '').replace('```', '')
            ai_data = json.loads(texto_limpo)
            
            sql = """
                INSERT INTO sinal (titulo, descricao, status, nivel_risco, localizacao_bairro, geom, fonte_id)
                VALUES (%s, %s, 'Pendente', %s, %s, ST_SetSRID(ST_MakePoint(%s, %s), 4326), 3)
            """
            cur.execute(sql, (
                titulo, 
                descricao, 
                ai_data.get('nivel_risco', 'Baixo'),
                ai_data.get('bairro_estimado', 'Desconhecido'),
                ai_data.get('longitude', -60.0217),
                ai_data.get('latitude', -3.1190)
            ))
            conn.commit()
            logging.info(f"✅ GdS Importado: {titulo}")
            count_sucesso += 1
            
        except Exception as e:
            logging.error(f"❌ Erro ao processar item GdS '{titulo}': {e}")
            conn.rollback()
            count_erro += 1

    logging.info(f"Resumo GdS: {count_sucesso} sucessos, {count_erro} erros.")

# ==========================================================
# 2. PROCESSAR EIOS (RSS ONLINE)
# ==========================================================
def processar_eios():
    logging.info("--- Iniciando processamento: Feed EIOS ---")
    url = "https://portal.who.int/eios/API/News/Monitoring/getBoardRssFeed?queryId=1693"
    
    try:
        feed = feedparser.parse(url)
    except Exception as e:
        logging.error(f"Erro ao baixar feed RSS: {e}")
        return

    if not feed.entries:
        logging.warning("Nenhuma entrada encontrada no feed RSS.")
        return

    count_sucesso = 0
    
    for entry in feed.entries:
        time.sleep(10) # Delay para API
        titulo = entry.title
        resumo = entry.description
        link = entry.link
        
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
            model = genai.GenerativeModel('gemini-2.5-flash-lite')
            response = model.generate_content(prompt)
            texto_limpo = response.text.replace('```json', '').replace('```', '')
            ai_data = json.loads(texto_limpo)
            
            # So salva se a IA achar relevante OU se quiser demonstrar a ingestao global
            # Para o prototipo salva tudo mas marca como 'Descartado' se nao for relevante
            status = 'Pendente' if ai_data['relevante'] else 'Descartado'
            
            sql = """
                INSERT INTO sinal (titulo, descricao, status, nivel_risco, localizacao_bairro, geom, fonte_id)
                VALUES (%s, %s, %s, %s, %s, ST_SetSRID(ST_MakePoint(-60.02, -3.10), 4326), 1)
            """
            # Nota: fixada a coordenada de Manaus para o EIOS pois as noticias sao globais,
            # mas no TCC o monitoramento de riscos fica em Manaus.

            cur.execute(sql, (
                f"[{ai_data['doenca']}] {titulo}", 
                f"{resumo} (Fonte Original: {link})", 
                status,
                ai_data.get('nivel_risco', 'Baixo'),
                ai_data.get('local', 'Global')
            ))
            conn.commit()
            logging.info(f"✅ EIOS Processado: {titulo} | Relevante: {ai_data['relevante']}")
            count_sucesso += 1
            
        except Exception as e:
            logging.error(f"❌ Erro ao processar item EIOS '{titulo}': {e}")
            conn.rollback()

    logging.info(f"Resumo EIOS: {count_sucesso} itens processados.")

# Executar
if __name__ == "__main__":
    try:
        processar_gds()
        processar_eios()
    except KeyboardInterrupt:
        logging.warning("Script interrompido pelo usuario.")
    except Exception as e:
        logging.critical(f"Erro nao tratado na execucao principal: {e}")
    finally:
        if 'cur' in locals(): cur.close()
        if 'conn' in locals(): conn.close()
        logging.info("Execucao finalizada. Conexoes fechadas.")