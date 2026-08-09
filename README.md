# Controle de Gastos com Notion API

Este projeto é um sistema de controle de despesas integrado com a API do Notion. Ele possui uma divisão clara entre o **Backend** (feito em Python com FastAPI) e o **Frontend** (feito em React com Vite e Material UI).

## 📁 Estrutura de Pastas

```text
NotionAPI/
├── backend/               # Código do Backend (FastAPI e Node/Express)
│   ├── api.py            # Servidor FastAPI (Python) com as rotas
│   ├── server.js         # Servidor Express (Node.js) utilizado no container Docker
│   ├── main.py           # Script de teste/consulta simples no terminal
│   ├── export_csv.py     # Script independente para exportar despesas para CSV
│   ├── Dockerfile        # Configuração da imagem Docker do backend
│   └── requirements.txt  # Dependências Python do backend
├── frontend/              # Código do Frontend (React + Vite + Material UI)
│   ├── src/              # Componentes e lógica da aplicação
│   ├── package.json      # Dependências e scripts do frontend
│   ├── Dockerfile        # Configuração da imagem Docker (Multi-stage com Nginx)
│   └── ...
├── docker-compose.yml    # Orquestração dos serviços (PostgreSQL, Backend, Frontend)
├── .env                  # Arquivo de configuração de credenciais (Notion)
├── .gitignore            # Arquivos ignorados pelo Git
└── README.md             # Documentação do projeto (este arquivo)
```

---

## ⚙️ Configuração Inicial

Na raiz do projeto, crie ou edite o arquivo `.env` com as seguintes credenciais:

```env
NOTION_TOKEN=seu_token_do_notion_aqui
NOTION_DATABASE_ID=seu_id_do_banco_de_dados_aqui
```

---

## 🚀 Como Executar

### 1. Executando o Backend (Python + FastAPI)

1. Navegue até a pasta `backend`:
   ```bash
   cd backend
   ```
2. (Opcional) Crie e ative um ambiente virtual:
   ```bash
   python -m venv venv
   # No Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # No Linux/macOS:
   source venv/bin/activate
   ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Inicie o servidor FastAPI:
   ```bash
   uvicorn api:app --reload
   ```
   O backend estará disponível em `http://localhost:8000`.

### 2. Executando o Frontend (React + Vite)

1. Navegue até a pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependências com npm:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   O frontend estará disponível em `http://localhost:5173`.

### 3. Executando via Docker (Orquestração Completa)

O projeto possui suporte completo a **Docker** e **Docker Compose**, subindo uma pilha isolada composta por três serviços:

- **`db`**: Banco de dados PostgreSQL 16 (`gastos_db`) executando na porta `5432`.
- **`backend`**: Servidor de API executando na porta `8000`.
- **`frontend`**: Aplicação React servida via Nginx na porta `8080`.

#### Passo a Passo para Execução:

1. Garanta que o arquivo `.env` está configurado na raiz do projeto com suas credenciais do Notion.
2. Na raiz do projeto, inicie os containers:
   ```bash
   docker compose up --build
   ```
   *Dica: Adicione `-d` ao final do comando para executar em segundo plano (detached mode):*
   ```bash
   docker compose up --build -d
   ```
3. Acesse os serviços disponíveis:
   - **Frontend (React + Nginx):** `http://localhost:8080`
   - **Backend (API):** `http://localhost:8000`
   - **PostgreSQL:** `localhost:5432` *(User: `postgres`, Pass: `postgres`, DB: `gastos_db`)*

#### Comandos Úteis do Docker:

- **Verificar status dos containers:**
  ```bash
  docker compose ps
  ```
- **Acompanhar os logs em tempo real:**
  ```bash
  docker compose logs -f
  # Ou logs de um serviço específico (ex: backend):
  docker compose logs -f backend
  ```
- **Parar e remover os containers:**
  ```bash
  docker compose down
  ```
- **Parar os containers e apagar o volume de dados do PostgreSQL:**
  ```bash
  docker compose down -v
  ```
- **Recompilar e reiniciar apenas um serviço:**
  ```bash
  docker compose up -d --build backend
  ```
