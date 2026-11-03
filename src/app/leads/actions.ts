"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getReferrerId, linkCustomerAccount } from "@/lib/leads/accounts";
import { validateLead, type FieldErrors } from "@/lib/leads/validate";
import { createClient } from "@/lib/supabase/server";

export type LeadFormState = {
  status: "idle" | "error";
  errors: FieldErrors;
  message?: "fixErrors" | "failed";
  values?: Record<string, string>;
};

const rawValues = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;

/** Add a referral (Danny or Aníbal). */
export async function createLead(_prev: LeadFormState, fd: FormData): Promise<LeadFormState> {
  const profile = await requireRole("admin", "referrer");
  const { input, errors } = validateLead(fd);
  if (Object.keys(errors).length) return { status: "error", errors, message: "fixErrors", values: rawValues(fd) };

  let referrer_id: string | null = null;
  if (profile.role === "referrer") referrer_id = profile.id;
  else if (fd.get("referred_by_anibal") === "on") referrer_id = await getReferrerId();

  // Inserted AS the signed-in person, so the database rules apply
  // (Aníbal's referrals are always "New" and credited to him).
  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").insert({ ...input, referrer_id }).select("id").single();
  if (error || !data) {
    console.error("createLead failed:", error);
    return { status: "error", errors: {}, message: "failed", values: rawValues(fd) };
  }

  try {
    await linkCustomerAccount(data.id, input.email, { fullName: input.full_name, language: input.language });
  } catch (err) {
    console.error("Could not create the customer's account:", err);
  }

  redirect("/leads?added=1");
}

/** Edit a referral (Danny only). */
export async function updateLead(id: string, _prev: LeadFormState, fd: FormData): Promise<LeadFormState> {
  await requireRole("admin");
  const { input, errors } = validateLead(fd);
  if (Object.keys(errors).length) return { status: "error", errors, message: "fixErrors", values: rawValues(fd) };

  const supabase = await createClient();
  const { data: before } = await supabase.from("leads").select("email, referrer_id").eq("id", id).maybeSingle();
  if (!before) return { status: "error", errors: {}, message: "failed", values: rawValues(fd) };

  const wantsReferrer = fd.get("referred_by_anibal") === "on";
  const referrer_id = wantsReferrer ? (before.referrer_id ?? (await getReferrerId())) : null;

  const { error } = await supabase.from("leads").update({ ...input, referrer_id }).eq("id", id);
  if (error) {
    console.error("updateLead failed:", error);
    return { status: "error", errors: {}, message: "failed", values: rawValues(fd) };
  }

  if (before.email !== input.email) {
    try {
      await linkCustomerAccount(id, input.email, { fullName: input.full_name, language: input.language });
    } catch (err) {
      console.error("Could not re-link the customer's account:", err);
    }
  }

  redirect(`/leads/${id}?saved=1`);
}
