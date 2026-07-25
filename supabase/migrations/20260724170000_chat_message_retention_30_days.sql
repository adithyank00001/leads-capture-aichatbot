-- Update chat message retention from 60 days to 30 days (leads are kept)

CREATE OR REPLACE FUNCTION public.cleanup_old_chatbot_messages()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.chatbot_messages
  WHERE created_at < now() - interval '30 days';
$$;
