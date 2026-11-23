import "server-only";
import type { Lang } from "@/i18n/messages";
import { ensureAccount, normalizeEmail } from "@/lib/links";
import { isStaffAddress } from "@/lib/login";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Gives the lead's customer a sign-in account (or finds their existing one)
 * and links it to the lead, so they can open their own file later.
 * Staff are never linked as a customer: neither their email nor their sign-in
 * address (staff.login_email), which must never become an account of its own.
 */
export async function linkCustomerAccount(
  leadId: string,
  email: string,
  meta: { fullName: string; language: Lang },
): Promise<string | null> {
  const admin = createAdminClient();
  // `*` keeps this working before the login_email column exists.
  const staff = await admin.from("staff").select("*");
  if (staff.error) throw new Error(`Could not read the staff list in Supabase: ${staff.error.message}`);

  let customerId: string | null = null;
  if (!isStaffAddress(staff.data ?? [], normalizeEmail(email))) {
    const userId = await ensureAccount(email, meta);
    const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
    customerId = profile?.role === "customer" ? userId : null;
  }
  const { error } = await admin.from("leads").update({ customer_id: customerId }).eq("id", leadId);
  if (error) throw new Error(`Could not link customer: ${error.message}`);
  return customerId;
}

/** Aníbal's account id (made if he has never signed in). Every lead is credited to him. */
export async function getReferrerId(): Promise<string | null> {
  const admin = createAdminClient();
  const { data: staff } = await admin
    .from("staff")
    .select("email")
    .eq("role", "referrer")
    .order("email")
    .limit(1)
    .maybeSingle();
  return staff ? ensureAccount(staff.email) : null;
}
