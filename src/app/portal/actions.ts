"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireRole } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { getMyFile } from "@/lib/portal/queries";
import { validateIntake, type IntakeFormState } from "@/lib/portal/validate";
import { createClient } from "@/lib/supabase/server";

const rawValues = (fd: FormData) => {
  const out: Record<string, string | string[]> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$")) continue;
    const all = fd.getAll(key).map(String);
    out[key] = key === "needs" ? all : (all[0] ?? "");
  }
  return out;
};

/** "Enviar a Danny": saves the customer's info and pings Danny + Aníbal. */
export async function submitIntake(_prev: IntakeFormState, fd: FormData): Promise<IntakeFormState> {
  const profile = await requireRole("customer");
  // The lead comes from the server, never from the form.
  const { lead } = await getMyFile(profile.id);
  if (!lead) return { status: "error", errors: {}, message: "failed", values: rawValues(fd) };

  const { contact, intake, errors } = validateIntake(fd, lead.email);
  if (Object.keys(errors).length) {
    return { status: "error", errors, message: "fixErrors", values: rawValues(fd) };
  }
  const forBusiness = intake.needs.includes("business") || intake.needs.includes("workers");

  // submit_intake() only works on the caller's own lead (checked in the database).
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_intake", {
    p_lead_id: lead.id,
    p_full_name: contact.full_name,
    p_phone: contact.phone,
    p_street: contact.street,
    p_city: contact.city,
    p_state: contact.state,
    p_zip: contact.zip,
    p_business_name: forBusiness ? contact.business_name : lead.business_name,
    p_language: contact.language,
    p_needs: intake.needs,
    p_other_need: intake.other_need,
    p_work_type: intake.work_type,
    p_weekly_payroll: intake.weekly_payroll,
    p_weeks_per_year: intake.weeks_per_year,
    p_roof_year: intake.roof_year,
    p_vehicle_count: intake.vehicle_count,
    p_driver_count: intake.driver_count,
  });
  if (error) {
    console.error("submit_intake failed:", error);
    return { status: "error", errors: {}, message: "failed", values: rawValues(fd) };
  }

  const leadId = lead.id;
  after(() => notify("info_sent", leadId)); // Danny + Aníbal
  redirect("/portal?sent=1");
}

/** "Quiero seguir adelante": tells Danny. It does NOT buy anything; Danny calls to finish. */
export async function wantToProceed(quoteId: string) {
  await requireRole("customer");
  const supabase = await createClient();
  // quote_proceed() only works on the caller's own quote (checked in the database).
  const { data: firstTime, error } = await supabase.rpc("quote_proceed", { p_quote_id: quoteId });
  if (error) {
    console.error("quote_proceed failed:", error);
    redirect("/portal");
  }
  if (firstTime) {
    const { data: quote } = await supabase.from("quotes").select("lead_id").eq("id", quoteId).maybeSingle();
    if (quote) {
      const leadId = quote.lead_id as string;
      after(() => notify("proceed", leadId)); // Danny
    }
  }
  redirect("/portal?proceed=1#cotizaciones");
}
