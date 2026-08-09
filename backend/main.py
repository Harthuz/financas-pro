import os
import json
from dotenv import load_dotenv
from notion_client import Client
from notion_client.errors import APIResponseError

# Carrega variáveis do .env
load_dotenv()

# Caso não encontre as variáveis no local atual, tenta buscar no diretório pai (raiz do projeto)
if not os.getenv("NOTION_TOKEN"):
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))

NOTION_TOKEN = os.getenv("NOTION_TOKEN")
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

def main():
    if not NOTION_TOKEN:
        print("Erro: NOTION_TOKEN não encontrado no arquivo .env.")
        return
    if not DATABASE_ID:
        print("Erro: NOTION_DATABASE_ID não encontrado no arquivo .env.")
        return

    print("Conectando à API do Notion...")
    notion = Client(auth=NOTION_TOKEN)

    try:
        print(f"Buscando metadados da database: {DATABASE_ID}...")
        # 1. Recupera os metadados da database para extrair o data_source_id (Notion API v2025-09-03)
        db_meta = notion.databases.retrieve(database_id=DATABASE_ID)
        
        data_sources = db_meta.get("data_sources", [])
        if not data_sources:
            print("Erro: Nenhum data source associado a esta database foi encontrado.")
            return
            
        data_source_id = data_sources[0]["id"]
        print(f"Data Source ID encontrado: {data_source_id}")
        
        # 2. Faz a query no data source correspondente lidando com paginação
        print("Buscando registros...")
        results = []
        has_more = True
        start_cursor = None

        while has_more:
            response = notion.data_sources.query(
                data_source_id=data_source_id,
                start_cursor=start_cursor
            )
            results.extend(response.get("results", []))
            has_more = response.get("has_more", False)
            start_cursor = response.get("next_cursor")

        total_records = len(results)
        print(f"Sucesso! Encontrado(s) {total_records} registro(s).\n")

        if total_records == 0:
            print("Nenhum registro encontrado na base de dados.")
            return

        # Exibe os dados formatados
        for index, page in enumerate(results, 1):
            print(f"--- Registro {index} (ID: {page['id']}) ---")
            
            # Helper para extrair as propriedades simplificadas
            properties = page.get("properties", {})
            simplified_props = {}
            
            for prop_name, prop_data in properties.items():
                prop_type = prop_data.get("type")
                val = None
                
                if prop_type == "title":
                    title_list = prop_data.get("title", [])
                    val = "".join([t.get("plain_text", "") for t in title_list]) if title_list else ""
                elif prop_type == "rich_text":
                    text_list = prop_data.get("rich_text", [])
                    val = "".join([t.get("plain_text", "") for t in text_list]) if text_list else ""
                elif prop_type == "number":
                    val = prop_data.get("number")
                elif prop_type == "select":
                    select_data = prop_data.get("select")
                    val = select_data.get("name") if select_data else None
                elif prop_type == "multi_select":
                    multi_select_list = prop_data.get("multi_select", [])
                    val = [item.get("name") for item in multi_select_list]
                elif prop_type == "date":
                    date_data = prop_data.get("date")
                    val = date_data.get("start") if date_data else None
                elif prop_type == "checkbox":
                    val = prop_data.get("checkbox")
                elif prop_type == "url":
                    val = prop_data.get("url")
                elif prop_type == "email":
                    val = prop_data.get("email")
                elif prop_type == "phone_number":
                    val = prop_data.get("phone_number")
                elif prop_type == "people":
                    people_list = prop_data.get("people", [])
                    val = [person.get("name", person.get("id")) for person in people_list]
                elif prop_type == "relation":
                    relation_list = prop_data.get("relation", [])
                    val = [rel.get("id") for rel in relation_list]
                elif prop_type == "rollup":
                    rollup_data = prop_data.get("rollup", {})
                    val = rollup_data.get("value", rollup_data.get("type"))
                elif prop_type == "formula":
                    formula_data = prop_data.get("formula", {})
                    val = formula_data.get("value", formula_data.get("type"))
                else:
                    val = prop_data
                
                simplified_props[prop_name] = val
            
            print(json.dumps(simplified_props, indent=2, ensure_ascii=False))
            print()

    except APIResponseError as e:
        print(f"Erro na API do Notion: {e}")
        print("\nDica: Verifique se o token é válido e se a database foi compartilhada com a conexão/integração.")
    except Exception as e:
        print(f"Ocorreu um erro inesperado: {e}")

if __name__ == "__main__":
    main()
