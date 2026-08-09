import datetime
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(100), unique=True, nullable=False, index=True)
    cor = Column(String(30), nullable=True)
    criado_em = Column(DateTime, default=datetime.datetime.utcnow)

    # Relacionamento com Gastos
    gastos = relationship("Gasto", back_populates="categoria", passive_deletes="RESTRICT")

class Conta(Base):
    __tablename__ = "contas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(100), unique=True, nullable=False, index=True)
    tipo_conta = Column(String(50), nullable=True) # ex: Crédito, Débito, VR, VA, Pix
    cor = Column(String(30), nullable=True)
    criado_em = Column(DateTime, default=datetime.datetime.utcnow)

    # Relacionamento com Gastos
    gastos = relationship("Gasto", back_populates="conta", passive_deletes="RESTRICT")

class Gasto(Base):
    __tablename__ = "gastos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(1000), nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    data = Column(Date, nullable=False)
    criado_em = Column(DateTime, default=datetime.datetime.utcnow)
    notion_id = Column(String(100), nullable=True, unique=True)

    # Foreign Keys restritivas
    categoria_id = Column(Integer, ForeignKey("categorias.id", ondelete="RESTRICT"), nullable=False)
    conta_id = Column(Integer, ForeignKey("contas.id", ondelete="RESTRICT"), nullable=False)

    # Relacionamentos
    categoria = relationship("Categoria", back_populates="gastos")
    conta = relationship("Conta", back_populates="gastos")
