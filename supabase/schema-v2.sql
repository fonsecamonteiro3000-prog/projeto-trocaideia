-- =============================================
-- TrocaIdeia - Schema V2 (Atualizado)
-- =============================================
-- Execute este SQL no SQL Editor do Supabase

-- 1. Atualizar tabela profiles com campos extras
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '' CHECK (char_length(bio) <= 160),
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS anonymous_name TEXT,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ban_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0;

-- 2. Atualizar chat_queue com gênero e localização para match
ALTER TABLE public.chat_queue
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS preferred_gender TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'BR',
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT;

-- 3. Atualizar reports com categorias
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN (
    'offensive', 'nudity', 'harassment', 'inappropriate', 'other'
  ));

-- 4. Tabela de sessões anônimas
CREATE TABLE IF NOT EXISTS public.anonymous_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anonymous_name TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  gender TEXT,
  country TEXT DEFAULT 'BR',
  city TEXT,
  state TEXT,
  ip_hash TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  report_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para anonymous_sessions
ALTER TABLE public.anonymous_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert anonymous sessions"
  ON public.anonymous_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read own anonymous session"
  ON public.anonymous_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update anonymous sessions"
  ON public.anonymous_sessions FOR UPDATE
  USING (true);

-- 5. Atualizar chat_queue para permitir anônimos
ALTER TABLE public.chat_queue
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.chat_queue
  ADD COLUMN IF NOT EXISTS anonymous_session_id UUID REFERENCES public.anonymous_sessions(id);

-- Atualizar política de insert na fila para permitir anônimos
DROP POLICY IF EXISTS "Usuários podem inserir na fila" ON public.chat_queue;
CREATE POLICY "Qualquer um pode inserir na fila"
  ON public.chat_queue FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuários podem deletar da fila" ON public.chat_queue;
CREATE POLICY "Qualquer um pode deletar da fila"
  ON public.chat_queue FOR DELETE
  USING (true);

-- 6. Atualizar reports para anônimos
ALTER TABLE public.reports
  ALTER COLUMN reporter_id DROP NOT NULL;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reporter_session_id UUID REFERENCES public.anonymous_sessions(id),
  ADD COLUMN IF NOT EXISTS reported_session_id UUID REFERENCES public.anonymous_sessions(id);

DROP POLICY IF EXISTS "Usuários podem criar denúncias" ON public.reports;
CREATE POLICY "Qualquer um pode criar denúncias"
  ON public.reports FOR INSERT
  WITH CHECK (true);

-- Publicar anonymous_sessions no realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.anonymous_sessions;
