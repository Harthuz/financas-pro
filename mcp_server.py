#!/usr/bin/env sys.executable
import os
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
import requests
from mcp.server.mcpserver import MCPServer

# URL base da API de gastos rodando no Docker (acessível na rede local na porta 8080 ou 8000)
API_BASE_URL = os.getenv("FINANCAS_API_URL", "http://192.168.15.15:8080")

app = MCPServer(name="Financas", version="1.2.0")

@app.tool()
def fazer_backup_csv(nome_arquivo: Optional[str] = None) -> str:
    """
    DIRETRIZ OBRIGATÓRIA: Sempre execute esta ferramenta ANTES de iniciar qualquer lote de modificação
    (adição, atualização ou exclusão de gastos, categorias ou contas).
    Baixa o backup completo dos gastos em formato CSV e salva na pasta Downloads (~/Downloads)
    do dispositivo que está executando a modificação via MCP.
    """
    try:
        res = requests.get(f"{API_BASE_URL}/api/exportar", timeout=15)
        res.raise_for_status()
        downloads_dir = Path.home() / "Downloads"
        downloads_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = nome_arquivo.strip() if nome_arquivo else f"gastos_backup_{timestamp}.csv"
        if not filename.endswith(".csv"):
            filename += ".csv"
        filepath = downloads_dir / filename
        filepath.write_bytes(res.content)
        return f"Backup CSV salvo com sucesso em: {filepath}"
    except Exception as e:
        return f"Erro ao gerar backup CSV: {str(e)}"

