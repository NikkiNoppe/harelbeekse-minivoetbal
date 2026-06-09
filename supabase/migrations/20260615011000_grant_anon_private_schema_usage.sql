-- INVOKER public wrappers run as anon and must resolve private.* impl functions.
-- PostgREST exposes only public schema — anon cannot call private RPCs directly via REST.

GRANT USAGE ON SCHEMA private TO anon;

COMMENT ON SCHEMA private IS
  'Internal SECURITY DEFINER RPC implementations; USAGE for anon only via public INVOKER wrappers (not REST-exposed).';
