-- Who is Danny (admin) and who is Aníbal (referrer).
-- Everyone else who signs in is a customer.
-- To change an email later: edit it here AND run the same statement in the
-- Supabase SQL editor (see README, "Changing Danny's or Aníbal's email").
insert into public.staff (email, role, full_name, language) values
  ('danny@go-ipt.com',          'admin',    'Danny Hunt', 'en'),
  ('anibalperez1000@gmail.com', 'referrer', 'Aníbal',     'es')
on conflict (email) do update
  set role = excluded.role, full_name = excluded.full_name, language = excluded.language;
