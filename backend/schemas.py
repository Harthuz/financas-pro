from pydantic import BaseModel
from typing import Optional
from datetime import date as date_type, datetime

# --- Categoria Schemas ---
class CategoriaBase(BaseModel):
    nome: str
    cor: Optional[str] = None

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaUpdate(BaseModel):
    nome: Optional[str] = None
    cor: Optional[str] = None

class CategoriaResponse(CategoriaBase):
    id: int
    criado_em: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Conta Schemas ---
class ContaBase(BaseModel):
    nome: str
    tipo_conta: Optional[str] = None
    cor: Optional[str] = None

class ContaCreate(ContaBase):
    pass

class ContaUpdate(BaseModel):
    nome: Optional[str] = None
    tipo_conta: Optional[str] = None
    cor: Optional[str] = None

class ContaResponse(ContaBase):
    id: int
    criado_em: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Gasto Schemas ---
class GastoCreate(BaseModel):
    nome: str
    valor: float
    tipo: str  # Nome da Categoria ou ID da Categoria em string
    conta: str # Nome da Conta ou ID da Conta em string
    data: str  # YYYY-MM-DD

class GastoUpdate(BaseModel):
    nome: Optional[str] = None
    valor: Optional[float] = None
    tipo: Optional[str] = None
    conta: Optional[str] = None
    data: Optional[str] = None

class GastoResponse(BaseModel):
    id: int
    nome: str
    valor: float
    tipo: str
    conta: str
    data: str
    criado_em: str
    categoria_id: int
    conta_id: int
    notion_id: Optional[str] = None

    class Config:
        from_attributes = True
