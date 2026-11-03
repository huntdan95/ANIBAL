"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isLang } from "@/i18n/messages";
import { setLangCookie } from "@/i18n/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** ES/EN toggle. Also saves it on the profile so emails use the same language. */
export async function setLanguage(formData: FormData) {
  const lang = formData.get("lang");
  if (!isLang(lang)) return;
  await setLangCookie(lang);
  const profile = await getProfile();
  if (profile) {
    const supabase = await createClient();
    await supabase.from("profiles").update({ language: lang }).eq("id", profile.id);
  }
  refresh();
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