@app.tool()
def listar_gastos(busca: Optional[str] = None) -> str:
    """
    Lista todos os gastos cadastrados no sistema de controle financeiro (com filtro opcional por nome ou descrição).
    Retorna uma lista contendo ID, nome, descricao, valor (R$), tipo (categoria), conta (método de pagamento) e data.
    """
    try:
        params = {"search": busca.strip()} if busca and busca.strip() else {}
        res = requests.get(f"{API_BASE_URL}/api/gastos", params=params, timeout=10)
        res.raise_for_status()
        gastos = res.json()
        if not gastos:
            return "Nenhum gasto encontrado."
        return json.dumps(gastos, ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Erro ao buscar gastos: {str(e)}"

@app.tool()
def buscar_gastos(termo: str) -> str:
    """
    Pesquisa gastos pelo nome do gasto ou pela descrição detalhada (case-insensitive).
    """
    try:
        res = requests.get(f"{API_BASE_URL}/api/gastos", params={"search": termo.strip()}, timeout=10)
        res.raise_for_status()
        gastos = res.json()
        if not gastos:
            return f"Nenhum gasto encontrado para o termo '{termo}'."
        return json.dumps(gastos, ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Erro ao pesquisar gastos: {str(e)}"

@app.tool()
def adicionar_gasto(
    nome: str,
    valor: float,
    tipo: str,
    conta: str,
    data: str,
    descricao: Optional[str] = None,
    localizacao: Optional[str] = None
) -> str:
    """
    Cadastra um novo gasto no sistema de finanças.
    IMPORTANTE: Antes de qualquer lote de modificação, execute `fazer_backup_csv()` para salvar o backup na pasta Downloads local,
    e verifique as categorias/contas existentes com `obter_metadados()`.

    Parâmetros:
    - nome: Nome do gasto / item (ex: Mercado, Pizza, Almoço)
    - valor: Valor numérico em R$ (ex: 34.15)
    - tipo: Nome da Categoria (ex: Mercado, Lanche, Alimentação, Bebidas)
    - conta: Nome do Método de Pagamento / Conta (ex: Cartão Alimentação iFood, Crédito Nubank)
    - data: Data no formato YYYY-MM-DD (ex: 2026-08-20)
    - descricao: (Opcional) Descrição detalhada ou observações do gasto
    - localizacao: (Opcional) Nome do estabelecimento, endereço ou coordenadas onde a compra foi feita (compatível com Google Maps)
    """
    payload = {
        "nome": nome.strip(),
        "descricao": descricao.strip() if descricao else "",
        "localizacao": localizacao.strip() if localizacao else "",
        "valor": float(valor),
        "tipo": tipo.strip(),
        "conta": conta.strip(),
        "data": data.strip()
    }
    try:
        res = requests.post(f"{API_BASE_URL}/api/gastos", json=payload, timeout=10)
        if res.status_code == 200:
            data_res = res.json()
            return f"Gasto criado com sucesso! ID: {data_res.get('id')}"
        else:
            return f"Erro ao criar gasto (Status {res.status_code}): {res.text}"
    except Exception as e:
        return f"Erro de conexão ao criar gasto: {str(e)}"

@app.tool()
def atualizar_gasto(
    gasto_id: str,
    nome: Optional[str] = None,
    descricao: Optional[str] = None,
    localizacao: Optional[str] = None,
    valor: Optional[float] = None,
    tipo: Optional[str] = None,
    conta: Optional[str] = None,
    data: Optional[str] = None
) -> str:
    """
    Atualiza as informações de um gasto existente pelo seu ID.
    IMPORTANTE: Antes de qualquer lote de modificação, execute `fazer_backup_csv()` para salvar o backup na pasta Downloads local.
    """
    payload = {}
    if nome is not None:
        payload["nome"] = nome.strip()
    if descricao is not None:
        payload["descricao"] = descricao.strip()
    if localizacao is not None:
        payload["localizacao"] = localizacao.strip()
    if valor is not None:
        payload["valor"] = float(valor)
    if tipo is not None:
        payload["tipo"] = tipo.strip()
    if conta is not None:
        payload["conta"] = conta.strip()
    if data is not None:
        payload["data"] = data.strip()

    if not payload:
        return "Nenhum campo fornecido para atualização."

    try:
        res = requests.patch(f"{API_BASE_URL}/api/gastos/{gasto_id}", json=payload, timeout=10)
        if res.status_code == 200:
            return f"Gasto #{gasto_id} atualizado com sucesso."
        else:
            return f"Erro ao atualizar gasto (Status {res.status_code}): {res.text}"
    except Exception as e:
        return f"Erro ao atualizar gasto: {str(e)}"

@app.tool()
def excluir_gasto(gasto_id: str) -> str:
    """
    Exclui um gasto do sistema pelo seu ID.
    IMPORTANTE: Antes de qualquer lote de modificação, execute `fazer_backup_csv()` para salvar o backup na pasta Downloads local.
    """
    try:
        res = requests.delete(f"{API_BASE_URL}/api/gastos/{gasto_id}", timeout=10)
        if res.status_code == 200:
            return f"Gasto #{gasto_id} excluído com sucesso."
        else:
            return f"Erro ao excluir gasto (Status {res.status_code}): {res.text}"
    except Exception as e:
        return f"Erro ao excluir gasto: {str(e)}"

@app.tool()
def listar_categorias() -> str:
    """
    Lista todas as categorias cadastradas e a quantidade de compras associadas a cada uma.
    """
    try:
        res = requests.get(f"{API_BASE_URL}/api/categorias", timeout=10)
        res.raise_for_status()
        return json.dumps(res.json(), ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Erro ao listar categorias: {str(e)}"

@app.tool()
def adicionar_categoria(nome: str, cor: Optional[str] = None) -> str:
    """
    Cadastra uma nova categoria no sistema.
    """
    payload = {"nome": nome.strip()}
    if cor:
        payload["cor"] = cor.strip()
    try:
        res = requests.post(f"{API_BASE_URL}/api/categorias", json=payload, timeout=10)
        if res.status_code == 200:
            return f"Categoria criada com sucesso: {res.json().get('nome')}"
        else:
            return f"Erro ao criar categoria: {res.text}"
    except Exception as e:
        return f"Erro ao criar categoria: {str(e)}"

@app.tool()
def listar_contas() -> str:
    """
    Lista todos os métodos de pagamento / contas cadastrados no sistema.
    """
    try:
        res = requests.get(f"{API_BASE_URL}/api/contas", timeout=10)
        res.raise_for_status()
        return json.dumps(res.json(), ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Erro ao listar contas: {str(e)}"

@app.tool()
def adicionar_conta(nome: str, tipo_conta: Optional[str] = None, cor: Optional[str] = None) -> str:
    """
    Cadastra um novo método de pagamento ou conta no sistema.
    """
    payload = {"nome": nome.strip()}
    if tipo_conta:
        payload["tipo_conta"] = tipo_conta.strip()
    if cor:
        payload["cor"] = cor.strip()
    try:
        res = requests.post(f"{API_BASE_URL}/api/contas", json=payload, timeout=10)
        if res.status_code == 200:
            return f"Método de pagamento criado com sucesso: {res.json().get('nome')}"
        else:
            return f"Erro ao criar método de pagamento: {res.text}"
    except Exception as e:
        return f"Erro ao criar método de pagamento: {str(e)}"

@app.tool()
def obter_metadados() -> str:
    """
    Retorna a lista simplificada de todas as categorias e contas disponíveis para preenchimento rápido.
    """
    try:
        res = requests.get(f"{API_BASE_URL}/api/metadados", timeout=10)
        res.raise_for_status()
        return json.dumps(res.json(), ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Erro ao obter metadados: {str(e)}"

@app.tool()
def obter_tudo(busca: Optional[str] = None) -> str:
    """
    Retorna todos os dados consolidados do sistema (metadados, categorias, contas, stage e todos os gastos) de uma só vez.
    """
    try:
        params = {"search": busca.strip()} if busca and busca.strip() else {}
        res = requests.get(f"{API_BASE_URL}/api/tudo", params=params, timeout=15)
        res.raise_for_status()
        return json.dumps(res.json(), ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Erro ao obter todos os dados: {str(e)}"

@app.tool()
def listar_stage() -> str:
    """
    Lista todos os itens que estão na Zona de Stage (/stage) aguardando revisão/preenchimento ou confirmação de baixa pelo usuário.
    """
    try:
        res = requests.get(f"{API_BASE_URL}/api/stage", timeout=10)
        res.raise_for_status()
        return json.dumps(res.json(), ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Erro ao listar stage: {str(e)}"

@app.tool()
def adicionar_stage(
    itens: Optional[List[Dict[str, Any]]] = None,
    nome: Optional[str] = None,
    valor: Optional[float] = None,
    tipo: Optional[str] = None,
    conta: Optional[str] = None,
    data: Optional[str] = None,
    descricao: Optional[str] = None,
    localizacao: Optional[str] = None,
    fixo: Optional[bool] = False,
    texto_extrato: Optional[str] = None,
    observacao_agente: Optional[str] = None,
    limpar_anterior: Optional[bool] = False
) -> str:
    """
    Envia 1 compra ou um LOTE de compras extraídas de extratos bancários para a Zona de Stage (/stage).
    Os campos (nome, valor, tipo/categoria, conta, data, descricao, localizacao) podem ser enviados parcialmente
    ou em branco quando o agente não conseguir inferir com certeza, para que o usuário complete na página web /stage.
    """
    try:
        if itens:
            payload = {"itens": itens, "limpar_anterior": bool(limpar_anterior)}
        else:
            payload = {
                "limpar_anterior": bool(limpar_anterior),
                "itens": [{
                    "nome": nome or "",
                    "valor": valor,
                    "tipo": tipo or "",
                    "conta": conta or "",
                    "data": data or "",
                    "descricao": descricao or "",
                    "localizacao": localizacao or "",
                    "fixo": bool(fixo),
                    "texto_extrato": texto_extrato or "",
                    "observacao_agente": observacao_agente or ""
                }]
            }
        res = requests.post(f"{API_BASE_URL}/api/stage", json=payload, timeout=15)
        res.raise_for_status()
        return json.dumps(res.json(), ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Erro ao adicionar ao stage: {str(e)}"

@app.tool()
def atualizar_stage(
    stage_id: str,
    nome: Optional[str] = None,
    valor: Optional[float] = None,
    tipo: Optional[str] = None,
    conta: Optional[str] = None,
    data: Optional[str] = None,
    descricao: Optional[str] = None,
    localizacao: Optional[str] = None,
    fixo: Optional[bool] = None,
    texto_extrato: Optional[str] = None,
    observacao_agente: Optional[str] = None
) -> str:
    """
    Atualiza campos de um item no Stage pelo seu ID.
    """
    payload = {}
    for k, v in {
        "nome": nome, "valor": valor, "tipo": tipo, "conta": conta, "data": data,
        "descricao": descricao, "localizacao": localizacao, "fixo": fixo,
        "texto_extrato": texto_extrato, "observacao_agente": observacao_agente
    }.items():
        if v is not None:
            payload[k] = v
    try:
        res = requests.patch(f"{API_BASE_URL}/api/stage/{stage_id}", json=payload, timeout=10)
        res.raise_for_status()
        return json.dumps(res.json(), ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Erro ao atualizar item no stage: {str(e)}"

@app.tool()
def excluir_stage(stage_id: Optional[str] = None, limpar_tudo: Optional[bool] = False) -> str:
    """
    Remove um item específico do Stage (stage_id) ou limpa todo o Stage (limpar_tudo=True).
    """
    try:
        if limpar_tudo:
            res = requests.delete(f"{API_BASE_URL}/api/stage", timeout=10)
        else:
            res = requests.delete(f"{API_BASE_URL}/api/stage/{stage_id}", timeout=10)
        res.raise_for_status()
        return json.dumps(res.json(), ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Erro ao excluir do stage: {str(e)}"

@app.tool()
def comitar_stage(apenas_completos: Optional[bool] = True) -> str:
    """
    Dá baixa definitiva (commit) nos itens prontos que estão no Stage, gravando-os na tabela principal de gastos.
    """
    try:
        res = requests.post(
            f"{API_BASE_URL}/api/stage/commit",
            json={"apenas_completos": bool(apenas_completos)},
            timeout=15
        )
        res.raise_for_status()
        return json.dumps(res.json(), ensure_ascii=False, indent=2)
    except Exception as e:
        return f"Erro ao comitar stage: {str(e)}"

if __name__ == "__main__":
    import sys
    transport = os.getenv("MCP_TRANSPORT", "stdio")
    if "--sse" in sys.argv:
        transport = "sse"
    elif "--http" in sys.argv or "--streamable-http" in sys.argv:
        transport = "streamable-http"
    app.run(transport=transport)
