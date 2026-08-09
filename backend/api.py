import os
import csv
import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from dotenv import load_dotenv

from database import engine, Base, get_db
from models import Gasto, Categoria, Conta
from schemas import (
    GastoCreate, GastoUpdate, GastoResponse,
    CategoriaCreate, CategoriaUpdate, CategoriaResponse,
    ContaCreate, ContaUpdate, ContaResponse
)
from seed_db import run_seed

load_dotenv()

# Cria as tabelas na inicialização se ainda não existirem
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expenses PostgreSQL & Notion API")

# Habilita CORS para permitir comunicação com o frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Executa o seed automaticamente ao iniciar o backend
    try:
        run_seed()
    except Exception as e:
        print(f"Erro no seed automático: {e}")

# ==================== GASTO CRUD ====================

@app.get("/api/gastos")
def get_gastos(db: Session = Depends(get_db)):
    try:
        gastos = db.query(Gasto).order_by(Gasto.data.desc(), Gasto.id.desc()).all()
        result = []
        for g in gastos:
            result.append({
                "id": str(g.id),
                "nome": g.nome,
                "valor": float(g.valor),
                "tipo": g.categoria.nome if g.categoria else "",
                "conta": g.conta.nome if g.conta else "",
                "data": g.data.isoformat() if g.data else "",
                "criado_em": g.criado_em.isoformat() if g.criado_em else "",
                "categoria_id": g.categoria_id,
                "conta_id": g.conta_id
            })
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar gastos: {str(e)}")

@app.post("/api/gastos")
def create_gasto(gasto: GastoCreate, db: Session = Depends(get_db)):
    try:
        # Busca ou cria a categoria fornecida
        tipo_nome = gasto.tipo.strip()
        categoria = db.query(Categoria).filter(Categoria.nome.ilike(tipo_nome)).first()
        if not categoria:
            categoria = Categoria(nome=tipo_nome)
            db.add(categoria)
            db.flush()

        # Busca ou cria a conta fornecida
        conta_nome = gasto.conta.strip()
        conta = db.query(Conta).filter(Conta.nome.ilike(conta_nome)).first()
        if not conta:
            conta = Conta(nome=conta_nome)
            db.add(conta)
            db.flush()

        # Converte a data
        try:
            gasto_date = datetime.datetime.strptime(gasto.data, "%Y-%m-%d").date()
        except Exception:
            gasto_date = datetime.date.today()

        novo_gasto = Gasto(
            nome=gasto.nome,
            valor=gasto.valor,
            data=gasto_date,
            categoria_id=categoria.id,
            conta_id=conta.id
        )
        db.add(novo_gasto)
        db.commit()
        db.refresh(novo_gasto)

        return {"status": "success", "id": str(novo_gasto.id)}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar gasto: {str(e)}")

