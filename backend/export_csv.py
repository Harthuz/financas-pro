import os
import csv
import sys
from dotenv import load_dotenv
from notion_client import Client
from notion_client.errors import APIResponseError

# Configura o terminal para aceitar codificação UTF-8
sys.stdout.reconfigure(encoding='utf-8')

# Carrega variáveis do .env
load_dotenv()

# Caso não encontre as variáveis no local atual, tenta buscar no diretório pai (raiz do projeto)
if not os.getenv("NOTION_TOKEN"):
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

def fetch_and_export():
    if not NOTION_TOKEN or not DATABASE_ID:
        print("Erro: NOTION_TOKEN ou NOTION_DATABASE_ID ausentes no arquivo .env.")
        return

    print("Conectando à API do Notion...")
    notion = Client(auth=NOTION_TOKEN)

    try:
        print(f"Buscando dados do Data Source: {DATABASE_ID}...")
        results = []
        has_more = True
        start_cursor = None

        while has_more:
            response = notion.data_sources.query(
                data_source_id=DATABASE_ID,
                start_cursor=start_cursor
            )
            results.extend(response.get("results", []))
            has_more = response.get("has_more", False)
            start_cursor = response.get("next_cursor")

        total = len(results)
        print(f"Encontrado(s) {total} registro(s). Iniciando exportação para gastos.csv...")

        csv_file_path = "gastos.csv"
        
        # Define os cabeçalhos das colunas
        headers = ["ID", "Nome", "Valor", "Tipo", "Conta", "Data", "Criado Em"]

        with open(csv_file_path, mode="w", newline="", encoding="utf-8-sig") as file:
            writer = csv.writer(file, delimiter=";")
            writer.writerow(headers)

            for page in results:
                page_id = page.get("id")
                props = page.get("properties", {})

                # Extrai Nome (Title)
                name_list = props.get("Name", {}).get("title", [])
                name = "".join([t.get("plain_text", "") for t in name_list]) if name_list else ""

                # Extrai Valor (Number)
                valor = props.get("Valor", {}).get("number")
                if valor is None:
                    valor = ""

                # Extrai Tipo (Select)
                tipo_data = props.get("Tipo", {}).get("select")
                tipo = tipo_data.get("name", "") if tipo_data else ""

                # Extrai Conta (Select)
                conta_data = props.get("Conta", {}).get("select")
                conta = conta_data.get("name", "") if conta_data else ""

                # Extrai Data (Date)
                date_data = props.get("Date", {}).get("date")
                date = date_data.get("start", "") if date_data else ""

                # Extrai Criado Em (Created Time)
                criado_em = props.get("Created time", {}).get("created_time", "")

                writer.writerow([page_id, name, valor, tipo, conta, date, criado_em])

        print(f"Sucesso! Arquivo '{csv_file_path}' gerado com sucesso contendo {total} registros.")

    except APIResponseError as e:
        print(f"Erro na API do Notion: {e}")
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")

if __name__ == "__main__":
    fetch_and_export()
