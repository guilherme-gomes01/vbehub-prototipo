import google.generativeai as genai

# COLE SUA CHAVE AQUI (A mesma utilizada no ingestao.py)
GEMINI_KEY = "" 

genai.configure(api_key=GEMINI_KEY)

print("--- Consultando modelos disponiveis para sua chave ---")

try:
    for m in genai.list_models():
        # Filtra apenas modelos que servem para gerar texto (chat)
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
            
except Exception as e:
    print(f"Erro ao listar: {e}")