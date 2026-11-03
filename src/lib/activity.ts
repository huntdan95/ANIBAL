import "server-only";
import type { Messages } from "@/i18n/messages";
import type { Role } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type EventKind =
  | "created"
  | "contacted"
  | "info_sent"
  | "quote_sent"
  | "proceed"
  | "bound"
  | "not_bought"
  | "not_fit"
  | "reopened";

export type FeedItem = {
  id: number;
  kind: EventKind;
  actor_role: Role | null;
  created_at: string;
  lead_id: string;
  lead_name: string;
};

/**
 * The latest events the signed-in person may see (Danny: all; Aníbal: only
 * his referrals). Events never hold dollar amounts, only what happened.
 */
export async function listActivity(limit = 20): Promise<FeedItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, kind, actor_role, created_at, lead_id, lead:leads(full_name)")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load activity: ${error.message}`);
  return (data ?? []).map((row) => {
    const lead = row.lead as { full_name: string } | { full_name: string }[] | null;
    const name = Array.isArray(lead) ? lead[0]?.full_name : lead?.full_name;
    return {
      id: row.id,
      kind: row.kind as EventKind,
      actor_role: row.actor_role as Role | null,
      created_at: row.created_at,
      lead_id: row.lead_id,
      lead_name: name ?? "—",
    };
  });
}

/** One event in plain words, for example "Juan Pérez envió su información". */
export function describeEvent(t: Messages, e: Pick<FeedItem, "kind" | "actor_role" | "lead_name">): string {
  const n = e.lead_name;
  switch (e.kind) {
    case "created":
      return e.actor_role === "referrer"
        ? t.feed.created_referrer(n)
        : e.actor_role === "admin"
          ? t.feed.created_admin(n)
          : t.feed.created_self(n);
    default:
      return t.feed[e.kind](n);
  }
}
