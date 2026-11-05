-- Spell out the table permissions the app relies on, instead of trusting
-- Supabase's defaults (newer projects can be set up without them).
-- Row-level security still decides WHICH rows anyone sees; these only say
-- which kinds of access are possible at all. Safe to run more than once.

grant usage on schema public to anon, authenticated, service_role;

-- The server's secret key (used only on the server) can do everything.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Signed-in people. Matches the rules in 20261103000100_core_schema.sql:
-- no access to staff/invites, no writing events, profiles: only language + name.
grant select, insert, update, delete on public.leads, public.lead_private, public.intake, public.quotes to authenticated;
grant select on public.events, public.profiles to authenticated;
grant update (language, full_name) on public.profiles to authenticated;
