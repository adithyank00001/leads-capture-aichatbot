-- Launch safety: usage limits, allowed domains, privacy fields

ALTER TABLE public.bots
  ADD COLUMN IF NOT EXISTS monthly_message_limit int NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS messages_used_this_period int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_captured_this_period int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS billing_period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  ADD COLUMN IF NOT EXISTS billing_period_end timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month');

CREATE TABLE IF NOT EXISTS public.bot_allowed_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id text NOT NULL REFERENCES public.bots(bot_id) ON DELETE CASCADE,
  domain text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bot_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_bot_allowed_domains_bot_id
  ON public.bot_allowed_domains (bot_id);

ALTER TABLE public.bot_allowed_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY bot_allowed_domains_select_own ON public.bot_allowed_domains
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_allowed_domains_insert_own ON public.bot_allowed_domains
  FOR INSERT TO authenticated
  WITH CHECK (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_allowed_domains_delete_own ON public.bot_allowed_domains
  FOR DELETE TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

ALTER TABLE public.bot_knowledge
  ADD COLUMN IF NOT EXISTS consent_text text NOT NULL DEFAULT 'I agree that my information will be shared with this business and processed through this chatbot.',
  ADD COLUMN IF NOT EXISTS privacy_policy_url text;
