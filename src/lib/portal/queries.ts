import "server-only";
import { createClient } from "@/lib/supabase/server";
import { LEAD_COLUMNS, type Lead } from "@/lib/types";
import type { Quote } from "@/lib/quotes";
import type { IntakeInput } from "./validate";

export type Intake = IntakeInput & { submitted_at: string };

/**
 * The signed-in customer's own file (their newest lead) and their answers.
 * The database only returns rows that belong to them.
 */
export async function getMyFile(
  customerId: string,
): Promise<{ lead: Lead | null; intake: Intake | null; quotes: Quote[] }> {
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .eq("customer_id", customerId)
    .order("new_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lead) return { lead: null, intake: null, quotes: [] };

  const { data: intake } = await supabase
    .from("intake")
    .select(
      "needs, other_need, work_type, weekly_payroll, weeks_per_year, roof_year, vehicle_count, driver_count, submitted_at",
    )
    .eq("lead_id", (lead as Lead).id)
    .maybeSingle();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, lead_id, note, pdf_path, created_at, proceed_at")
    .eq("lead_id", (lead as Lead).id)
    .order("created_at", { ascending: false });
  return { lead: lead as Lead, intake: (intake as Intake | null) ?? null, quotes: (quotes as Quote[] | null) ?? [] };
}
