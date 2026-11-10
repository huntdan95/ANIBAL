-- Every lead is Aníbal's (Danny's decision, Nov 10): the referrals he adds, the ones
-- Danny adds, and every public sign-up (radio, newsletter, magazine, events, his own link).
-- From now on the app credits each new lead to him. This credits the leads that are
-- already in the database. Safe to run more than once: it only fills in leads with no referrer.
--
-- If Aníbal has never had an account yet, there's nothing to credit (no lead could have
-- been his), so this changes nothing.
update public.leads
   set referrer_id = (select id from public.profiles where role = 'referrer' order by created_at limit 1)
 where referrer_id is null
   and exists (select 1 from public.profiles where role = 'referrer');
