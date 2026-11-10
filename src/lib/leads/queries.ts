import "server-only";
import { createClient } from "@/lib/supabase/server";
import { LEAD_COLUMNS, type Lead } from "@/lib/types";

/**
 * Every lead the signed-in person may see. The database decides:
 * Danny gets all of them, Aníbal the ones credited to him (which is every lead).
 */
export async function listVisibleLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_COLUMNS)
    .order("new_at", { ascending: false })
    .limit(2000);
  if (error) throw new Error(`Could not load leads: ${error.message}`);
  return (data ?? []) as Lead[];
}

export async function getLead(id: string): Promise<Lead | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("leads").select(LEAD_COLUMNS).eq("id", id).maybeSingle();
  return (data as Lead | null) ?? null;
}
