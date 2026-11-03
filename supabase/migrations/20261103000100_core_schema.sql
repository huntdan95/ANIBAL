-- =====================================================================
-- ANIBAL referral tracker — core schema, roles and row-level security
-- =====================================================================
-- Who can see what. This is enforced HERE, in the database, not only in the UI:
--
--   admin    (Danny)   everything.
--   referrer (Aníbal)  only the leads he referred (contact info + stage dates)
--                      and the activity feed for those leads.
--                      NEVER: lead_private (premium, commission, notes),
--                      intake (customer answers incl. payroll $), quotes,
--                      or quote PDFs.
--   customer           only their own lead, their own intake answers,
--                      their own quotes and quote PDFs.
--   anon (not signed in) nothing. The public sign-up page writes through the
--                      server with the service key.
--
-- v1 data rule: never collect date of birth, driver's license, VIN or SSN.
-- There are intentionally no columns for them.
-- =====================================================================

-- ---------- Types ----------------------------------------------------
create type public.user_role as enum ('admin', 'referrer', 'customer');
create type public.lang as enum ('es', 'en');
create type public.lead_stage as enum (
  'new',         -- Nuevo
  'contacted',   -- Contactado
  'info_sent',   -- Información enviada
  'quote_sent',  -- Cotización enviada
  'bound',       -- Póliza activa
  'not_bought',  -- No compró (closed)
  'not_fit'      -- No califica (closed)
);
create type public.lead_source as enum (
  'radio', 'newsletter', 'magazine', 'anibal', 'event', 'other'
);

-- Position of an open stage on the 4-step progress bar (closed = -1).
create function public.stage_rank(s public.lead_stage)
returns int language sql immutable set search_path = '' as $$
  select case s
    when 'new' then 0 when 'contacted' then 1 when 'info_sent' then 2
    when 'quote_sent' then 3 when 'bound' then 4 else -1 end
$$;

-- ---------- Staff: which emails are Danny and Aníbal -----------------
-- Not readable through the API (RLS on, no policies).
create table public.staff (
  email     text primary key check (email = lower(email)),
  role      public.user_role not null check (role in ('admin', 'referrer')),
  full_name text not null,
  language  public.lang not null default 'es'
);

-- ---------- Profiles: one row per person who can sign in -------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null unique,
  full_name  text,
  role       public.user_role not null default 'customer',
  language   public.lang not null default 'es',
  created_at timestamptz not null default now()
);

-- ---------- Leads ----------------------------------------------------
create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null check (length(btrim(full_name)) between 2 and 120),
  phone         text not null check (phone ~ '^[0-9]{10}$'),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  -- address is required on the referral form, but the public sign-up page
  -- only asks for name/phone/email/language, so these can be empty here.
  street        text check (length(street) <= 200),
  city          text check (length(city) <= 100),
  state         text check (state ~ '^[A-Z]{2}$'),
  zip           text check (zip ~ '^[0-9]{5}$'),
  business_name text check (length(business_name) <= 200),
  language      public.lang not null default 'es',
  needs_notes   text check (length(needs_notes) <= 2000),
  source        public.lead_source,
  referrer_id   uuid references public.profiles (id) on delete set null,
  customer_id   uuid references public.profiles (id) on delete set null,
  created_by    uuid references public.profiles (id) on delete set null,
  stage         public.lead_stage not null default 'new',
  -- the date each stage was first reached
  new_at        timestamptz not null default now(),
  contacted_at  timestamptz,
  info_sent_at  timestamptz,
  quote_sent_at timestamptz,
  bound_at      timestamptz,
  closed_at     timestamptz,
  is_example    boolean not null default false,
  updated_at    timestamptz not null default now()
);
create index leads_referrer_idx on public.leads (referrer_id);
create index leads_customer_idx on public.leads (customer_id);
create index leads_new_at_idx on public.leads (new_at desc);

-- ---------- Danny-only details --------------------------------------
create table public.lead_private (
  lead_id        uuid primary key references public.leads (id) on delete cascade,
  coverage_lines text[] not null default '{}'
                 check (coverage_lines <@ array['wc','gl','auto','property','bonds','health','personal','other']),
  est_premium    numeric(12,2) check (est_premium >= 0),
  commission     numeric(12,2) check (commission >= 0),
  notes          text check (length(notes) <= 5000),
  updated_at     timestamptz not null default now()
);

