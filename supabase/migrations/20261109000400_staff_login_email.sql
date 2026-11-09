-- Staff can sign in with a different address from their contact email
-- (Danny's work email holds sign-in links for up to a day).
-- Their account, their notification emails and the contact details customers
-- see all stay on `email`; only sign-in links go to `login_email`.
-- Set it in the SQL Editor: see README, "Signing in with a different email".
-- Safe to run more than once.
alter table public.staff
  add column if not exists login_email text unique check (login_email = lower(login_email));
