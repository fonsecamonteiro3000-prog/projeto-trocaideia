-- =============================================
-- TrocaIdeia - Schema do Banco de Dados (Supabase)
-- =============================================
-- Execute este SQL no SQL Editor do seu projeto Supabase

-- 1. Tabela de perfis (extensão do auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Fila de matchmaking para chat
CREATE TABLE IF NOT EXISTS public.chat_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'expired')),
  room_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Histórico de salas de chat
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id TEXT PRIMARY KEY,
  user1_id UUID REFERENCES auth.users(id),
  user2_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 4. Mensagens (opcional, caso queira persistir)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Denúncias
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) NOT NULL,
  reported_user_id UUID REFERENCES auth.users(id),
  room_id TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para chat_queue
CREATE POLICY "Usuários podem inserir na fila"
  ON public.chat_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver fila"
  ON public.chat_queue FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar fila"
  ON public.chat_queue FOR UPDATE
  USING (true);

CREATE POLICY "Usuários podem deletar da fila"
  ON public.chat_queue FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para chat_rooms
CREATE POLICY "Participantes podem ver a sala"
  ON public.chat_rooms FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Autenticados podem criar salas"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Participantes podem atualizar sala"
  ON public.chat_rooms FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Políticas para messages
CREATE POLICY "Participantes podem ver mensagens"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = messages.room_id
      AND (chat_rooms.user1_id = auth.uid() OR chat_rooms.user2_id = auth.uid())
    )
  );

CREATE POLICY "Autenticados podem enviar mensagens"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas para reports
CREATE POLICY "Usuários podem criar denúncias"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Usuários podem ver próprias denúncias"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

-- =============================================
-- Trigger: criar perfil automaticamente no signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Função para limpar fila expirada (executar periodicamente)
-- =============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_queue()
RETURNS void AS $$
BEGIN
  UPDATE public.chat_queue
  SET status = 'expired'
  WHERE status = 'waiting'
  AND created_at < NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Habilitar Realtime nas tabelas necessárias
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
