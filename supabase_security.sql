-- Script de Segurança e Políticas RLS por Usuário no Supabase

-- 1. Adicionar a coluna user_id referenciando auth.users em todas as tabelas
ALTER TABLE public.categorias 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE public.contas 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

ALTER TABLE public.gastos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- Criar Índices no user_id para alta performance em buscas por usuário
CREATE INDEX IF NOT EXISTS idx_categorias_user_id ON public.categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_contas_user_id ON public.contas(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_user_id ON public.gastos(user_id);

-- 2. Habilitar RLS em todas as tabelas
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas ou permissivas demais
DROP POLICY IF EXISTS "Permitir acesso total a categorias" ON public.categorias;
DROP POLICY IF EXISTS "Permitir acesso total a contas" ON public.contas;
DROP POLICY IF EXISTS "Permitir acesso total a gastos" ON public.gastos;

DROP POLICY IF EXISTS "Usuários autenticados gerenciam suas próprias categorias" ON public.categorias;
DROP POLICY IF EXISTS "Usuários autenticados gerenciam suas próprias contas" ON public.contas;
DROP POLICY IF EXISTS "Usuários autenticados gerenciam seus próprios gastos" ON public.gastos;

DROP POLICY IF EXISTS "Service role tem acesso total a categorias" ON public.categorias;
DROP POLICY IF EXISTS "Service role tem acesso total a contas" ON public.contas;
DROP POLICY IF EXISTS "Service role tem acesso total a gastos" ON public.gastos;

-- 4. Definir Políticas de RLS por Usuário Autenticado (auth.uid() = user_id ou user_id IS NULL para globais)
CREATE POLICY "Usuários autenticados gerenciam suas próprias categorias" 
ON public.categorias 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL) 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Usuários autenticados gerenciam suas próprias contas" 
ON public.contas 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL) 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Usuários autenticados gerenciam seus próprios gastos" 
ON public.gastos 
FOR ALL 
TO authenticated 
USING (auth.uid() = user_id OR user_id IS NULL) 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 5. Definir Políticas para a chave Service Role (Backend/Admin)
CREATE POLICY "Service role tem acesso total a categorias" 
ON public.categorias 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role tem acesso total a contas" 
ON public.contas 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Service role tem acesso total a gastos" 
ON public.gastos 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 6. Restringir permissões de roles anônimos (anon)
REVOKE ALL ON public.categorias FROM anon;
REVOKE ALL ON public.contas FROM anon;
REVOKE ALL ON public.gastos FROM anon;

-- Conceder permissões apenas para usuários autenticados e service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gastos TO authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