@app.patch("/api/gastos/{gasto_id}")
def update_gasto(gasto_id: str, gasto: GastoUpdate, db: Session = Depends(get_db)):
    try:
        g = db.query(Gasto).filter(Gasto.id == int(gasto_id)).first()
        if not g:
            raise HTTPException(status_code=404, detail="Gasto não encontrado")

        if gasto.nome is not None:
            g.nome = gasto.nome

        if gasto.valor is not None:
            g.valor = gasto.valor

        if gasto.data is not None:
            try:
                g.data = datetime.datetime.strptime(gasto.data, "%Y-%m-%d").date()
            except Exception:
                pass

        if gasto.tipo:
            tipo_nome = gasto.tipo.strip()
            categoria = db.query(Categoria).filter(Categoria.nome.ilike(tipo_nome)).first()
            if not categoria:
                categoria = Categoria(nome=tipo_nome)
                db.add(categoria)
                db.flush()
            g.categoria_id = categoria.id

        if gasto.conta:
            conta_nome = gasto.conta.strip()
            conta = db.query(Conta).filter(Conta.nome.ilike(conta_nome)).first()
            if not conta:
                conta = Conta(nome=conta_nome)
                db.add(conta)
                db.flush()
            g.conta_id = conta.id

        db.commit()
        return {"status": "success", "message": "Gasto atualizado com sucesso"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar gasto: {str(e)}")

@app.delete("/api/gastos/{gasto_id}")
def delete_gasto(gasto_id: str, db: Session = Depends(get_db)):
    try:
        g = db.query(Gasto).filter(Gasto.id == int(gasto_id)).first()
        if not g:
            raise HTTPException(status_code=404, detail="Gasto não encontrado")

        db.delete(g)
        db.commit()
        return {"status": "success", "message": "Gasto excluído com sucesso"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao excluir gasto: {str(e)}")

# ==================== CATEGORIAS CRUD (RESTRITIVO) ====================

@app.get("/api/categorias")
def get_categorias(db: Session = Depends(get_db)):
    try:
        categorias = db.query(Categoria).order_by(Categoria.nome.asc()).all()
        return [
            {
                "id": c.id,
                "nome": c.nome,
                "cor": c.cor or "",
                "gastos_count": len(c.gastos)
            }
            for c in categorias
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar categorias: {str(e)}")

@app.post("/api/categorias")
def create_categoria(categoria: CategoriaCreate, db: Session = Depends(get_db)):
    try:
        nome_limpo = categoria.nome.strip()
        existente = db.query(Categoria).filter(Categoria.nome.ilike(nome_limpo)).first()
        if existente:
            raise HTTPException(status_code=400, detail=f"A categoria '{nome_limpo}' já existe.")

        nova = Categoria(nome=nome_limpo, cor=categoria.cor)
        db.add(nova)
        db.commit()
        db.refresh(nova)
        return {"status": "success", "id": nova.id, "nome": nova.nome}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar categoria: {str(e)}")

@app.patch("/api/categorias/{categoria_id}")
def update_categoria(categoria_id: int, categoria: CategoriaUpdate, db: Session = Depends(get_db)):
    try:
        c = db.query(Categoria).filter(Categoria.id == categoria_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Categoria não encontrada.")

        if categoria.nome:
            nome_limpo = categoria.nome.strip()
            existente = db.query(Categoria).filter(Categoria.nome.ilike(nome_limpo), Categoria.id != categoria_id).first()
            if existente:
                raise HTTPException(status_code=400, detail=f"Já existe outra categoria com o nome '{nome_limpo}'.")
            c.nome = nome_limpo

        if categoria.cor is not None:
            c.cor = categoria.cor

        db.commit()
        return {"status": "success", "message": "Categoria atualizada com sucesso."}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar categoria: {str(e)}")

@app.delete("/api/categorias/{categoria_id}")
def delete_categoria(categoria_id: int, db: Session = Depends(get_db)):
    try:
        c = db.query(Categoria).filter(Categoria.id == categoria_id).first()
        if not c:
            raise HTTPException(status_code=404, detail="Categoria não encontrada.")

        # COMPORTAMENTO RESTRITIVO: Verifica se existem gastos vinculados
        count = db.query(Gasto).filter(Gasto.categoria_id == categoria_id).count()
        if count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Não é possível excluir a categoria '{c.nome}' pois existem {count} compra(s) vinculada(s) a ela. Remova ou altere as compras antes de excluir a categoria."
            )

        db.delete(c)
        db.commit()
        return {"status": "success", "message": f"Categoria '{c.nome}' excluída com sucesso."}

    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Operação negada pelo banco: Existem registros de compras vinculados a esta categoria."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao excluir categoria: {str(e)}")

# ==================== CONTAS / MÉTODOS DE PAGAMENTO CRUD (RESTRITIVO) ====================

@app.get("/api/contas")
def get_contas(db: Session = Depends(get_db)):
    try:
        contas = db.query(Conta).order_by(Conta.nome.asc()).all()
        return [
            {
                "id": c.id,
                "nome": c.nome,
                "tipo_conta": c.tipo_conta or "",
                "cor": c.cor or "",
                "gastos_count": len(c.gastos)
            }
            for c in contas
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar métodos de pagamento: {str(e)}")

@app.post("/api/contas")
def create_conta(conta: ContaCreate, db: Session = Depends(get_db)):
    try:
        nome_limpo = conta.nome.strip()
        existente = db.query(Conta).filter(Conta.nome.ilike(nome_limpo)).first()
        if existente:
            raise HTTPException(status_code=400, detail=f"O método de pagamento '{nome_limpo}' já existe.")

        nova = Conta(nome=nome_limpo, tipo_conta=conta.tipo_conta, cor=conta.cor)
        db.add(nova)
        db.commit()
        db.refresh(nova)
        return {"status": "success", "id": nova.id, "nome": nova.nome}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao criar método de pagamento: {str(e)}")

@app.patch("/api/contas/{conta_id}")
def update_conta(conta_id: int, conta: ContaUpdate, db: Session = Depends(get_db)):
    try:
        cta = db.query(Conta).filter(Conta.id == conta_id).first()
        if not cta:
            raise HTTPException(status_code=404, detail="Método de pagamento não encontrado.")

        if conta.nome:
            nome_limpo = conta.nome.strip()
            existente = db.query(Conta).filter(Conta.nome.ilike(nome_limpo), Conta.id != conta_id).first()
            if existente:
                raise HTTPException(status_code=400, detail=f"Já existe outro método com o nome '{nome_limpo}'.")
            cta.nome = nome_limpo

        if conta.tipo_conta is not None:
            cta.tipo_conta = conta.tipo_conta

        if conta.cor is not None:
            cta.cor = conta.cor

        db.commit()
        return {"status": "success", "message": "Método de pagamento atualizado com sucesso."}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar método de pagamento: {str(e)}")

@app.delete("/api/contas/{conta_id}")
def delete_conta(conta_id: int, db: Session = Depends(get_db)):
    try:
        cta = db.query(Conta).filter(Conta.id == conta_id).first()
        if not cta:
            raise HTTPException(status_code=404, detail="Método de pagamento não encontrado.")

        # COMPORTAMENTO RESTRITIVO: Verifica se existem gastos vinculados
        count = db.query(Gasto).filter(Gasto.conta_id == conta_id).count()
        if count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Não é possível excluir o método '{cta.nome}' pois existem {count} compra(s) vinculada(s) a ele. Remova ou altere as compras antes de excluir."
            )

        db.delete(cta)
        db.commit()
        return {"status": "success", "message": f"Método '{cta.nome}' excluído com sucesso."}

    except HTTPException:
        raise
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Operação negada pelo banco: Existem registros de compras vinculados a este método de pagamento."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao excluir método de pagamento: {str(e)}")

# ==================== METADADOS & EXPORTAR ====================

@app.get("/api/metadados")
def get_metadados(db: Session = Depends(get_db)):
    try:
        categorias = db.query(Categoria).order_by(Categoria.nome.asc()).all()
        contas = db.query(Conta).order_by(Conta.nome.asc()).all()
        
        tipos_list = [c.nome for c in categorias]
        contas_list = [c.nome for c in contas]

        return {"tipos": tipos_list, "contas": contas_list}
    except Exception as e:
        print(f"Erro ao computar metadados: {e}")
        return {"tipos": [], "contas": []}

@app.get("/api/exportar")
def exportar_csv(db: Session = Depends(get_db)):
    csv_file_path = "gastos.csv"
    try:
        gastos = db.query(Gasto).order_by(Gasto.data.desc()).all()
        headers = ["ID", "Nome", "Valor", "Tipo", "Conta", "Data", "Criado Em"]

        with open(csv_file_path, mode="w", newline="", encoding="utf-8-sig") as file:
            writer = csv.writer(file, delimiter=";")
            writer.writerow(headers)

            for g in gastos:
                writer.writerow([
                    str(g.id),
                    g.nome,
                    float(g.valor),
                    g.categoria.nome if g.categoria else "",
                    g.conta.nome if g.conta else "",
                    g.data.isoformat() if g.data else "",
                    g.criado_em.isoformat() if g.criado_em else ""
                ])

        return FileResponse(path=csv_file_path, filename="gastos.csv", media_type="text/csv")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao exportar CSV: {str(e)}")

@app.post("/api/seed")
def trigger_seed(db: Session = Depends(get_db)):
    try:
        res = run_seed(db)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