-- ---------- Customer's "Mi información" answers ---------------------
create table public.intake (
  lead_id        uuid primary key references public.leads (id) on delete cascade,
  needs          text[] not null default '{}'
                 check (needs <@ array['business','workers','vehicle','home','other']),
  other_need     text check (length(other_need) <= 500),
  work_type      text check (length(work_type) <= 200),
  weekly_payroll numeric(12,2) check (weekly_payroll >= 0),
  weeks_per_year int check (weeks_per_year between 0 and 52),
  roof_year      int check (roof_year between 1900 and 2100),
  vehicle_count  int check (vehicle_count between 0 and 99),
  driver_count   int check (driver_count between 0 and 99),
  submitted_at   timestamptz not null default now()
);

-- ---------- Quotes (PDF in private storage + short note) ------------
create table public.quotes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads (id) on delete cascade,
  note       text not null check (length(btrim(note)) between 1 and 500),
  pdf_path   text not null,
  created_at timestamptz not null default now(),
  proceed_at timestamptz   -- customer tapped "Quiero seguir adelante"
);
create index quotes_lead_idx on public.quotes (lead_id);

-- ---------- Activity feed -------------------------------------------
-- Holds only the kind of event, never dollar amounts or notes, so it is
-- safe to show to Aníbal.
create table public.events (
  id         bigint generated always as identity primary key,
  lead_id    uuid not null references public.leads (id) on delete cascade,
  kind       text not null check (kind in (
               'created', 'contacted', 'info_sent', 'quote_sent', 'proceed',
               'bound', 'not_bought', 'not_fit', 'reopened')),
  actor_id   uuid references public.profiles (id) on delete set null,
  actor_role public.user_role,   -- null = the public sign-up page / system
  created_at timestamptz not null default now()
);
create index events_created_idx on public.events (created_at desc);
create index events_lead_idx on public.events (lead_id);

-- ---------- 30-day customer invite links ----------------------------
-- Only a SHA-256 hash of the token is stored. Server-only (no policies).
create table public.invites (
  token_hash text primary key,
  lead_id    uuid not null references public.leads (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Role helpers (used by the policies below)
-- =====================================================================
create function public.my_role()
returns public.user_role language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

create function public.is_referrer()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select role = 'referrer' from public.profiles where id = auth.uid()), false)
$$;

-- =====================================================================
-- New sign-in accounts get a profile; staff emails get their role.
-- =====================================================================
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  s public.staff;
  meta_lang text := new.raw_user_meta_data ->> 'language';
