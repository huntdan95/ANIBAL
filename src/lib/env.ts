// Central place for settings that come from .env.local / Vercel.

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

const LOCAL_SITE_URL = "http://localhost:3000";

/**
 * Where the app lives, for the links in every email. Pure, so it's unit-tested.
 * Only local dev and tests fall back to localhost. On the live site a missing value is an error,
 * so a missing setting can never email people a localhost link. (`next build` also refuses to
 * build without it: see next.config.ts.)
 */
export function resolveSiteUrl(value: string | undefined, nodeEnv: string | undefined): string {
  if (value) return value.replace(/\/+$/, "");
  if (nodeEnv === "production") {
    throw new Error(
      "Missing environment variable NEXT_PUBLIC_SITE_URL, so no email links can be made. " +
        'In Vercel, add it (type "Config") with the site\'s address, then redeploy.',
    );
  }
  return LOCAL_SITE_URL;
}

/**
 * A warning for the live site when emails still come from Resend's test sender, which only
 * delivers to the Resend account's own address. Pure, so it's unit-tested. Logged on startup
 * (src/instrumentation.ts).
 */
export function emailFromWarning(emailFrom: string, nodeEnv: string | undefined): string | null {
  if (nodeEnv !== "production" || !/@resend\.dev\b/i.test(emailFrom)) return null;
  return (
    `EMAIL_FROM is "${emailFrom}". Resend's test sender only delivers to the Resend account's own address, ` +
    "so Aníbal and customers get no emails. In Vercel, set EMAIL_FROM to an address at your verified domain, " +
    "then redeploy."
  );
}

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: () =>
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  supabaseSecretKey: () => required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY),
  siteUrl: () => resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, process.env.NODE_ENV),
  resendApiKey: () => process.env.RESEND_API_KEY ?? "",
  emailFrom: () => process.env.EMAIL_FROM ?? "Danny Hunt - IPT <onboarding@resend.dev>",
  emailReplyTo: () => process.env.EMAIL_REPLY_TO ?? "danny@go-ipt.com",
};
