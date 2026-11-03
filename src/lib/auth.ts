import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Lang } from "@/i18n/messages";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "referrer" | "customer";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  language: Lang;
};

/** The signed-in person's profile, or null if nobody is signed in. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, language")
    .eq("id", userId)
    .maybeSingle<Profile>();
  return profile ?? null;
});

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  return role === "customer" ? "/portal" : "/leads";
}

/**
 * Use at the top of every page and server action. Sends people who aren't
 * signed in to /login, and people with the wrong role to their own home page.
 * (The database enforces access too. This just keeps people on the right screens.)
 */
export async function requireRole(...roles: Role[]): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!roles.includes(profile.role)) redirect(homeFor(profile.role));
  return profile;
}
