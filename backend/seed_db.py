import os
import json
import datetime
from sqlalchemy.orm import Session
from database import engine, Base, SessionLocal
from models import Categoria, Conta, Gasto

def run_seed(db: Session = None):
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        # Garante que as tabelas existem no PostgreSQL
        Base.metadata.create_all(bind=engine)

        # Procura pelo arquivo notion_export.json
        base_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(base_dir, "..", "notion_export.json")
        if not os.path.exists(json_path):
            json_path = os.path.join(base_dir, "notion_export.json")

        if not os.path.exists(json_path):
            print(f"Aviso: Arquivo '{json_path}' não encontrado para povoamento.")
            return {"status": "warning", "message": "Arquivo notion_export.json não encontrado."}

        with open(json_path, "r", encoding="utf-8") as f:
            records = json.load(f)

        print(f"Carregados {len(records)} registros do notion_export.json")

        # 1. Popula Categorias
        tipos_set = set()
        contas_set = set()
        for r in records:
            if r.get("tipo"):
                tipos_set.add(r["tipo"].strip())
            if r.get("conta"):
                contas_set.add(r["conta"].strip())

        # Fallback de categorias e contas padrão se vazios
        default_tipos = [
            "Academia", "Alimentação", "Apresentação", "Cuidados Pessoais", 
            "Entretenimento e Lazer", "Esporte", "Internet", "Lanche/Doces", 
            "Livro", "Mercado", "Moradia", "Parcelas de Compras", "Profissional", 
            "Seguro", "Tarefa", "Transporte"
        ]
        default_contas = [
            "Cartão Alimentação iFood", "Cartão Mobilidade iFood", 
            "Conta Nubank", "Crédito Nubank"
        ]
        tipos_set.update(default_tipos)
        contas_set.update(default_contas)

        # Insere Categorias na base se não existirem
        categorias_map = {}
        for cat_nome in sorted(list(tipos_set)):
            if not cat_nome:
                continue
            cat = db.query(Categoria).filter(Categoria.nome == cat_nome).first()
            if not cat:
                cat = Categoria(nome=cat_nome)
                db.add(cat)
                db.flush()
            categorias_map[cat_nome.lower()] = cat.id

        # Insere Contas na base se não existirem
        contas_map = {}
        for conta_nome in sorted(list(contas_set)):
            if not conta_nome:
                continue
            cta = db.query(Conta).filter(Conta.nome == conta_nome).first()
            if not cta:
                cta = Conta(nome=conta_nome)
                db.add(cta)
                db.flush()
            contas_map[conta_nome.lower()] = cta.id

        db.commit()

        # Categoria e Conta padrão para valores não especificados
        cat_padrao_id = categorias_map.get("alimentação") or list(categorias_map.values())[0]
        cta_padrao_id = contas_map.get("conta nubank") or list(contas_map.values())[0]

        # 2. Popula Gastos
        gastos_inseridos = 0
        for r in records:
            notion_id = r.get("id")
            nome = (r.get("nome") or "").strip()
            
            # Extrai valor com segurança
            val_raw = r.get("valor")
            if isinstance(val_raw, (int, float)):
                valor = float(val_raw)
            elif isinstance(val_raw, str):
                try:
                    valor = float(val_raw)
                except ValueError:
                    valor = 0.0
            else:
                valor = 0.0

            # Ignora registros vazios sem nome e sem valor
            if not nome and valor == 0.0:
                continue

            if not nome:
                nome = "Gasto sem nome"
            
            nome = nome[:900]

            data_str = r.get("data")
            if not data_str or not isinstance(data_str, str):
                data_str = datetime.date.today().isoformat()
            else:
                data_str = data_str.split("T")[0]

            try:
                gasto_date = datetime.datetime.strptime(data_str, "%Y-%m-%d").date()
            except Exception:
                gasto_date = datetime.date.today()

            cat_id = categorias_map.get((r.get("tipo") or "").strip().lower(), cat_padrao_id)
            cta_id = contas_map.get((r.get("conta") or "").strip().lower(), cta_padrao_id)

            # Evita duplicatas se notion_id já existir
            if notion_id:
                existente = db.query(Gasto).filter(Gasto.notion_id == notion_id).first()
                if existente:
                    continue

            novo_gasto = Gasto(
                nome=nome,
                valor=valor,
                data=gasto_date,
                notion_id=notion_id,
                categoria_id=cat_id,
                conta_id=cta_id
            )
            db.add(novo_gasto)
            gastos_inseridos += 1

            if gastos_inseridos % 100 == 0:
                db.commit()

        db.commit()
        print(f"Povoamento concluído com sucesso! {gastos_inseridos} novos gastos inseridos.")
        return {
            "status": "success", 
            "gastos_inseridos": gastos_inseridos,
            "total_categorias": len(categorias_map),
            "total_contas": len(contas_map)
        }

    except Exception as e:
        db.rollback()
        print(f"Erro ao povoar banco de dados: {e}")
        return {"status": "error", "detail": str(e)}
    finally:
        if close_session:
            db.close()

if __name__ == "__main__":
    run_seed()
