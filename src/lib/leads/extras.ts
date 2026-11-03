import "server-only";
import type { Intake } from "@/lib/portal/queries";
import type { Quote } from "@/lib/quotes";
import { createClient } from "@/lib/supabase/server";
import type { PrivateDetails } from "./private";

const INTAKE_COLUMNS =
  "needs, other_need, work_type, weekly_payroll, weeks_per_year, roof_year, vehicle_count, driver_count, submitted_at";
export const QUOTE_COLUMNS = "id, lead_id, note, pdf_path, created_at, proceed_at";

/**
 * Everything on Danny's lead page beyond the lead itself. Read AS Danny, so
 * the database rules apply: for anyone else these come back empty.
 */
export async function getLeadExtras(leadId: string): Promise<{
  intake: Intake | null;
  priv: PrivateDetails | null;
  quotes: Quote[];
}> {
  const supabase = await createClient();
  const [intake, priv, quotes] = await Promise.all([
    supabase.from("intake").select(INTAKE_COLUMNS).eq("lead_id", leadId).maybeSingle(),
    supabase
      .from("lead_private")
      .select("coverage_lines, est_premium, commission, notes")
      .eq("lead_id", leadId)
      .maybeSingle(),
    supabase.from("quotes").select(QUOTE_COLUMNS).eq("lead_id", leadId).order("created_at", { ascending: false }),
  ]);
  return {
    intake: (intake.data as Intake | null) ?? null,
    priv: (priv.data as PrivateDetails | null) ?? null,
    quotes: (quotes.data as Quote[] | null) ?? [],
  };
}