begin
  select * into s from public.staff where email = lower(new.email);
  insert into public.profiles (id, email, full_name, role, language)
  values (
    new.id,
    lower(new.email),
    coalesce(s.full_name, new.raw_user_meta_data ->> 'full_name'),
    coalesce(s.role, 'customer'),
    coalesce(s.language, case when meta_lang in ('es', 'en') then meta_lang::public.lang end, 'es')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- If a staff email is added after that person already has an account,
-- give the existing profile the staff role.
create function public.sync_staff_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles
     set role = new.role, full_name = coalesce(full_name, new.full_name)
   where email = new.email;
  return new;
end $$;

create trigger staff_sync
  after insert or update on public.staff
  for each row execute function public.sync_staff_role();

-- =====================================================================
-- Stage rules
-- =====================================================================
-- Stamp the date of the stage a lead is in, the first time it gets there.
create function public.stamp_stage_date(l public.leads)
returns public.leads language plpgsql set search_path = '' as $$
begin
  case l.stage
    when 'new'        then l.new_at        := coalesce(l.new_at, now());
    when 'contacted'  then l.contacted_at  := coalesce(l.contacted_at, now());
    when 'info_sent'  then l.info_sent_at  := coalesce(l.info_sent_at, now());
    when 'quote_sent' then l.quote_sent_at := coalesce(l.quote_sent_at, now());
    when 'bound'      then l.bound_at      := coalesce(l.bound_at, now());
    else                   l.closed_at     := now();
  end case;
  return l;
end $$;

create function public.leads_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.created_by := coalesce(auth.uid(), new.created_by);
  if auth.uid() is not null and not public.is_admin() then
    -- Anyone other than Danny (i.e. Aníbal) can only add a fresh "New" referral.
    new.referrer_id   := auth.uid();
    new.customer_id   := null;
    new.stage         := 'new';
    new.new_at        := now();
    new.contacted_at  := null;
    new.info_sent_at  := null;
    new.quote_sent_at := null;
    new.bound_at      := null;
    new.closed_at     := null;
    new.is_example    := false;
    new.source        := coalesce(new.source, 'anibal');
  end if;
  new := public.stamp_stage_date(new);
  new.updated_at := now();
  return new;
end $$;

create function public.leads_before_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if new.stage is distinct from old.stage then
    if public.stage_rank(new.stage) >= 0 then
      new.closed_at := null;  -- reopened or still open
    end if;
    new := public.stamp_stage_date(new);
  end if;
  return new;
end $$;

create function public.log_event(p_lead uuid, p_kind text)
returns void language sql security definer set search_path = '' as $$
  insert into public.events (lead_id, kind, actor_id, actor_role)
  values (p_lead, p_kind, auth.uid(), public.my_role());
$$;

create function public.leads_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.log_event(new.id, 'created');
  return null;
end $$;

create function public.leads_after_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.stage is distinct from old.stage then
    perform public.log_event(new.id, case when new.stage = 'new' then 'reopened' else new.stage::text end);
  end if;
  return null;
end $$;

create trigger leads_bi before insert on public.leads
  for each row execute function public.leads_before_insert();
create trigger leads_bu before update on public.leads
  for each row execute function public.leads_before_update();
create trigger leads_ai after insert on public.leads
  for each row execute function public.leads_after_insert();
create trigger leads_au after update on public.leads
  for each row execute function public.leads_after_update();

-- Posting a quote moves an open lead to "Cotización enviada" automatically.
create function public.quotes_after_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_stage public.lead_stage;
begin
  select stage into v_stage from public.leads where id = new.lead_id for update;
  update public.leads
     set quote_sent_at = coalesce(quote_sent_at, now()),
         stage = case when stage in ('new', 'contacted', 'info_sent') then 'quote_sent' else stage end
   where id = new.lead_id;
  if v_stage not in ('new', 'contacted', 'info_sent') then
    perform public.log_event(new.lead_id, 'quote_sent');  -- 2nd quote etc.
  end if;
  return null;
end $$;

create trigger quotes_ai after insert on public.quotes
  for each row execute function public.quotes_after_insert();

create function public.lead_private_touch()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

create trigger lead_private_bu before update on public.lead_private
  for each row execute function public.lead_private_touch();

-- =====================================================================
-- Customer actions (the only writes a customer can make)
-- =====================================================================
-- "Enviar a Danny": confirm contact info + answers. Moves New/Contacted
-- to "Información enviada". Email is not editable (it is their login).
create function public.submit_intake(
  p_lead_id uuid,
  p_full_name text, p_phone text,
  p_street text, p_city text, p_state text, p_zip text,
  p_business_name text, p_language public.lang,
  p_needs text[], p_other_need text,
  p_work_type text, p_weekly_payroll numeric, p_weeks_per_year int,
  p_roof_year int, p_vehicle_count int, p_driver_count int
)
returns public.lead_stage language plpgsql security definer set search_path = '' as $$
declare
  v_stage public.lead_stage;
  v_new   public.lead_stage;
begin
  select stage into v_stage from public.leads
   where id = p_lead_id and customer_id = auth.uid() and auth.uid() is not null
   for update;
  if not found then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  update public.leads set
    full_name = p_full_name, phone = p_phone,
    street = p_street, city = p_city, state = p_state, zip = p_zip,
    business_name = p_business_name, language = p_language,
    info_sent_at = coalesce(info_sent_at, now()),
    stage = case when stage in ('new', 'contacted') then 'info_sent' else stage end
  where id = p_lead_id
  returning stage into v_new;

  insert into public.intake (lead_id, needs, other_need, work_type, weekly_payroll,
                             weeks_per_year, roof_year, vehicle_count, driver_count, submitted_at)
  values (p_lead_id, coalesce(p_needs, '{}'), p_other_need, p_work_type, p_weekly_payroll,
          p_weeks_per_year, p_roof_year, p_vehicle_count, p_driver_count, now())
  on conflict (lead_id) do update set
    needs = excluded.needs, other_need = excluded.other_need, work_type = excluded.work_type,
    weekly_payroll = excluded.weekly_payroll, weeks_per_year = excluded.weeks_per_year,
    roof_year = excluded.roof_year, vehicle_count = excluded.vehicle_count,
    driver_count = excluded.driver_count, submitted_at = now();

  if v_new = v_stage then
    perform public.log_event(p_lead_id, 'info_sent');  -- resubmission: no stage change
  end if;
  return v_new;
end $$;

-- "Quiero seguir adelante": only records interest + notifies Danny.
-- It never binds coverage. Returns true the first time it is tapped.
create function public.quote_proceed(p_quote_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_lead uuid; v_done timestamptz;
begin
  select q.lead_id, q.proceed_at into v_lead, v_done
    from public.quotes q join public.leads l on l.id = q.lead_id
   where q.id = p_quote_id and l.customer_id = auth.uid() and auth.uid() is not null
   for update of q;
  if not found then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if v_done is not null then
    return false;
  end if;
  update public.quotes set proceed_at = now() where id = p_quote_id;
  perform public.log_event(v_lead, 'proceed');
  return true;
end $$;

-- =====================================================================
-- Row-level security
-- =====================================================================
alter table public.staff        enable row level security;
alter table public.profiles     enable row level security;
alter table public.leads        enable row level security;
alter table public.lead_private enable row level security;
alter table public.intake       enable row level security;
alter table public.quotes       enable row level security;
alter table public.events       enable row level security;
alter table public.invites      enable row level security;

-- profiles: see yourself (Danny sees everyone). You may change only your
-- language and name (column grants below), never your role.
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- leads
create policy leads_select on public.leads for select to authenticated
  using ((select public.is_admin())
         or referrer_id = (select auth.uid())
         or customer_id = (select auth.uid()));
create policy leads_insert on public.leads for insert to authenticated
  with check ((select public.is_admin())
              or ((select public.is_referrer()) and referrer_id = (select auth.uid())));
create policy leads_update on public.leads for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- lead_private: Danny only
create policy lead_private_admin on public.lead_private for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- intake: Danny + that customer can read; customers write via submit_intake()
create policy intake_select on public.intake for select to authenticated
  using ((select public.is_admin())
         or exists (select 1 from public.leads l
                     where l.id = intake.lead_id and l.customer_id = (select auth.uid())));
create policy intake_admin_write on public.intake for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- quotes: Danny + that customer can read; only Danny writes
create policy quotes_select on public.quotes for select to authenticated
  using ((select public.is_admin())
         or exists (select 1 from public.leads l
                     where l.id = quotes.lead_id and l.customer_id = (select auth.uid())));
create policy quotes_admin_write on public.quotes for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- events: Danny all; Aníbal only for leads he referred; customers none
create policy events_select on public.events for select to authenticated
  using ((select public.is_admin())
         or exists (select 1 from public.leads l
                     where l.id = events.lead_id and l.referrer_id = (select auth.uid())));

-- staff, invites: no policies => not reachable through the API at all.

-- =====================================================================
-- Privileges (defense in depth on top of RLS)
-- =====================================================================
revoke all on all tables in schema public from anon;
revoke all on public.staff, public.invites from authenticated;
revoke insert, update, delete, truncate on public.events from authenticated;
revoke insert, update, delete, truncate on public.profiles from authenticated;
grant update (language, full_name) on public.profiles to authenticated;
revoke truncate on all tables in schema public from authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.my_role(), public.is_admin(), public.is_referrer(),
  public.stage_rank(public.lead_stage) to authenticated;
grant execute on function public.submit_intake(uuid, text, text, text, text, text, text, text,
  public.lang, text[], text, text, numeric, int, int, int, int) to authenticated;
grant execute on function public.quote_proceed(uuid) to authenticated;

-- =====================================================================
-- Private storage for quote PDFs. Files live at  quotes/<lead_id>/<file>.pdf
-- Links are always short-lived signed URLs created by the server.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quotes', 'quotes', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

create policy quotes_pdf_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'quotes' and (select public.is_admin()));
create policy quotes_pdf_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'quotes' and (select public.is_admin()));
create policy quotes_pdf_read on storage.objects for select to authenticated
  using (bucket_id = 'quotes' and (
    (select public.is_admin())
    or exists (select 1 from public.leads l
                where l.id::text = (storage.foldername(objects.name))[1]
                  and l.customer_id = (select auth.uid()))));
