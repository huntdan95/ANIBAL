# IPT Referidos

A small web app that keeps three people up to date on a referred insurance lead:
**Danny Hunt** (IPT agent), **Aníbal** (who sends referrals), and **the customer**.
Everyone signs in with an email link, so there are no passwords. Spanish is the default, with an ES/EN button at the top.

> Status: being built step by step. This README grows with each step.
> Done so far: database and security rules (step 1) and login (step 2).

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

## For developers

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Without a `RESEND_API_KEY`, emails (including sign-in links) are printed in the terminal instead of sent.

### Running the tests
The security tests run the real database migrations on a throwaway Postgres database and sign in as
Danny, Aníbal and a customer to check that each one sees only what they should:

```bash
# needs any Postgres 15+ you can connect to as a superuser
TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5432/postgres npm run test:db
```

---

## Hosting note
Vercel's free Hobby plan is meant for personal, non-commercial use. A business tool like this
technically calls for Vercel Pro ($20/month). Deployment steps come in the final build step.
