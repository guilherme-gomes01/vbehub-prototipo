-- Habilitar a extensao PostGIS (Essencial para o mapa)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Limpar tabelas antigas se existirem (para comecar limpo)
DROP TABLE IF EXISTS acao_resposta CASCADE;
DROP TABLE IF EXISTS verificacao CASCADE;
DROP TABLE IF EXISTS sinal CASCADE;
DROP TABLE IF EXISTS analista CASCADE;
DROP TABLE IF EXISTS fonte CASCADE;

-- Tabela de Fontes (EIOS, Twitter/X, Guardioes)
CREATE TABLE fonte (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL -- 'Oficial', 'Informal', 'Participativa'
);

-- Tabela de Analistas (Usuarios do sistema)
CREATE TABLE analista (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL -- Hash BCrypt da senha
);

-- Tabela de Sinais (O coracao do sistema)
CREATE TABLE sinal (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_deteccao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'Pendente', -- 'Pendente', 'Em Analise', 'Em Monitoramento', 'Evento', 'Descartado'
    nivel_risco VARCHAR(50), -- 'Alto', 'Medio', 'Baixo', 'Indeterminado'
    localizacao_bairro VARCHAR(500),
    -- Coluna espacial do PostGIS (Ponto Geografico: Longitude, Latitude)
    geom GEOMETRY(Point, 4326), 
    fonte_id INTEGER REFERENCES fonte(id)
);


-- Tabela de Verificacao (Parecer tecnico)
CREATE TABLE verificacao (
    id SERIAL PRIMARY KEY,
    data_verificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_verificacao VARCHAR(50), -- 'Confirmado', 'Descartado'
    parecer_tecnico TEXT,
    sinal_id INTEGER UNIQUE REFERENCES sinal(id),
    analista_id INTEGER REFERENCES analista(id)
);

-- Tabela de Acao de Resposta
CREATE TABLE acao_resposta (
    id SERIAL PRIMARY KEY,
    descricao_acao TEXT NOT NULL,
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    equipe_responsavel VARCHAR(100),
    sinal_id INTEGER REFERENCES sinal(id)
);

-- =================================================================
-- CARGA DE DADOS INICIAIS (SEED) PARA O PROTOTIPO
-- =================================================================

-- Inserindo Fontes
INSERT INTO fonte (nome, tipo) VALUES 
('EIOS', 'Oficial'),
('Twitter/X', 'Informal'),
('Guardiões da Saúde', 'Participativa');

-- Inserindo um Analista de teste
INSERT INTO analista (nome, email, senha) VALUES 
('Analista Teste', 'teste.analista@vbehub.com', 'insirahashteste');

-- Sinais Fakes Iniciais (Para o mapa nao ficar vazio antes do Python rodar)
-- Atencao: PostGIS usa (LONGITUDE, LATITUDE)
INSERT INTO sinal (titulo, descricao, data_deteccao, status, nivel_risco, localizacao_bairro, geom, fonte_id) VALUES
-- Sinal 1: Dengue no Alvorada (Vindo do Twitter)
('Relatos de febre alta e manchas na pele', 'Usuários reportam múltiplos casos de sintomas de dengue na rua 8.', NOW() - INTERVAL '2 hours', 'Pendente', 'Médio', 'Alvorada', ST_SetSRID(ST_MakePoint(-60.0461, -3.0734), 4326), 2),

-- Sinal 2: Surto de Diarreia (Vindo do Guardioes da Saude)
('Aumento de casos de diarreia em escola', 'Diretor reporta 15 alunos doentes após merenda.', NOW() - INTERVAL '1 day', 'Em Análise', 'Alto', 'Cidade Nova', ST_SetSRID(ST_MakePoint(-59.9856, -3.0336), 4326), 3),

-- Sinal 3: Alerta EIOS sobre virus respiratorio
('Alerta: Vírus Sincicial Respiratório', 'Aumento de internações pediátricas na zona leste.', NOW() - INTERVAL '3 days', 'Em Monitoramento', 'Baixo', 'Jorge Teixeira', ST_SetSRID(ST_MakePoint(-59.9329, -3.0331), 4326), 1),

-- Sinal 4: Malaria (Zona Rural/Ribeirinha)
('Caso suspeito de Malária', 'Morador da comunidade ribeirinha reporta tremores e febre.', NOW() - INTERVAL '5 hours', 'Pendente', 'Alto', 'Puraquequara', ST_SetSRID(ST_MakePoint(-59.8820, -3.0760), 4326), 3),

-- Sinal 5: Sarampo (Fake news descartada para teste)
('Rumor de Sarampo no Centro', 'Boato de WhatsApp sem confirmação clínica.', NOW() - INTERVAL '4 days', 'Descartado', 'Baixo', 'Centro', ST_SetSRID(ST_MakePoint(-60.0217, -3.1316), 4326), 2);

-- =================================================================
-- INDICES PARA PERFORMANCE
-- =================================================================

-- Indice por status (usado nas queries do Kanban e stats)
CREATE INDEX IF NOT EXISTS idx_sinal_status ON sinal(status);

-- Indice por nivel de risco (usado nos filtros e stats)
CREATE INDEX IF NOT EXISTS idx_sinal_nivel_risco ON sinal(nivel_risco);

-- Indice por data de deteccao DESC (usado na ordenacao padrao)
CREATE INDEX IF NOT EXISTS idx_sinal_data_deteccao ON sinal(data_deteccao DESC);

-- Indice por fonte (usado no filtro por fonte)
CREATE INDEX IF NOT EXISTS idx_sinal_fonte_id ON sinal(fonte_id);

-- Indice espacial GIST (essencial para queries do mapa com PostGIS)
CREATE INDEX IF NOT EXISTS idx_sinal_geom ON sinal USING GIST (geom);

-- Indice composto para as queries agregadas do Dashboard
CREATE INDEX IF NOT EXISTS idx_sinal_stats ON sinal(status, nivel_risco);
