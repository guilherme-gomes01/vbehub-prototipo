# VBE Hub - Sistema de Vigilância Baseada em Eventos

<div align="center">

![VBE Hub Logo](https://img.shields.io/badge/VBE-Hub-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-MVP-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**Plataforma para agregação e gestão de sinais de alerta em saúde pública**

[Sobre](#-sobre) • [Features](#-features) • [Tecnologias](#-tecnologias) • [Instalação](#-instalação) • [Uso](#-uso) • [Documentação](#-documentação) • [Contribuição](#-contribuição)

</div>

---

## 📋 Sobre

O **VBE Hub** é um sistema de informação desenvolvido para centralizar e qualificar sinais de alerta de múltiplas fontes, automatizando a triagem e classificação para subsidiar decisões em vigilância epidemiológica municipal.

Desenvolvido como Trabalho de Conclusão de Curso (TCC) do curso de Tecnologia em Análise e Desenvolvimento de Sistemas do Instituto Federal do Amazonas (IFAM) - Campus Manaus Centro.

### 🎯 Objetivo

Resolver o problema da **fragmentação de dados** na vigilância em saúde, integrando fontes como:
- 🌍 **EIOS** (Epidemic Intelligence from Open Sources - OMS)
- 📱 **Guardiões da Saúde** (Vigilância participativa)
- 🐦 **Redes Sociais** (Monitoramento informal)

### 🏆 Diferenciais

- ✅ **Integração de múltiplas fontes** em uma única plataforma
- ✅ **IA Generativa** (Google Gemini) para análise e classificação automática
- ✅ **Visualização geoespacial** com mapas interativos (PostGIS + Leaflet)
- ✅ **Gestão de fluxo** via quadros Kanban
- ✅ **Autenticação segura** com JWT
- ✅ **Dashboard analytics** com gráficos interativos
<!-- - ✅ **PWA** (Progressive Web App) - instalável e offline-capable -->

---

## ✨ Features

### 🔐 Autenticação e Segurança
- Login seguro com JWT (JSON Web Token)
- Senhas criptografadas com BCrypt
- Spring Security configurado
<!-- - Filtros customizados de autenticação -->

### 📊 Dashboard de Business Intelligence
- Gráfico de pizza: distribuição por nível de risco
- Gráfico de barras: sinais por status
<!-- - Indicadores estratégicos em tempo real
- Visualização responsiva -->

### 🗺️ Mapa Geoespacial
- Plotagem de sinais no mapa de Manaus
- Marcadores coloridos por nível de risco
- Popups com detalhes do evento
- Suporte PostGIS para queries espaciais

### 📋 Kanban Board
- Fluxo de trabalho visual: Informados → Em Análise → Em Monitoramento → Eventos Confirmados → Descartados
- Drag & Drop intuitivo
- Filtros dinâmicos (fonte, nível de risco)
- Registro obrigatório de ação ao confirmar evento
- Contador de itens por coluna

### 🤖 Inteligência Artificial
- Processamento automático de textos não estruturados
- Classificação de risco (Alto/Médio/Baixo)
- Geocodificação estimada (latitude/longitude)
- Detecção de relevância
- Normalização de dados de múltiplas fontes

<!-- ### 📱 Progressive Web App (PWA)
- Instalável em dispositivos móveis e desktop
- Funciona offline (service worker)
- Ícones e splash screen personalizados
- Modo standalone -->

---

## 🛠️ Tecnologias

### Backend
- ☕ **Java 17**
- 🍃 **Spring Boot 3.5.8**
- 🔒 **Spring Security 6**
- 🔑 **JWT** (jjwt 0.11.5)
- 🗄️ **Spring Data JPA**
- 🔐 **BCrypt Password Encoder**

### Frontend
- ⚛️ **React 19**
- ⚡ **Vite**
- 🎨 **Material-UI v7**
- 📊 **Recharts** (gráficos)
- 🗺️ **React Leaflet** (mapas)
- 🎯 **@hello-pangea/dnd** (drag & drop)
- 🌐 **Axios** (HTTP client)

### Banco de Dados
- 🐘 **PostgreSQL 16**
- 🌍 **PostGIS** (extensão geoespacial)

### Inteligência Artificial
- 🐍 **Python 3**
- 🤖 **Google Gemini 2.5 Flash Lite**
- 📰 **feedparser** (RSS)
- 🔗 **psycopg2** (PostgreSQL driver)

### DevOps
- 🐳 **Docker** + **Docker Compose**
- 📦 Containerização completa
- 🌐 Deploy em VPS (Linux Ubuntu)

---

## 📦 Instalação

### Pré-requisitos

- Docker e Docker Compose instalados
- Git
- (Opcional) Node.js 18+ e Java 17+ para desenvolvimento local

### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/guilherme-gomes01/vbehub-prototipo.git
cd vbehub-prototipo
```

### 2️⃣ Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
# Banco de Dados
POSTGRES_USER=postgres
POSTGRES_PASSWORD=sua_senha_segura_aqui
POSTGRES_DB=vigimanaus

# JWT (mínimo 256 bits)
JWT_SECRET=sua-chave-secreta-super-segura-aqui-minimo-256-bits

# Google Gemini API (para ingestão de dados)
GOOGLE_API_KEY=sua_api_key_do_google

# Frontend
VITE_API_URL=http://localhost:8081/api
```

### 3️⃣ Inicie os Containers

```bash
docker-compose up -d
```

Isso irá iniciar:
- **PostgreSQL + PostGIS** (porta 5432)
- **API Backend** (porta 8081)
- **Frontend Web** (porta 80)

### 4️⃣ Verifique o Status

```bash
docker-compose ps
```

### 5️⃣ Acesse a Aplicação

- **Frontend:** http://localhost
- **API Backend:** http://localhost:8081/api
<!-- - **Swagger (em desenvolvimento):** http://localhost:8081/swagger-ui.html -->

---

## 🚀 Uso

### Login

**Credenciais padrão (protótipo exemplo):**
- **Email:** `teste@email.com`
- **Senha:** `senha`

⚠️ **Importante:** Altere as credenciais padrão em produção!

### Navegação

O sistema possui 3 telas principais:

#### 1. 📋 Kanban Board
- Visualize e gerencie o fluxo de sinais
- Arraste e solte cards entre colunas
- Filtre por fonte de dados e nível de risco
- Registre ações de resposta ao confirmar eventos

#### 2. 🗺️ Mapa de Sinais
- Visualização geoespacial dos sinais
- Marcadores coloridos:
  - 🔴 Vermelho: Alto risco
  - 🟠 Laranja: Médio risco
  - 🟢 Verde: Baixo risco
- Clique nos marcadores para ver detalhes

#### 3. 📊 Dashboard Analytics
- Gráfico de pizza: distribuição por risco
- Gráfico de barras: sinais por status
<!-- - Indicadores estratégicos
- Atualização em tempo real -->

### Ingestão de Dados (Opcional)

Para executar o script de ingestão de dados:

```bash
cd ingestao
python ingestao.py
```

**Requisitos:**
- Python 3.8+
- Dependências: `pip install -r requirements.txt`
- Variável de ambiente `GOOGLE_API_KEY` configurada

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (React)                        │
│  - React 19 + Vite                                   │
│  - Material-UI v7                                    │
│  - Recharts, Leaflet                                 │
│  - Context API (Auth)                                │
│  - Axios Interceptors                                │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/REST + JWT Bearer Token
┌──────────────────▼──────────────────────────────────┐
│          BACKEND (Spring Boot + Security)            │
│  - Spring Boot 3.5.8                                 │
│  - Spring Security 6                                 │
│  - JWT Authentication                                │
│  - BCrypt Password Encoder                           │
│  - RESTful API                                       │
└──────────────────┬──────────────────────────────────┘
                   │ JDBC
┌──────────────────▼──────────────────────────────────┐
│         BANCO DE DADOS (PostGIS)                     │
│  - PostgreSQL 16                                     │
│  - PostGIS (dados geoespaciais)                      │
│  - Queries agregadas para BI                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│         INGESTÃO DE DADOS (Python + AI)              │
│  - Google Gemini 2.0                                 │
│  - RSS Feed Parser (EIOS)                            │
│  - JSON Processing (Guardiões)                       │
└─────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Coleta:** Script Python busca dados do EIOS (RSS) e Guardiões da Saúde (JSON)
2. **Processamento IA:** Google Gemini analisa, classifica risco e geocodifica
3. **Persistência:** Dados estruturados são salvos no PostgreSQL
4. **API:** Spring Boot expõe endpoints REST
5. **Visualização:** React consome a API e renderiza na interface

---

## 📚 Documentação

### Estrutura de Diretórios

```
vbehub-prototipo/
├── api/                          # Backend Spring Boot
│   ├── src/main/java/com/vbehub/api/
│   │   ├── config/               # Configurações (Security, JWT)
│   │   ├── controller/           # REST Controllers
│   │   ├── service/              # Lógica de negócio
│   │   ├── repository/           # Acesso a dados
│   │   └── model/                # Entidades JPA
│   ├── pom.xml
│   └── Dockerfile
│
├── vbehub-web/                   # Frontend React
│   ├── src/
│   │   ├── components/           # Componentes React
│   │   ├── context/              # Context API (Auth)
│   │   └── services/             # Axios + Interceptors
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
│
├── ingestao/                     # Scripts Python
│   ├── ingestao.py               # Script principal
│   └── gds-json-exemplos.json    # Dados exemplo
│
├── docker-compose.yml            # Orquestração
├── init.sql                      # Schema + dados iniciais
└── .env.example                  # Template de configuração
```

### Endpoints da API

#### Autenticação
- `POST /api/auth/login` - Login de usuário

#### Sinais
- `GET /api/sinais` - Lista todos os sinais
- `PUT /api/sinais/{id}/status` - Atualiza status de um sinal
- `GET /api/stats/risco` - Estatísticas por nível de risco
- `GET /api/stats/status` - Estatísticas por status

### Modelo de Dados

**Principais entidades:**
- `sinal` - Sinais de alerta
- `fonte` - Fontes de dados (EIOS, Guardiões, etc)
- `analista` - Usuários do sistema
- `verificacao` - Registro de verificação de sinais
- `acao_resposta` - Ações de resposta a eventos

---

<!-- ## 🧪 Testes

### Backend

```bash
cd api
./mvnw test                    # Executar testes
./mvnw clean test jacoco:report  # Com coverage
```

Relatório de coverage: `target/site/jacoco/index.html`

### Frontend

```bash
cd vbehub-web
npm test                       # Executar testes
npm test -- --coverage         # Com coverage
```

Relatório de coverage: `coverage/lcov-report/index.html` 

---
-->

## 🤝 Contribuição

Contribuições são bem-vindas! Siga estes passos:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. Abra um **Pull Request**

### Diretrizes

- ✅ Escreva testes para novas funcionalidades
- ✅ Siga os padrões de código existentes
- ✅ Atualize a documentação quando necessário
- ✅ Descreva claramente suas mudanças no PR

---

## 🐛 Problemas Conhecidos
<!--
- ⚠️ CORS configurado como `*` (aceita qualquer origem) - **será restringido**
- ⚠️ Secret key JWT hardcoded no código - **migrar para .env**
- ⚠️ Sem paginação nos endpoints de listagem
- ⚠️ Faltam testes automatizados (em desenvolvimento)
-->
Veja a [lista completa de issues](https://github.com/guilherme-gomes01/vbehub-prototipo/issues).


---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

### Desenvolvimento
- **João Guilherme Silva Gomes** - Desenvolvedor Principal
  - 📧 Email: 2020003308@ifam.edu.br
  - 🎓 Aluno de Análise e Desenvolvimento de Sistemas - IFAM

### Orientação
- **Prof. Me. Rogério Luiz Araújo Carminé** - Orientador
  - 🏛️ Instituto Federal do Amazonas (IFAM)

---

## 🙏 Agradecimentos

- **IFAM** - Instituto Federal do Amazonas
- **CIEVS Manaus** - Centro de Informações Estratégicas em Vigilância em Saúde
- **OMS** - Organização Mundial da Saúde (plataforma EIOS)
- **ProEpi** - Associação Brasileira de Profissionais de Epidemiologia de Campo (Guardiões da Saúde)
- **Comunidade Open Source** - Pelas bibliotecas e ferramentas utilizadas

---

## 📞 Suporte

- 📧 Email: 2020003308@ifam.edu.br
- 🐛 Issues: [GitHub Issues](https://github.com/guilherme-gomes01/vbehub-prototipo/issues)
<!-- - 💬 Discussões: [GitHub Discussions](https://github.com/guilherme-gomes01/vbehub-prototipo/discussions) -->

---

## 📊 Status do Projeto

![GitHub last commit](https://img.shields.io/github/last-commit/guilherme-gomes01/vbehub-prototipo)
![GitHub issues](https://img.shields.io/github/issues/guilherme-gomes01/vbehub-prototipo)
![GitHub pull requests](https://img.shields.io/github/issues-pr/guilherme-gomes01/vbehub-prototipo)

---

<div align="center">

**Desenvolvido com ❤️ para a saúde pública**

[⬆ Voltar ao topo](#-vbe-hub---sistema-de-vigilância-baseada-em-eventos)

</div>
