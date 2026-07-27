-- Build debug logs (Next.js side — visible in dashboard)

CREATE TABLE public.bot_website_build_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.bot_website_sources(id) ON DELETE CASCADE,
  bot_id text NOT NULL REFERENCES public.bots(bot_id) ON DELETE CASCADE,
  side text NOT NULL DEFAULT 'nextjs' CHECK (side IN ('nextjs', 'gas')),
  step text NOT NULL,
  status text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bot_website_build_logs_source_id ON public.bot_website_build_logs (source_id, created_at DESC);
CREATE INDEX idx_bot_website_build_logs_bot_id ON public.bot_website_build_logs (bot_id, created_at DESC);

ALTER TABLE public.bot_website_build_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY bot_website_build_logs_select_own ON public.bot_website_build_logs
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );
