# IPT Referidos

A small web app that keeps three people up to date on a referred insurance lead:
**Danny Hunt** (IPT agent), **Aníbal** (who sends referrals), and **the customer**.
Everyone signs in with an email link, so there are no passwords. Spanish is the default, with an ES/EN button at the top.

> **Status:** all 9 parts are built and the automatic tests pass. It has **not yet run against a real
> Supabase/Resend account**. Your first deploy (Part 3) and the checklist in Part 4 are its first live test.

**What's in it:** magic-link sign-in for Danny, Aníbal and customers · lead list with progress bars · referral form ·
"next step" buttons · activity feed · email pings · customer page with "Mi información" and quotes ·
quote PDFs in private storage · public sign-up pages · Danny's scorecard.

---

## What you need (all free to start)

| Service | What it does | Cost |
|---|---|---|
| [GitHub](https://github.com) | Stores the code | Free |
| [Supabase](https://supabase.com) | Database, sign-in, private quote PDFs | Free plan |
| [Resend](https://resend.com) | Sends the emails | Free up to 3,000/month |
| [Vercel](https://vercel.com) | Puts the website online | Free Hobby plan (see note at the end) |

---

## Part 1: Set up Supabase (about 10 minutes)

### 1. Create the project
1. Log in to [supabase.com](https://supabase.com) and click **New project**.
2. Name: `anibal-referidos`.
3. Database password: click **Generate a password** and save it in your password manager.
4. Region: **East US (Ohio)** or **East US (North Virginia)**.
5. Click **Create new project** and wait about 2 minutes.

### 2. Load the database
The database setup lives in files in this repository, in the folder `supabase/migrations`.
Run them **in order, oldest first** (the file names start with the date):

1. On GitHub, open the folder `supabase/migrations` and click the first file.
2. Click the **Copy raw file** button (two overlapping squares, top right of the file).
3. In Supabase, open **SQL Editor** (left sidebar), then **New query**, paste, and click **Run**.
   You should see "Success. No rows returned."
4. Repeat for each file, in order.

To check that it worked, open **Table Editor**. You should see `leads`, `quotes`, `events`, `profiles`, `staff`
and others, and the `staff` table should have 2 rows (Danny and Aníbal).

> When a later update adds a new file to `supabase/migrations`, run just that new file the same way.

### 3. Turn off open sign-ups
**Authentication → Sign In / Providers** → turn **off** "Allow new users to sign up" → **Save**.
Leave the **Email** provider turned on. The app creates accounts itself (for Danny, Aníbal and each customer),
so nobody else can make one.

### 4. Find your keys (you'll paste them into Vercel later)
- **Project URL:** Project Settings → **Data API**. It looks like `https://abcd1234.supabase.co`.
- **Publishable key:** Project Settings → **API Keys**. It starts with `sb_publishable_`.
- **Secret key:** same page. It starts with `sb_secret_`. Click to reveal it.

⚠️ The **secret key** can read everything. Only paste it into Vercel's or your own `.env.local` settings.
Never put it in an email, a chat, or a file on GitHub.

---

## Part 2: Set up email (Resend)

The app sends every email itself: sign-in links, customer links, and the "pings".
Customers who hit **Reply** reach **danny@go-ipt.com**, whatever address the email is sent from.

### 1. Get an API key (5 minutes)
1. Sign up at [resend.com](https://resend.com) (free: 3,000 emails a month, 100 a day).
2. Go to **API Keys** → **Create API Key** → name it `anibal-referidos`, permission **Sending access** → **Add**.
3. Copy the key (it starts with `re_`). You only see it once. You'll paste it into Vercel as `RESEND_API_KEY`.

**Until step 2 below is done**, Resend only delivers to the email address you signed up to Resend with,
sent from `onboarding@resend.dev`. That's fine for trying the app yourself, but customers and Aníbal won't get anything yet.

### 2. Send from your own domain (so everyone gets the emails)
1. Buy a domain at any registrar (Cloudflare, Namecheap, Porkbun…), about $10–15 a year.
   Something like `iptreferidos.com`. You can use the same domain for the website later.
2. In Resend: **Domains** → **Add Domain** → type your domain → **Add**.
3. Resend shows a few **DNS records** (TXT and MX). In your registrar's DNS settings, add each one exactly as shown.
4. Back in Resend, click **Verify**. It can take a few minutes up to a few hours.
5. Once it says **Verified**, set `EMAIL_FROM` to an address at that domain, for example:
   `EMAIL_FROM="Danny Hunt - IPT <danny@iptreferidos.com>"`
   (That address doesn't need a mailbox. Replies go to `EMAIL_REPLY_TO`, which is danny@go-ipt.com.)

### Who gets which email
| When… | Danny | Aníbal (his referrals only) | Customer |
|---|---|---|---|
| Aníbal adds a referral | ✓ | | ✓ welcome + 30-day link |
| Danny adds a referral | | ✓ if "Referido por Aníbal" | ✓ welcome + 30-day link |
| Danny marks **Contactado** | | ✓ | |
| Customer sends their info | ✓ | ✓ | |
| Danny posts a quote | | ✓ | ✓ "Su cotización está lista" + link |
| Customer taps **Quiero seguir adelante** | ✓ | (shows in his Actividad tab) | |
| Danny marks **Póliza activa** | | ✓ | ✓ thank-you |
| Danny marks **No compró / No califica** | | ✓ | (never) |

Each email is in the recipient's language: Danny in English, Aníbal in Spanish, and the customer in the language chosen on their referral.
You can change your own language with the ES/EN button at the top of the app.

---

## Part 3: Put it online (Vercel, about 15 minutes)

1. Go to [vercel.com](https://vercel.com) → **Sign Up** → **Continue with GitHub**.
2. **Add New… → Project** → find **huntdan95/ANIBAL** → **Import**.
3. Leave the settings as they are (Vercel sees it's a Next.js app). Open **Environment Variables** and add these
   (names exactly as written; values from Part 1 step 4 and Part 2):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the `sb_publishable_…` key |
   | `SUPABASE_SECRET_KEY` | the `sb_secret_…` key |
   | `NEXT_PUBLIC_SITE_URL` | leave as `https://anibal.vercel.app` for now; you'll fix it in step 5 |
   | `RESEND_API_KEY` | the `re_…` key |
   | `EMAIL_FROM` | `Danny Hunt - IPT <onboarding@resend.dev>` until your domain is verified, then e.g. `Danny Hunt - IPT <danny@iptreferidos.com>` |
   | `EMAIL_REPLY_TO` | `danny@go-ipt.com` |

4. Click **Deploy** and wait 1–2 minutes. Vercel shows your site's address, something like `https://anibal-xyz.vercel.app`.
5. Copy that address. In Vercel: **Settings → Environment Variables** → edit `NEXT_PUBLIC_SITE_URL` → paste it
   (no slash at the end) → **Save**. Then **Deployments** → ⋯ on the newest one → **Redeploy**.
   (Every email link uses this address, so it must be right.)
6. In Supabase: **Authentication → URL Configuration** → set **Site URL** to the same address → **Save**.

**Your own domain (optional, later):** Vercel → your project → **Settings → Domains** → add e.g. `iptreferidos.com`
and follow the DNS instructions. Then update `NEXT_PUBLIC_SITE_URL` and Supabase's Site URL to the new address and redeploy.

Every time new code is pushed to GitHub, Vercel updates the site by itself.

**Cost note:** Vercel's free Hobby plan is meant for personal, non-commercial use. A business tool like this
technically calls for Vercel Pro ($20/month). The free plan works the same way if you want to try it first.

---

## Part 4: First sign-in and a 10-minute test drive

> ⚠️ Until your sending domain is verified in Resend (Part 2, step 2), emails are only delivered to the address
> you signed up to Resend with. Sign up to Resend with **danny@go-ipt.com** so you can test as Danny right away.
> Aníbal and customers start receiving emails once the domain is verified.

1. **You:** open your site → type `danny@go-ipt.com` → **Enviarme el enlace** → open the email → tap the button →
   tap **Entrar**. You land on the lead list in English. ✅ Login works.
2. **Example data:** load the 3 EJEMPLO leads (section below) and check the list, the filters, search ("perez"), and the
   **Activity** and **Scorecard** tabs. (Examples don't count on the scorecard.)
3. **A test customer:** add a referral with a second email of yours (for example huntdanb@icloud.com) and check
   **Referred by Aníbal**. The customer gets a welcome email ("Danny Hunt de IPT le ayudará…").
4. **Be the customer:** open that email in a private/incognito window, tap the button → you see "Hola, …". Fill in
   "Mi información" → **Enviar a Danny**. As Danny you get "… sent their info", and the lead shows **Info sent**.
5. **Post a quote:** on the lead, upload any PDF with a note → **Post and notify**. The customer gets
   "Su cotización está lista". In the customer window, open the PDF and tap **Quiero seguir adelante** → you get an email.
6. **Bind it:** tap **✓ They bought the policy**. The customer sees "🎉 ¡Su póliza está activa!".
7. **Aníbal:** once your domain is verified, have Aníbal sign in with anibalperez1000@gmail.com. He should see only his
   referrals: no Scorecard tab, no prices, no PDFs.
8. **Public page:** open `/r/radio` on your phone and sign up with another email.

If anything in this list doesn't behave as described, send a screenshot. Errors also show up in Vercel under
**your project → Logs**.

---

## Your public sign-up links (radio, newsletter, magazine, events)

Share these so people can sign up on their own. Replace `YOUR-SITE` with your website address (for example `iptreferidos.com`):

| Where | Link to share | Shows up as |
|---|---|---|
| Radio | `https://YOUR-SITE/r/radio` | Radio |
| Newsletter | `https://YOUR-SITE/r/boletin` | Boletín |
| Magazine | `https://YOUR-SITE/r/revista` | Revista |
| Events | `https://YOUR-SITE/r/evento` | Evento |
| **Aníbal's own link** | `https://YOUR-SITE/r/anibal` | Presentación de Aníbal, **counted as his referral** |

Aníbal doesn't need to remember his link: it's at the top of his referral list, with **WhatsApp**, **Copiar enlace**
and **Compartir** buttons. When someone signs up through it, you and Aníbal both get an email.

Each person who signs up becomes a **Nuevo** lead tagged with that channel. They get an email with their 30-day link, and you get a "New sign-up" email.
If the same email signs up again while their lead is still open, they just get their link again (no duplicate).

Tip: for print (magazine, flyers at events), turn the link into a QR code with any free QR code maker.

Built-in protection: a hidden trap field for bots, names can't contain links, and if more than 25 people sign up
within 10 minutes the page pauses and asks people to call you instead.

---

## Optional: load the 3 example leads ("EJEMPLO")
Do this **after** you and Aníbal have each signed in once, so the examples show up for him too.

1. On GitHub, open `supabase/seed.sql` and copy the raw file.
2. In Supabase **SQL Editor** → **New query**, paste, and click **Run**.

You'll get 3 fake leads, every one starting with "EJEMPLO" and tagged EJEMPLO on its card:
- **Juan Pérez:** New, referred by Aníbal, shows "3 días sin contacto".
- **María López:** Quote sent, referred by Aníbal.
- **Carlos Ramírez:** Policy bound, came from the radio, lives in Georgia. Aníbal does not see this one.

Running it again replaces the examples (no duplicates). To **remove** them when you're done, run this line in the SQL Editor:

```sql
delete from public.leads where is_example;
```

---

## Changing Danny's or Aníbal's email
In Supabase **SQL Editor**, run (with the new email, all lowercase):

```sql
insert into public.staff (email, role, full_name, language)
values ('new-email@example.com', 'admin', 'Danny Hunt', 'en')   -- use 'referrer' and 'es' for Aníbal
on conflict (email) do update set role = excluded.role;
```

Then sign in with the new email. Also update the file `supabase/migrations/20261103000200_staff.sql`
so the code matches.

---

## How sign-in works
- **Danny and Aníbal:** go to the site, type your email, and tap the link in the email (it works for 1 hour).
  The link opens a page with an **Entrar / Sign in** button. Tap it to finish. (That extra tap stops work
  email scanners from using up the link before you do.)
- **Customers:** their emails from Danny contain a personal link that works for **30 days**. One tap opens
  their file. After 30 days they can type their email on the sign-in page to get a new one.

---

## Copy the code to your computer (optional)

The app runs on Vercel, so you don't need this to use it. To keep a copy in `C:\Apps\ANIBAL`:

1. Install [GitHub Desktop](https://desktop.github.com) and sign in.
2. **File → Clone repository** → pick **huntdan95/ANIBAL** → Local path `C:\Apps` → **Clone**.
   (It creates `C:\Apps\ANIBAL`.)
3. To get updates later: open GitHub Desktop → **Fetch origin** → **Pull**.

---

## For developers

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Without a `RESEND_API_KEY`, emails (including sign-in links) are printed in the terminal instead of sent.
Each ping is also logged as `[ping] <event> → <who> (email) sent`.

### Running the tests
The security tests run the real database migrations on a throwaway Postgres database and sign in as
Danny, Aníbal and a customer to check that each one sees only what they should:

```bash
# needs any Postgres 15+ you can connect to as a superuser
TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5432/postgres npm run test:db
npm run test:unit   # form checks and list filters (no database needed)
```
