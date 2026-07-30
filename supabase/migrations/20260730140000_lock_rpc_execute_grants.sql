-- Lock SECURITY DEFINER RPCs to service_role only.
-- REVOKE FROM PUBLIC does not remove Supabase default grants to anon/authenticated.

REVOKE ALL ON FUNCTION public.cleanup_old_chatbot_messages() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_chatbot_messages() TO service_role;

REVOKE ALL ON FUNCTION public.claim_next_website_page(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_website_page(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.reclaim_stale_processing_pages(uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reclaim_stale_processing_pages(uuid, int) TO service_role;

REVOKE ALL ON FUNCTION public.replace_page_chunks(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_page_chunks(uuid, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.cleanup_stale_website_pages(uuid, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_website_pages(uuid, text[]) TO service_role;

REVOKE ALL ON FUNCTION public.match_website_chunks(text, extensions.vector, float, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_website_chunks(text, extensions.vector, float, int) TO service_role;

REVOKE ALL ON FUNCTION public.count_valid_website_chunks(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.count_valid_website_chunks(text) TO service_role;

REVOKE ALL ON FUNCTION public.begin_website_page_processing(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_website_page_processing(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.complete_website_page(uuid, boolean, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_website_page(uuid, boolean, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.retry_website_page(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.retry_website_page(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.try_finalize_website_source(uuid, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.try_finalize_website_source(uuid, int, int) TO service_role;

REVOKE ALL ON FUNCTION public.fail_stale_pending_pages(uuid, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fail_stale_pending_pages(uuid, int) TO service_role;

REVOKE ALL ON FUNCTION public.sweep_stuck_website_builds(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sweep_stuck_website_builds(int) TO service_role;
