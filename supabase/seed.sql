-- =====================================================================
-- EJEMPLO / EXAMPLE data: 3 fake leads so the screens aren't empty.
-- Every name starts with "EJEMPLO" and every row has is_example = true.
--
-- HOW TO USE: paste this whole file into the Supabase SQL Editor and click Run.
--   • Run it AFTER Danny and Aníbal have each signed in once, so the examples
--     are linked to Aníbal. (If you ran it too early, just run it again.)
--   • Safe to run again: it replaces the old examples.
--
-- HOW TO REMOVE the examples later, run just this line:
--   delete from public.leads where is_example;
-- =====================================================================
do $$
declare
  v_anibal uuid := (select id from public.profiles where role = 'referrer' order by created_at limit 1);
  v_danny  uuid := (select id from public.profiles where role = 'admin' order by created_at limit 1);
  l1 uuid;
  l2 uuid;
  l3 uuid;
begin
  delete from public.leads where is_example;

  -- 1. Referred by Aníbal 3 days ago, nobody has called yet → shows "3 días sin contacto".
  insert into public.leads (full_name, phone, email, street, city, state, zip, business_name, language,
                            needs_notes, source, referrer_id, stage, new_at, is_example)
  values ('EJEMPLO – Juan Pérez', '6155550101', 'ejemplo.juan@example.com', '100 Calle Ejemplo',
          'Nashville', 'TN', '37211', 'Pérez Framing', 'es',
          'Seguro para sus trabajadores y su camioneta.', 'anibal', v_anibal, 'new',
          now() - interval '3 days', true)
  returning id into l1;

  -- 2. Referred by Aníbal, Danny called, she sent her info, Danny sent a quote.
  insert into public.leads (full_name, phone, email, street, city, state, zip, business_name, language,
                            needs_notes, source, referrer_id, stage, new_at, contacted_at, info_sent_at,
                            quote_sent_at, is_example)
  values ('EJEMPLO – María López', '6155550102', 'ejemplo.maria@example.com', '200 Avenida Ejemplo',
          'Antioch', 'TN', '37013', 'Limpieza López', 'es',
          'Tiene 3 empleados de limpieza y 2 carros.', 'event', v_anibal, 'quote_sent',
          now() - interval '12 days', now() - interval '11 days', now() - interval '8 days',
          now() - interval '2 days', true)
  returning id into l2;

  insert into public.intake (lead_id, needs, work_type, weekly_payroll, weeks_per_year,
                             vehicle_count, driver_count, submitted_at)
  values (l2, '{business,workers,vehicle}', 'Limpieza de oficinas', 2400, 50, 2, 3, now() - interval '8 days');

  insert into public.lead_private (lead_id, coverage_lines, est_premium, commission, notes)
  values (l2, '{wc,gl,auto}', 6800, 680, 'EJEMPLO: private note only Danny can see.');

  -- 3. Heard Danny on the radio, out of state, English, bought the policy.
  insert into public.leads (full_name, phone, email, street, city, state, zip, language,
                            needs_notes, source, referrer_id, stage, new_at, contacted_at, info_sent_at,
                            quote_sent_at, bound_at, is_example)
  values ('EJEMPLO – Carlos Ramírez', '7065550103', 'ejemplo.carlos@example.com', '300 Example Rd',
          'Dalton', 'GA', '30720', 'en',
          'Home and two cars.', 'radio', v_anibal, 'bound',
          now() - interval '30 days', now() - interval '29 days', now() - interval '27 days',
          now() - interval '24 days', now() - interval '20 days', true)
  returning id into l3;

  insert into public.intake (lead_id, needs, roof_year, vehicle_count, driver_count, submitted_at)
  values (l3, '{home,vehicle}', 2012, 2, 2, now() - interval '27 days');

  insert into public.lead_private (lead_id, coverage_lines, est_premium, commission, notes)
  values (l3, '{personal}', 3100, 310, 'EJEMPLO: home + auto bundle.');

  -- Give the activity feed believable dates instead of "just now".
  delete from public.events where lead_id in (l1, l2, l3);
  insert into public.events (lead_id, kind, actor_id, actor_role, created_at) values
    (l1, 'created',    v_anibal, 'referrer', now() - interval '3 days'),
    (l2, 'created',    v_anibal, 'referrer', now() - interval '12 days'),
    (l2, 'contacted',  v_danny,  'admin',    now() - interval '11 days'),
    (l2, 'info_sent',  null,     'customer', now() - interval '8 days'),
    (l2, 'quote_sent', v_danny,  'admin',    now() - interval '2 days'),
    (l3, 'created',    null,     null,       now() - interval '30 days'),
    (l3, 'contacted',  v_danny,  'admin',    now() - interval '29 days'),
    (l3, 'info_sent',  null,     'customer', now() - interval '27 days'),
    (l3, 'quote_sent', v_danny,  'admin',    now() - interval '24 days'),
    (l3, 'proceed',    null,     'customer', now() - interval '22 days'),
    (l3, 'bound',      v_danny,  'admin',    now() - interval '20 days');
end $$;
