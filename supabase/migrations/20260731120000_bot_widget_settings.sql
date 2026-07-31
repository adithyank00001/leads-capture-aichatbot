-- Per-bot chat widget theme + lead form field configuration

CREATE TABLE IF NOT EXISTS public.bot_widget_settings (
  bot_id text PRIMARY KEY REFERENCES public.bots(bot_id) ON DELETE CASCADE,
  header_color text NOT NULL DEFAULT '#075E54',
  accent_color text NOT NULL DEFAULT '#25D366',
  lead_fields jsonb NOT NULL DEFAULT '[
    {"id":"name","required":true,"label":"Your name"},
    {"id":"phone","required":true,"label":"Phone number"}
  ]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_widget_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY bot_widget_settings_select_own ON public.bot_widget_settings
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_widget_settings_insert_own ON public.bot_widget_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_widget_settings_update_own ON public.bot_widget_settings
  FOR UPDATE TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

ALTER TABLE public.chatbot_leads
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL;

INSERT INTO public.bot_widget_settings (bot_id, header_color, accent_color, lead_fields)
SELECT bot_id, '#075E54', '#25D366',
  '[
    {"id":"name","required":true,"label":"Your name"},
    {"id":"phone","required":true,"label":"Phone number"}
  ]'::jsonb
FROM public.bots
ON CONFLICT (bot_id) DO NOTHING;
