# ANIBAL: referral & status tracker (Insurance Professionals of Tennessee)

@AGENTS.md

A small tool that keeps three people up to date on a referred insurance lead:
**Danny Hunt** (agent, admin), **Aníbal** (Latino business coach who refers people, Spanish first, no insurance background), and **the customer**.

**Keep it BASIC.** This is a referral-and-status tool, not a CRM. If a feature isn't listed here, don't build it. Ask Danny first.

## Stack
Next.js 16 (App Router, TypeScript, Tailwind) + Supabase (Postgres, magic-link auth, RLS, private Storage) + Resend (email) + Vercel.
Next 16 has breaking changes vs. older training data: read `node_modules/next/dist/docs/` before writing Next code. `middleware.ts` is now `src/proxy.ts`. **Cache Components is OFF on purpose** (next.config.ts), so every page renders per request.

## People & access (enforced in the DATABASE with RLS, not only the UI)
| Role | Who | Can see / do |
|---|---|---|
| `admin` | Danny (danny@go-ipt.com) | Everything. Moves leads through stages. |
| `referrer` | Aníbal (anibalperez1000@gmail.com) | Add referrals; see ONLY leads he referred + stage dates + feed for those. NEVER premiums, commission, quote PDFs/notes, private notes, customer payroll answers. Cannot edit leads. |
| `customer` | Everyone else | Only their own lead, own intake answers, own quotes/PDFs. |

Everyone signs in with an email magic link, with no passwords. Staff emails live in `public.staff` (migration `..._staff.sql`). Public sign-ups are disabled in Supabase; the server creates customer accounts.

## Stages
`new` Nuevo → `contacted` Contactado (Danny) → `info_sent` Información enviada (auto when customer submits) → `quote_sent` Cotización enviada (auto when Danny posts a quote) → `bound` Póliza activa (Danny). Closed: `not_bought` No compró, `not_fit` No califica.
- Date first reached is stored per stage (`new_at`, `contacted_at`, … `closed_at`).
- Progress bar has 4 steps: Contacted → Info sent → Quote sent → Bound, with a date under each completed step. All three users see the same bar. A step reached by skipping (for example, info sent before marked contacted) shows ✓ with no date and counts as reached on the scorecard.
- "X días sin contacto" when a lead sits in `new` for 2+ days.

## Pings (email now via Resend; SMS/Twilio later, so keep channels pluggable, don't build SMS)
Short, plain, in the recipient's language (Spanish default; Danny = English). Reply-To: danny@go-ipt.com.
- Lead added (by Aníbal) → Danny. Customer gets welcome + 30-day link: "Danny Hunt de IPT le ayudará con su seguro. Toque aquí para enviar su información." (Welcome is sent whenever a lead is created, by anyone.)
- Contacted → Aníbal.
- Customer submits info → Danny + Aníbal ("[Name] envió su información").
- Quote posted → customer "Su cotización está lista" + link; Aníbal "Danny le envió la cotización a [Name]".
- Customer taps "Quiero seguir adelante" → Danny (Aníbal sees it in the feed). It does NOT bind coverage; the screen says Danny will call.
- Bound → customer thank-you; Aníbal "[Name] ya tiene su póliza".
- Closed (No compró / No califica) → Aníbal only. Customer gets nothing.
- Leads not referred by Aníbal (radio etc.): pings only between Danny and the customer.

