-- =============================================
-- TrocaIdeia - Schema V3: Presença Online
-- =============================================
-- Execute este SQL no SQL Editor do Supabase

-- 1. Tabela de presença online
CREATE TABLE IF NOT EXISTS public.online_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
  country TEXT DEFAULT 'BR',
  bio TEXT DEFAULT '',
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'busy', 'in_chat')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure one entry per user
  CONSTRAINT unique_user UNIQUE (user_id),
  CONSTRAINT unique_anonymous UNIQUE (anonymous_id)
);

-- RLS
ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado ou anônimo pode ver usuários online
CREATE POLICY "Qualquer um pode ver usuários online"
  ON public.online_users FOR SELECT
  USING (true);

-- Qualquer um pode se registrar como online
CREATE POLICY "Qualquer um pode inserir presença"
  ON public.online_users FOR INSERT
  WITH CHECK (true);

-- Qualquer um pode atualizar sua presença
CREATE POLICY "Qualquer um pode atualizar presença"
  ON public.online_users FOR UPDATE
  USING (true);

-- Qualquer um pode deletar sua presença
CREATE POLICY "Qualquer um pode deletar presença"
  ON public.online_users FOR DELETE
  USING (true);

-- Função para limpar usuários offline (sem atividade por 2 minutos)
CREATE OR REPLACE FUNCTION public.cleanup_offline_users()
RETURNS void AS $$
BEGIN
  DELETE FROM public.online_users
  WHERE last_seen < NOW() - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Publicar no Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_users;
