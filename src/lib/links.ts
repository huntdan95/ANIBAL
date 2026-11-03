import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { messages, type Lang } from "@/i18n/messages";
import { sendEmail } from "@/lib/email/send";
import { renderEmail } from "@/lib/email/template";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/** How long a customer's email link keeps working. */
export const INVITE_DAYS = 30;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Returns the sign-in account id for an email, creating the account if needed.
 * New accounts become customers unless the email is on the staff list.
 */
export async function ensureAccount(email: string, meta: { fullName?: string; language?: Lang } = {}): Promise<string> {
  const admin = createAdminClient();
  email = normalizeEmail(email);
  const existing = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing.data) return existing.data.id;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: meta.fullName, language: meta.language },
  });
  if (data.user) return data.user.id;

  // Someone else created it a moment ago.
  const again = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (again.data) return again.data.id;
  throw new Error(`Could not create account for ${email}: ${error?.message}`);
}

/**
 * A customer's 30-day link. Every tap signs them in fresh, so it keeps working
 * even if they open the email days later. Only a hash of the token is stored.
 */
export async function createInviteLink(leadId: string, userId: string): Promise<string> {
  const token = newToken();
  const { error } = await createAdminClient()
    .from("invites")
    .insert({
      token_hash: hashToken(token),
      lead_id: leadId,
      user_id: userId,
      expires_at: new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    });
  if (error) throw new Error(`Could not create invite: ${error.message}`);
  return `${env.siteUrl()}/i/${token}`;
}

/** A one-time hashed token Supabase accepts with verifyOtp() to start a session. */
export async function makeSignInToken(email: string): Promise<string> {
  const { data, error } = await createAdminClient().auth.admin.generateLink({
    type: "magiclink",
    email: normalizeEmail(email),
  });
  if (error || !data.properties?.hashed_token) {
    throw new Error(`Could not make sign-in link: ${error?.message}`);
  }
  return data.properties.hashed_token;
}

/**
 * The login page. Emails a 1-hour sign-in link, but only to people who
 * already have an account (customers) or are on the staff list (Danny, Aníbal).
 * The page shows the same message either way so it doesn't reveal who's registered.
 */
export async function sendLoginLink(rawEmail: string, lang: Lang): Promise<void> {
  const email = normalizeEmail(rawEmail);
  const admin = createAdminClient();

  const profile = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!profile.data) {
    const staff = await admin.from("staff").select("email").eq("email", email).maybeSingle();
    if (!staff.data) return; // not registered: silently do nothing
    await ensureAccount(email);
  }

  const tokenHash = await makeSignInToken(email);
  const url = `${env.siteUrl()}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}`;
  const t = messages[lang];
  const { text, html } = renderEmail({
    lines: [t.email.login.body],
    button: { label: t.email.login.button, url },
    footer: [t.email.login.ignore],
    signature: t.email.signature,
  });
  await sendEmail({ to: email, subject: t.email.login.subject, text, html });
}