## Screens
1. Login: one magic-link page, routed by role.
2. Lead list (Danny & Aníbal): cards with name, phone, city/state, source, progress bar, days-without-contact. Filters Open/Bound/Closed/All. Search name/phone.
3. Activity feed (Danny & Aníbal): latest 20 events in plain words, for example "Juan Pérez envió su información · 3 nov".
4. Add/edit referral form. Required: full name, phone (10 digits), email, street, city, state (TN first, then all), ZIP. Optional: business name, language ES/EN, "¿Qué necesita?", "¿Cómo se enteró de IPT?" (Radio / Boletín / Revista / Presentación de Aníbal / Evento / Otro). Danny's form also has "Referido por Aníbal". Aníbal can add, not edit.
5. Danny-only on a lead: stage, coverage lines (WC, GL, Commercial Auto, Property/BOP, Bonds, Group Health, Home & Personal Auto, Other), est. premium, commission ($), private notes, "Post quote" (PDF + short note).
6. Customer portal: "Mi información" (confirm contact info + what to insure: negocio / trabajadores / camioneta o auto / casa o casa móvil / otro, with follow-ups: business name, type of work, weekly payroll and weeks/year; roof year; # vehicles and # drivers) → "Enviar a Danny". "Mis cotizaciones" (PDF + note + "Quiero seguir adelante"). Progress bar + Danny's contact: Danny Hunt, IPT, 615-295-6003, danny@go-ipt.com.
7. Public sign-up `/r/[channel]` (radio, boletin, revista, evento): name, phone, email, language → New lead tagged with channel + magic link email.
8. Danny-only scorecard: referrals last 12 months, % contacted / info sent / quoted / bound, counts by source.

## Data rules
- **v1: never collect DOB, driver's license #, VIN or SSN anywhere.** Danny gets those by phone into AMS360.
- Danny-only data lives in its own tables (`lead_private`, `intake`, `quotes`), because RLS is per-row, not per-column.
- Customer writes happen only through `submit_intake()` and `quote_proceed()` (security definer, ownership-checked).
- Quote PDFs: private bucket `quotes`, path `<lead_id>/<file>.pdf`, short-lived signed URLs only.
- New SQL functions are executable by anon/authenticated by default in Supabase, so **revoke** explicitly and grant only what's needed.
- Every new table: enable RLS, add policies, and extend `tests/db/rls.test.ts`.

## Auth implementation
- The app sends ALL emails itself via Resend (`src/lib/email`), including sign-in links, never Supabase's mailer. Links come from `auth.admin.generateLink()` → `hashed_token` → `verifyOtp({ type: "magiclink", token_hash })`.
- Login link → `/auth/confirm?token_hash=…` shows an "Entrar" button (POST) so email link scanners can't burn the one-time token.
- Customer 30-day link → `/i/<token>` (sha256 stored in `invites`); each tap mints a fresh session and opens `/portal`.
- Login page only emails existing accounts or staff emails, and shows the same message either way.
- `createClient()` (`src/lib/supabase/server.ts`) acts as the signed-in user under RLS, so use it by default. `createAdminClient()` bypasses RLS: server-only, and only for account/link creation, the public sign-up and email recipient lookups.
- Guard every page/action with `requireRole(...)` from `src/lib/auth.ts`.

## Customer portal (`/portal`)
- `PortalView.tsx`: greeting, progress bar, "Mi información" (`IntakeForm.tsx`), "Mis cotizaciones" (filled in step 7), Danny's contact card. Before the first submit the form is the main thing on the page; afterwards it's folded into "Ver o cambiar mi información".
- `IntakeForm.tsx`: contact info (email shown read-only, since it's their login), big "what to insure" tiles (business / workers / vehicle / home / other), follow-ups shown only for what's checked (business: name, type of work, weekly payroll, weeks/year; home: roof year; vehicle: # vehicles, # drivers; other: text).
- `src/lib/portal/validate.ts` (`validateIntake`) → `src/app/portal/actions.ts` (`submitIntake`) → DB `submit_intake()` RPC (ownership-checked) → `after(notify("info_sent"))`. The lead id comes from the server, never from the form.
- No DOB / license / VIN / SSN fields (a unit test checks the validator). The privacy note on the form says so.

## Quotes & Danny-only details
- Danny's lead page (`LeadDetailView.tsx`), top to bottom: progress → `NextStep` (has "📄 Publicar cotización" → `#cotizaciones`, and a "quiere seguir adelante" alert) → `CustomerAnswers` (intake, read-only) → `QuotesPanel` (list + `PostQuoteForm`) → `PrivateDetailsCard` (🔒 coverage lines, est. premium, commission, notes → `lead_private`) → contact → edit form.
- Posting a quote: `startQuoteUpload` (server, as Danny) makes a one-time signed upload URL for `<lead>/<uuid>.pdf`; the browser uploads straight to Storage (avoids Vercel's 4.5 MB body limit); `finishQuote` checks the path (`isQuotePathFor`), that the file exists, then inserts `quotes` (DB trigger → `quote_sent`) and `after(notify("quote_posted"))`.
- PDFs open only via `/q/<quote id>` (route handler): RLS-checked select, then a fresh 5-minute signed URL. Never link straight to storage.
- Customer "Mis cotizaciones" (`CustomerQuotes.tsx`): note, date, PDF, "Quiero seguir adelante" → `wantToProceed` → `quote_proceed()` RPC (first tap only) → `after(notify("proceed"))`. The screen says it doesn't buy anything and Danny will call. The button is hidden once the lead is bound/closed.
- Portal shows "🎉 ¡Su póliza está activa!" when the stage is `bound`.

## Public sign-up (`/r/[channel]`)
- Links: `radio`, `boletin`, `revista`, `evento` (English slugs also work) → `lead_source` via `src/lib/signup.ts` `CHANNELS`. Unknown slug → 404.
- `src/app/r/[channel]/actions.ts` `signUp`: runs with the admin client (visitor isn't signed in). Honeypot field `website`; names can't contain links/emails; flood guard (`SIGNUP_FLOOD_LIMIT` public sign-ups per 10 min); an open lead with the same email → re-send the customer's link only (`notify(..., { only: ["customer"] })`), no duplicate.
- New lead has `created_by = null` (feed: "X se inscribió"), then `linkCustomerAccount`, then `notify("lead_added", id, { addedBy: null, source })` → customer welcome + Danny "New sign-up (Radio)".

## Pings implementation (`src/lib/notify/`)
- `plan.ts`: `planPings(event, {referred, addedBy})` decides WHO gets WHICH template (pure, unit-tested). `stageChangeEvent(from, to)` maps Danny's dropdown changes (only contacted/bound/not_bought/not_fit ping).
- `render.ts`: `renderPing()` builds the email in the recipient's language from `messages.ping.templates`. Customer emails get the 30-day link footer.
- `channels.ts`: `Channel` interface; only `emailChannel` is in `CHANNELS`. The SMS (Twilio) slot is documented there. Don't build it until Danny asks.
- `index.ts`: `notify(event, leadId, opts)` loads lead + people with the admin client, makes the customer's invite link, sends. Never throws. Always call inside `after(() => notify(...))` from `next/server`, before `redirect()`.
- Pings must never contain dollar amounts (a test checks every template).

## Code conventions
- All UI and email text in ONE translation file (`src/i18n/messages.ts`), Spanish default, ES/EN toggle.
- Mobile-first (Aníbal and most customers use phones): big tap targets (h-12+), single column, main action sticky at the bottom on phones.
- Shared UI pieces: `src/components/ui.tsx` (`buttonClass`, `Card`, `Notice`, `PageTitle`), `SubmitButton` (shows "Guardando…", blocks double taps), `icons.tsx` (inline SVG). Reuse them; don't invent new button styles.
- Danny's lead page leads with a "Siguiente paso" card (`NextStep.tsx`): one obvious button per stage, a note of who gets emailed (computed from `planPings`), closing tucked in a `<details>`, manual dropdown last.
- Formatting: Prettier, `printWidth: 120` (`.prettierrc`).
- IPT brand colors (from the logo, defined in `src/app/globals.css` `@theme`): `navy` #22506B (buttons, headings, links), `steel` #6588A2 (secondary, focus), `gold` #B4AC6F (lines/badges only, too light for text), `cream` #EAE9D1, `paper` page background. Headings use `font-serif`. Logo files: `public/ipt-logo.png`, `public/ipt-shield.png`; app icon `src/app/icon.png`. Emails use the same navy/gold (`src/lib/email/template.ts`).
- Seed data: 3 fake leads clearly marked "EJEMPLO" (`supabase/seed.sql`; remove with `delete from public.leads where is_example`).
- Lead list loads all visible leads (RLS-filtered) and filters/searches in memory (`src/lib/leads/filter.ts`, accent-insensitive). Fine for hundreds of leads.
- New lead flow (`src/app/leads/actions.ts`): insert AS the user (RLS) → `linkCustomerAccount()` creates/links the customer's sign-in account with the admin client. Staff emails are never linked as customers.
- `/leads/[id]` is Danny-only: progress bar, stage dropdown (`setStage`), contact info, collapsible edit form. Danny-only details and quotes get added here in step 7. Aníbal's cards are read-only.
- Staff pages live in the `src/app/(staff)/` route group, whose layout shows the Referidos/Actividad tabs (`StaffNav`).
- Progress logic is in `src/lib/leads/progress.ts` (`progressSteps`, `reached`) and mirrors `public.stage_rank()`. Stage dates are stamped by DB triggers. Changing a stage never erases dates; moving back hides later steps on the bar.
- Activity feed: `src/lib/activity.ts` (`listActivity`, `describeEvent`) + `src/components/ActivityList.tsx`. Sentences live in `messages.feed`.
- Tests: `npm run test:db` runs the RLS + seed tests on a plain Postgres (`TEST_DATABASE_URL`) using `tests/db/supabase-shim.sql` and `tests/db/helpers.ts`. `npm run test:unit` = pure logic.

## Build order (check in with Danny after each step)
1. [x] Database + roles + RLS (+ RLS test)
2. [x] Login (magic link, role routing, 30-day customer invite links). Built; not yet tried against a live Supabase project.
3. [x] Lead list + referral form (+ seed data in `supabase/seed.sql`, a paste-into-SQL-Editor file, idempotent)
4. [x] Stages + progress bar + activity feed
5. [x] Email pings
6. [x] Customer portal (info form)
7. [x] Quote posting + customer quotes page (+ Danny-only details)
8. [x] Public sign-up page
9. [ ] Scorecard

## Decisions made with Danny
- Code lives in GitHub; Danny clones to `C:\Apps\ANIBAL`.
- No access to go-ipt.com DNS; Danny will buy a separate domain for sending. Until then use Resend's test sender. Reply-To is always danny@go-ipt.com.
- Customer email links work for 30 days (token stored hashed in `public.invites`; each tap issues a fresh session).
