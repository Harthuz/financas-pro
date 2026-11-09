# Diretrizes de Comunicação e Regras para Lançamento de Finanças (API & MCP na Porta 8080)

## 1. Regra Obrigatória de Backup (ANTES de Qualquer Modificação)
- **Sempre faça backup antes de qualquer lote de modificação**: Antes de adicionar, atualizar ou excluir qualquer gasto, categoria ou conta (seja 1 item ou vários em lote), é **OBRIGATÓRIO** salvar um backup atualizado em formato CSV na pasta `Downloads` (`~/Downloads`) do dispositivo que estiver realizando a modificação via MCP ou API.
- **Como fazer o backup via MCP**:
  - Chame a ferramenta `fazer_backup_csv()` antes de iniciar as chamadas de modificação (`adicionar_gasto`, `atualizar_gasto`, `excluir_gasto`, `adicionar_categoria`, `adicionar_conta`).
- **Como fazer o backup via HTTP / Terminal (na Porta 8080)**:
  - **Linux / macOS**:
    ```bash
    curl -fSL "http://192.168.15.15:8080/api/exportar" -o "$HOME/Downloads/gastos_backup_$(date +%Y%m%d_%H%M%S).csv"
    ```
  - **Windows (PowerShell)**:
    ```powershell
    Invoke-WebRequest -Uri "http://192.168.15.15:8080/api/exportar" -OutFile "$HOME\Downloads\gastos_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
    ```

## 2. Regras para Lançamento e Alteração de Finanças
Ao adicionar ou editar gastos utilizando a ferramenta de finanças (MCP ou API na porta 8080):
1. **Faça o Backup CSV em `Downloads` primeiro**: Nunca execute inserções, edições ou exclusões sem antes garantir que o backup CSV do estado atual foi salvo na pasta `Downloads` do dispositivo.
2. **Verifique primeiro**: Sempre verifique as categorias e contas existentes (`obter_metadados`, `GET /api/metadados` ou `GET /api/tudo`) antes de realizar inserções.
3. **Reutilize padrões**: Utilize o padrão exato de nomenclatura das categorias (`tipo`) e métodos de pagamento (`conta`) já cadastrados que melhor se encaixem no gasto atual.
4. **NUNCA crie sem permissão**: Se o gasto não se encaixar em nenhuma categoria ou conta existente, você deve pausar e **PERGUNTAR expressamente ao usuário** se ele deseja criar a categoria/conta nova ou utilizar uma já existente antes de prosseguir com a inserção.
5. **Formato de Dados**:
   - `valor`: Número decimal em reais (`float`, ex: `34.15`).
   - `data`: Formato ISO `YYYY-MM-DD` (ex: `2026-11-02`).
   - Parcelamentos automáticos: se o `nome` terminar com `1/N` ou `(1/N)` (ex: `Tênis - 1/6`), o backend gera automaticamente as parcelas `2/N` até `N/N` nos meses subsequentes.
6. **Não exiba investimentos zerados**: Ao consultar o planejamento (`obter_planejamento` ou `GET /api/planejamento`), ignore e não liste investimentos com saldo R$ 0,00 em respostas, análises ou previsões. A API já os omite da lista de ativos.

## 3. Endereços e Portas na Rede
- **IP na Rede Local (LAN)**: `192.168.15.15` (Tailscale: `<IP_TAILSCALE>`)
- **Porta Principal Unificada (8080) — UI + API REST + Servidor MCP HTTP/SSE**: `http://192.168.15.15:8080`
  - **Manifesto & Streamable-HTTP MCP**: `http://192.168.15.15:8080/mcp`
  - **SSE MCP Endpoint**: `http://192.168.15.15:8080/sse`
  - **Ferramentas MCP via REST**: `http://192.168.15.15:8080/mcp/tools`
  - **API REST Completa**: `http://192.168.15.15:8080/api/...`
  - **Diretrizes em Markdown**: `http://192.168.15.15:8080/DIRETRIZES.md` ou `http://192.168.15.15:8080/GEMINI.md`
  - **Download do `mcp_server.py`**: `http://192.168.15.15:8080/mcp_server.py`
- **Backend REST API Direto (Porta 8000)**: `http://192.168.15.15:8000`
- **Portal de Diretrizes (Porta 8084)**: `http://192.168.15.15:8084`

## 4. Como dar GET em Tudo e Dar Entrada de Novas Compras na Porta 8080 (`http://192.168.15.15:8080`)
### Leitura (GET)
- `GET http://192.168.15.15:8080/api/tudo` -> Retorna tudo de uma só vez (`{ metadados, categorias, contas, total_gastos, gastos }`).
- `GET http://192.168.15.15:8080/api/gastos` -> Lista todos os gastos cadastrados (aceita `?search=termo`).
- `GET http://192.168.15.15:8080/api/metadados` -> Retorna `{ "tipos": [...], "contas": [...], "locais": [...], "orcamentos": {...} }`.
- `GET http://192.168.15.15:8080/api/categorias` -> Lista categorias e contagem de gastos.
- `GET http://192.168.15.15:8080/api/contas` -> Lista contas/métodos de pagamento e contagem de gastos.
- `GET http://192.168.15.15:8080/api/exportar` -> Exporta todos os gastos em CSV (UTF-8 com BOM, separador `;`). **Usado para o backup obrigatório.**
- `GET http://192.168.15.15:8080/mcp` -> Retorna o manifesto completo do MCP, regras e ferramentas.

### Entrada de Novas Compras (POST) e Modificações
- `POST http://192.168.15.15:8080/api/gastos` (ou `POST http://192.168.15.15:8080/mcp/tools/adicionar_gasto`) -> Cria nova compra:
  ```json
  {
    "nome": "Mercado Semanal",
    "valor": 125.90,
    "tipo": "Mercado",
    "conta": "Cartão Alimentação iFood",
    "data": "2026-11-02",
    "descricao": "Compras do mês",
    "localizacao": "Supermercado"
  }
  ```
- `PATCH http://192.168.15.15:8080/api/gastos/:id` -> Atualiza gasto existente.
- `DELETE http://192.168.15.15:8080/api/gastos/:id` -> Exclui gasto pelo ID.

## 5. Como Conectar Clientes MCP na Rede (Porta 8080)
### Opção A — Conexão Direta via Rede (HTTP / SSE na porta 8080, sem instalar nada)
```json
{
  "mcpServers": {
    "financas": {
      "url": "http://192.168.15.15:8080/mcp"
    }
  }
}
```
*(Ou `"url": "http://192.168.15.15:8080/sse"` para clientes baseados em SSE).*

### Opção B — Via Script Python Local (`stdio`)
1. Baixe o script do servidor MCP direto da porta 8080:
   ```bash
   curl -fSL http://192.168.15.15:8080/mcp_server.py -o mcp_server.py
   ```
2. Configure o cliente MCP apontando para `http://192.168.15.15:8080`:
   ```json
   {
     "mcpServers": {
       "financas": {
         "command": "python3",
         "args": ["/caminho/para/mcp_server.py"],
         "env": {
           "FINANCAS_API_URL": "http://192.168.15.15:8080"
         }
       }
     }
   }
   ```
