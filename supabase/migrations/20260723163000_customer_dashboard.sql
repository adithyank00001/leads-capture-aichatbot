-- Customer dashboard tables

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id text NOT NULL UNIQUE,
  customer_id uuid NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
  business_name text NOT NULL DEFAULT 'My Business',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bots_customer_id ON public.bots (customer_id);
CREATE INDEX idx_bots_bot_id ON public.bots (bot_id);

CREATE TABLE public.bot_knowledge (
  bot_id text PRIMARY KEY REFERENCES public.bots(bot_id) ON DELETE CASCADE,
  description text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  services text NOT NULL DEFAULT '',
  pricing_notes text NOT NULL DEFAULT '',
  current_offer text NOT NULL DEFAULT '',
  opening_hours text NOT NULL DEFAULT '',
  contact_method text NOT NULL DEFAULT '',
  extra_notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_knowledge ENABLE ROW LEVEL SECURITY;

-- customers policies
CREATE POLICY customers_select_own ON public.customers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY customers_insert_own ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY customers_update_own ON public.customers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- bots policies
CREATE POLICY bots_select_own ON public.bots
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY bots_insert_own ON public.bots
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY bots_update_own ON public.bots
  FOR UPDATE TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

-- bot_knowledge policies
CREATE POLICY bot_knowledge_select_own ON public.bot_knowledge
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_knowledge_insert_own ON public.bot_knowledge
  FOR INSERT TO authenticated
  WITH CHECK (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY bot_knowledge_update_own ON public.bot_knowledge
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

-- chatbot_leads: customers can read their own bot leads
CREATE POLICY chatbot_leads_select_own_bot ON public.chatbot_leads
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

-- chatbot_messages: customers can read their own bot messages
CREATE POLICY chatbot_messages_select_own_bot ON public.chatbot_messages
  FOR SELECT TO authenticated
  USING (
    bot_id IN (
      SELECT b.bot_id
      FROM public.bots b
      JOIN public.customers c ON c.id = b.customer_id
      WHERE c.user_id = auth.uid()
    )
  );
