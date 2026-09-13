-- Allow any whole-number depth from 1 to 700 (DataForSEO Maps max).
ALTER TABLE public.maps_searches
  DROP CONSTRAINT maps_searches_depth_allowed;

ALTER TABLE public.maps_searches
  ADD CONSTRAINT maps_searches_depth_allowed
  CHECK (depth >= 1 AND depth <= 700);
