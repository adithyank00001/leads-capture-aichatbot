-- Store answers from custom lead form fields (beyond name / phone / email)

ALTER TABLE public.chatbot_leads
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb;
