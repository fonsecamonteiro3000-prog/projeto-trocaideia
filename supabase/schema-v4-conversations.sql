-- =============================================
-- TrocaIdeia - Schema V4: Conversas Salvas
-- =============================================
-- Execute este SQL no SQL Editor do Supabase
-- Tabelas flexíveis sem FK para auth.users, funcionam para logados e anônimos

-- 1. Conversas salvas (uma entrada por usuário por sala)
CREATE TABLE IF NOT EXISTS public.saved_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  partner_name TEXT DEFAULT 'Desconhecido',
  partner_id TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  last_message TEXT,
  message_count INTEGER DEFAULT 0
);

-- Índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_saved_conversations_user_id ON public.saved_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_conversations_room_id ON public.saved_conversations(room_id);

-- 2. Mensagens salvas
CREATE TABLE IF NOT EXISTS public.saved_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.saved_conversations(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('you', 'stranger', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_messages_conversation_id ON public.saved_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_saved_messages_room_id ON public.saved_messages(room_id);

-- RLS
ALTER TABLE public.saved_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_messages ENABLE ROW LEVEL SECURITY;

-- Políticas: qualquer um pode inserir e ler suas próprias conversas
CREATE POLICY "Qualquer um pode inserir conversa"
  ON public.saved_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem ver suas conversas"
  ON public.saved_conversations FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem atualizar suas conversas"
  ON public.saved_conversations FOR UPDATE
  USING (true);

CREATE POLICY "Usuários podem deletar suas conversas"
  ON public.saved_conversations FOR DELETE
  USING (true);

CREATE POLICY "Qualquer um pode inserir mensagem"
  ON public.saved_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuários podem ver mensagens"
  ON public.saved_messages FOR SELECT
  USING (true);

CREATE POLICY "Usuários podem deletar mensagens"
  ON public.saved_messages FOR DELETE
  USING (true);

-- Publicar no Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.saved_messages;
