-- Script de Inicialização do Banco de Dados para Supabase
-- Executar no SQL Editor do Dashboard do Supabase

-- 1. Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    cor VARCHAR(30),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Contas / Métodos de Pagamento
CREATE TABLE IF NOT EXISTS public.contas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    tipo_conta VARCHAR(50),
    cor VARCHAR(30),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Gastos / Compras
CREATE TABLE IF NOT EXISTS public.gastos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(1000) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data DATE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    notion_id VARCHAR(100) UNIQUE,
    categoria_id INTEGER NOT NULL REFERENCES public.categorias(id) ON DELETE RESTRICT,
    conta_id INTEGER NOT NULL REFERENCES public.contas(id) ON DELETE RESTRICT
);

-- Criar Índices para Otimização de Consultas
CREATE INDEX IF NOT EXISTS idx_gastos_data ON public.gastos(data DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria_id ON public.gastos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_gastos_conta_id ON public.gastos(conta_id);
CREATE INDEX IF NOT EXISTS idx_categorias_nome ON public.categorias(nome);
CREATE INDEX IF NOT EXISTS idx_contas_nome ON public.contas(nome);

-- Habilitar Row Level Security (RLS) para acesso via Supabase Client / API
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (Leitura e Escrita total)
DROP POLICY IF EXISTS "Permitir acesso total a categorias" ON public.categorias;
CREATE POLICY "Permitir acesso total a categorias" ON public.categorias FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total a contas" ON public.contas;
CREATE POLICY "Permitir acesso total a contas" ON public.contas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso total a gastos" ON public.gastos;
CREATE POLICY "Permitir acesso total a gastos" ON public.gastos FOR ALL USING (true) WITH CHECK (true);
