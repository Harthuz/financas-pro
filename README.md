# Controle de Gastos com Notion API

Este projeto é um sistema de controle de despesas integrado com a API do Notion. Ele possui uma divisão clara entre o **Backend** (feito em Python com FastAPI) e o **Frontend** (feito em React com Vite e Material UI).

## 📁 Estrutura de Pastas

```text
NotionAPI/
├── backend/               # Código do Backend (FastAPI)
│   ├── api.py            # Servidor FastAPI com as rotas
│   ├── main.py           # Script de teste/consulta simples no terminal
│   ├── export_csv.py     # Script independente para exportar despesas para CSV
│   └── requirements.txt  # Dependências Python do backend
├── frontend/              # Código do Frontend (React + Vite)
│   ├── src/              # Componentes e lógica da aplicação
│   ├── package.json      # Dependências e scripts do frontend
│   └── ...
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

Se você possuir o **Docker** e o **Docker Compose** instalados na sua máquina:

1. Na raiz do projeto, execute o comando:
   ```bash
   docker compose up --build
   ```
2. Acesse as aplicações:
   - **Frontend:** `http://localhost` (na porta padrão 80)
   - **Backend:** `http://localhost:8000`
