-- Allow customers to disable the visitor lead form and chat without collecting details

ALTER TABLE public.bot_widget_settings
  ADD COLUMN IF NOT EXISTS lead_form_enabled boolean NOT NULL DEFAULT true;
