# Finanças Pro

Dashboard pessoal de controle de gastos, com gráficos, metas por categoria e uma **zona de Stage** onde um agente de IA (via **MCP** ou API REST) deposita lançamentos lidos de extratos bancários para revisão e baixa em lote, numa interface de planilha.

> Todos os prints abaixo usam **dados fictícios**.

![Dashboard](prints/01-dashboard.png)

## Funcionalidades

- **Dashboard**: total do período, categoria com maior gasto, maior compra e navegação por período (mês a mês, "este mês", "30 dias"...).
- **5 visualizações**: radar hexagonal, evolução mês a mês, ranking em barras com orçamento, rosca e cartões/contas.
- **Metas mensais por categoria**: acompanhamento do orçamento.
- **Filtro de categorias**: com todas selecionadas, um clique isola uma categoria; os outros cliques adicionam ou removem. Todas continuam visíveis.
- **Lançamentos**: busca, ordenação, agrupamento por categoria, compras parceladas (`Nome - 1/N` gera as N parcelas) e link para o Google Maps.
- **Stage de extratos (`/stage`)**: planilha editável para revisar o que o agente inferiu.
  - Cabeçalho fixo, largura total, colunas fixas e células obrigatórias vazias destacadas.
  - Navegação por teclado como numa planilha: setas, Enter/F2 para editar, Esc para sair da edição, Tab, Home/End.
  - Ordenação por coluna, seleção de todos / só prontos e preenchimento de categoria/conta em lote.
  - **Dar baixa** em 1 clique, com backup CSV automático antes de gravar.
- **Servidor MCP**: ferramentas para listar, adicionar, atualizar e excluir gastos, categorias, contas e itens do Stage.
- **PWA**: instalável no celular, com layout mobile-first.

## Prints

| Gráficos e orçamento | Filtro de categorias |
| --- | --- |
| ![Gráficos](prints/02-graficos.png) | ![Filtro de categorias](prints/03-filtro-categorias.png) |

**Lançamentos**

![Lançamentos](prints/04-lancamentos.png)

**Stage de extratos: revisão em planilha**

![Stage em planilha](prints/05-stage-planilha.png)

**Stage: ordenação por coluna e edição com autocompletar**

![Stage editando](prints/06-stage-edicao.png)

| Mobile: dashboard | Mobile: Stage |
| --- | --- |
| ![Mobile dashboard](prints/07-mobile-dashboard.png) | ![Mobile Stage](prints/08-mobile-stage.png) |

## Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | React + Vite, Material UI, Recharts, PWA (`vite-plugin-pwa`) |
| Backend | Node.js + Express (`backend/server.js`), PostgreSQL (`pg`) |
| Banco | PostgreSQL 16 (Docker) ou Supabase (`supabase_schema.sql`) |
| Agentes | Servidor MCP em Python (`mcp_server.py`) e MCP HTTP/SSE embutido no backend |
| Proxy | Nginx servindo a UI e encaminhando `/api`, `/mcp` e `/sse` na porta 8080 |

## Estrutura

```text
.
├── backend/            # API Express + MCP HTTP (server.js); scripts legados em Python
├── frontend/           # React + Vite
│   ├── src/App.jsx     # Dashboard
│   ├── src/StagePage.jsx  # Stage de extratos (planilha)
│   └── nginx.conf      # Proxy da porta 8080
├── diretrizes/         # Página e JSON com as regras para agentes (porta 8084)
├── mcp_server.py       # Servidor MCP (stdio) que conversa com a API
├── prints/             # Capturas usadas neste README
├── supabase_*.sql      # Esquema e políticas para rodar no Supabase
└── docker-compose.yml
```

## Como executar

### Docker (recomendado)

```bash
cp .env.example .env
docker network create npm_network   # rede externa usada pelo compose (uma vez só)
docker compose up -d --build
```

| Serviço | URL |
| --- | --- |
| UI + API + MCP | http://localhost:8080 (Stage em `/stage`) |
| API direta | http://localhost:8000 |
| Diretrizes para agentes | http://localhost:8084 |
| PostgreSQL | `localhost:5433` (usuário/senha `postgres`) |

### Desenvolvimento

```bash
# backend
cd backend && npm install && npm run dev        # http://localhost:8000

# frontend
cd frontend && npm install && npm run dev       # http://localhost:5173
```

Em `:5173`, o frontend chama a API em `:8000` automaticamente.

## API e MCP

Principais rotas (também disponíveis em `/mcp/...`):

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/tudo` | Gastos + categorias + contas + metadados |
| `GET/POST` | `/api/gastos` | Lista (`?search=`) / cria gasto (`Nome - 1/N` gera parcelas) |
| `PATCH/DELETE` | `/api/gastos/:id` | Atualiza / exclui |
| `GET` | `/api/metadados` | Categorias, contas, locais e orçamentos |
| `GET` | `/api/exportar` | Backup CSV completo |
| `GET/POST/PATCH/DELETE` | `/api/stage` | Itens em revisão no Stage |
| `POST` | `/api/stage/commit` | Dá baixa nos itens prontos |

Exemplo de envio de um lote do extrato para o Stage (campos desconhecidos podem ir vazios):

```http
POST /api/stage
Content-Type: application/json

{
  "limpar_anterior": false,
  "itens": [
    {
      "data": "2026-11-02",
      "nome": "",
      "valor": 64.90,
      "tipo": "",
      "conta": "Cartão de Crédito A",
      "texto_extrato": "02/11 PAG*ESTABELEC R$ 64,90",
      "observacao_agente": "Não identifiquei o item nem a categoria"
    }
  ]
}
```

**MCP**: conecte um cliente em `http://<host>:8080/mcp` (Streamable HTTP) ou `http://<host>:8080/sse`, ou rode `python mcp_server.py` via stdio, definindo `FINANCAS_API_URL`. As regras para agentes (por exemplo, backup CSV antes de qualquer alteração) estão em `GEMINI.md` e `diretrizes/`.

## Prints

Os prints são gerados com Playwright, interceptando toda a API com dados fictícios. Assim, nenhum dado real aparece nas imagens. Com o app rodando:

```bash
npm i -D playwright && npx playwright install chromium
BASE_URL=http://localhost:8080 node prints/gerar-prints.mjs
```
