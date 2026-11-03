import "server-only";
import type { Lang } from "@/i18n/messages";
import { ensureAccount } from "@/lib/links";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Gives the lead's customer a sign-in account (or finds their existing one)
 * and links it to the lead, so they can open their own file later.
 * Staff emails are never linked as a customer.
 */
export async function linkCustomerAccount(
  leadId: string,
  email: string,
  meta: { fullName: string; language: Lang },
): Promise<string | null> {
  const admin = createAdminClient();
  const userId = await ensureAccount(email, meta);
  const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  const customerId = profile?.role === "customer" ? userId : null;
  const { error } = await admin.from("leads").update({ customer_id: customerId }).eq("id", leadId);
  if (error) throw new Error(`Could not link customer: ${error.message}`);
  return customerId;
}

/** Aníbal's account id, for Danny's "Referido por Aníbal" checkbox. */
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
