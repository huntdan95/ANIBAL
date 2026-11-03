import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { isLang } from "@/i18n/messages";
import { setLangCookie } from "@/i18n/server";
import { hashToken, makeSignInToken } from "@/lib/links";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * A customer's 30-day email link: /i/<token>.
 * Each tap checks the token, signs the customer in fresh, and opens their file.
 * Expired or unknown links go to the login page, which can send a new one.
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/i/[token]">) {
  const { token } = await ctx.params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invites")
    .select("user_id, expires_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  if (!invite || new Date(invite.expires_at) < new Date()) redirect("/login?error=expired");

  const { data: found } = await admin.auth.admin.getUserById(invite.user_id);
  const email = found.user?.email;
  if (!email) redirect("/login?error=expired");

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: await makeSignInToken(email),
  });
  if (error) redirect("/login?error=failed");

  const { data: profile } = await admin
    .from("profiles")
    .select("language")
    .eq("id", invite.user_id)
    .maybeSingle();
  if (isLang(profile?.language)) await setLangCookie(profile.language);

  redirect("/portal");
}
