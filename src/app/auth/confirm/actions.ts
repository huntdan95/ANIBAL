"use server";

import { redirect } from "next/navigation";
import { isLang } from "@/i18n/messages";
import { setLangCookie } from "@/i18n/server";
import { homeFor, type Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Second half of the login link: trade the one-time token for a session. */
export async function confirmLogin(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });
  if (error || !data.user) redirect("/login?error=failed");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, language")
    .eq("id", data.user.id)
    .maybeSingle<{ role: Role; language: string }>();
  if (!profile) redirect("/login?error=failed");
  if (isLang(profile.language)) await setLangCookie(profile.language);
  redirect(homeFor(profile.role));
}
