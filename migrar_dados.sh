#!/bin/bash
echo "Extraindo dados do banco local nativo (porta 5432)..."
sudo -u postgres psql -d gastos_db -t -c "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (SELECT * FROM gastos) t;" > /tmp/gastos_antigos.json
sudo -u postgres psql -d gastos_db -t -c "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (SELECT * FROM categorias) t;" > /tmp/categorias_antigas.json
sudo -u postgres psql -d gastos_db -t -c "SELECT COALESCE(json_agg(row_to_json(t)), '[]') FROM (SELECT * FROM contas) t;" > /tmp/contas_antigas.json

echo "Dados extraídos. Preparando migração para o Docker (porta 5433)..."

# Garante que o python e o psycopg2 estão disponíveis
python3 -m venv /tmp/venv_migracao
/tmp/venv_migracao/bin/pip install psycopg2-binary > /dev/null 2>&1

/tmp/venv_migracao/bin/python << 'EOF'
import json
import psycopg2
import sys

def load_json(path):
    try:
        with open(path, 'r') as f:
            data = f.read().strip()
            if not data: return []
            return json.loads(data)
    except Exception as e:
        print(f"Erro ao ler {path}: {e}")
        return []

gastos_old = load_json('/tmp/gastos_antigos.json')
categorias_old = load_json('/tmp/categorias_antigas.json')
contas_old = load_json('/tmp/contas_antigas.json')

if not gastos_old:
    print("Nenhum dado encontrado no banco antigo. O banco estava vazio ou não existia.")
    sys.exit(0)

print(f"Encontrados {len(gastos_old)} gastos no banco antigo. Analisando duplicidades...")

try:
    conn = psycopg2.connect(host="localhost", port=5433, user="postgres", password="postgres", dbname="gastos_db")
    cur = conn.cursor()
except Exception as e:
    print(f"Erro ao conectar no banco do Docker: {e}")
    sys.exit(1)

# Map old categories
cat_map = {}
for c in categorias_old:
    cur.execute("SELECT id FROM categorias WHERE LOWER(nome) = LOWER(%s)", (c['nome'],))
    row = cur.fetchone()
    if row:
        cat_map[c['id']] = row[0]
    else:
        cur.execute("INSERT INTO categorias (nome, cor) VALUES (%s, %s) RETURNING id", (c['nome'], c.get('cor')))
        cat_map[c['id']] = cur.fetchone()[0]

# Map old contas
conta_map = {}
for c in contas_old:
    cur.execute("SELECT id FROM contas WHERE LOWER(nome) = LOWER(%s)", (c['nome'],))
    row = cur.fetchone()
    if row:
        conta_map[c['id']] = row[0]
    else:
        cur.execute("INSERT INTO contas (nome, tipo_conta, cor) VALUES (%s, %s, %s) RETURNING id", (c['nome'], c.get('tipo_conta'), c.get('cor')))
        conta_map[c['id']] = cur.fetchone()[0]

inserted = 0
skipped = 0

for g in gastos_old:
    # Remove timezone and just use date
    data_formatada = g['data']
    
    # Check if exists to prevent duplicates
    cur.execute("SELECT id FROM gastos WHERE nome = %s AND valor = %s AND data = %s", (g['nome'], g['valor'], data_formatada))
    if cur.fetchone():
        skipped += 1
        continue
    
    new_cat_id = cat_map.get(g['categoria_id'])
    new_conta_id = conta_map.get(g['conta_id'])
    
    if not new_cat_id or not new_conta_id:
        continue # fallback
        
    cur.execute("""
        INSERT INTO gastos (nome, valor, data, criado_em, notion_id, categoria_id, conta_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (g['nome'], g['valor'], data_formatada, g['criado_em'], g.get('notion_id'), new_cat_id, new_conta_id))
    inserted += 1

conn.commit()
cur.close()
conn.close()

print(f"✅ Migração 100% concluída!")
print(f"   - Lançamentos novos inseridos: {inserted}")
print(f"   - Lançamentos ignorados (já existiam no Docker): {skipped}")
EOF
