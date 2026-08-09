# Diretrizes de Desenvolvimento - Notion Expenses API

Este arquivo serve como guia rápido para comandos comuns e regras de estilo do projeto.

## Comandos Úteis

### Backend (FastAPI)
- **Localização:** `backend/`
- **Iniciar Servidor de Desenvolvimento:** `uvicorn api:app --reload` (a partir da pasta `backend`) ou `uvicorn backend.api:app --reload` (a partir da raiz)
- **Executar script de terminal básico:** `python backend/main.py`
- **Exportar CSV manualmente:** `python backend/export_csv.py`
- **Instalar dependências:** `pip install -r backend/requirements.txt`

### Frontend (React + Vite)
- **Localização:** `frontend/`
- **Instalar dependências:** `npm install`
- **Iniciar Servidor de Desenvolvimento:** `npm run dev`
- **Gerar Build de Produção:** `npm run build`
- **Executar Linter:** `npm run lint`

### Docker
- **Subir a aplicação completa:** `docker compose up --build`
- **Parar e remover os containers:** `docker compose down`

## Estilo de Código e Diretrizes

### Backend (Python)
- Usar FastAPI para APIs e Pydantic para validação de dados.
- Configurações externas devem vir do `.env` na raiz do projeto utilizando `dotenv` (com suporte a fallback no diretório pai).
- Utilizar tratamento de erro estruturado com `HTTPException` e retornos JSON determinísticos.

### Frontend (React)
- Desenvolvido com React + Vite.
- Componentes e estilização baseados em `@mui/material` (Material UI) e Recharts para visualizações de gráficos.
- Conectar diretamente a `http://localhost:8000` via chamadas `fetch` nativas do navegador.
- Manter o estado centralizado no componente principal ou usar hooks customizados de forma simples.
