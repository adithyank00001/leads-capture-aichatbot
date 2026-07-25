-- Auto-delete chat messages older than 30 days (leads are kept)

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created_at
  ON public.chatbot_messages (created_at);

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.cleanup_old_chatbot_messages()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.chatbot_messages
  WHERE created_at < now() - interval '30 days';
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'cleanup-chatbot-messages-daily'
  ) THEN
    PERFORM cron.unschedule('cleanup-chatbot-messages-daily');
  END IF;
END $$;

SELECT cron.schedule(
  'cleanup-chatbot-messages-daily',
  '0 3 * * *',
  $$SELECT public.cleanup_old_chatbot_messages();$$
);
