-- Chatbot MVP tables (separate from the existing Reddit `leads` table)

CREATE TABLE public.chatbot_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  session_id text NOT NULL,
  page_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_chatbot_leads_bot_session_unique
  ON public.chatbot_leads (bot_id, session_id);

CREATE INDEX idx_chatbot_leads_session_id
  ON public.chatbot_leads (session_id);

CREATE INDEX idx_chatbot_leads_bot_id_created_at
  ON public.chatbot_leads (bot_id, created_at DESC);

CREATE TABLE public.chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id text NOT NULL,
  session_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chatbot_messages_content_not_empty CHECK (length(trim(content)) > 0)
);

CREATE INDEX idx_chatbot_messages_session_id
  ON public.chatbot_messages (session_id);

CREATE INDEX idx_chatbot_messages_session_created_at
  ON public.chatbot_messages (session_id, created_at ASC);

CREATE INDEX idx_chatbot_messages_bot_id
  ON public.chatbot_messages (bot_id);

ALTER TABLE public.chatbot_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.chatbot_leads IS 'Lead captures from the embeddable chatbot MVP.';
COMMENT ON TABLE public.chatbot_messages IS 'Chat messages from the embeddable chatbot MVP.';
