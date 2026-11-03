import "server-only";
import { isLang, type Lang } from "@/i18n/messages";
import { env } from "@/lib/env";
import { formatPhone } from "@/lib/format";
import { createInviteLink } from "@/lib/links";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHANNELS, type Recipient } from "./channels";
import { planPings, type PingEvent, type PlanContext, type Who } from "./plan";
import { firstName, renderPing } from "./render";

export type { PingEvent } from "./plan";

/**
 * Sends the pings for something that just happened to a lead.
 * Never throws: a failed email must not undo or block the action itself.
 * Call it inside next/server `after()` so the person isn't kept waiting.
 */
export async function notify(
  event: PingEvent,
  leadId: string,
  opts: { addedBy?: PlanContext["addedBy"]; channel?: string } = {},
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: lead, error } = await admin
      .from("leads")
      .select("id, full_name, phone, email, city, state, language, referrer_id, customer_id")
      .eq("id", leadId)
      .single();
    if (error || !lead) throw new Error(`lead ${leadId} not found: ${error?.message}`);

    const plan = planPings(event, { referred: Boolean(lead.referrer_id), addedBy: opts.addedBy });
    if (plan.length === 0) return;

    const site = env.siteUrl();
    const vars = {
      name: lead.full_name,
      first: firstName(lead.full_name),
      phone: formatPhone(lead.phone),
      place: [lead.city, lead.state].filter(Boolean).join(", ") || undefined,
      channel: opts.channel,
    };

    // Look up each person only if someone in the plan needs them.
    const needs = (w: Who) => plan.some((p) => p.to === w);
    const people: Partial<Record<Who, Recipient>> = {};
    const urls: Partial<Record<Who, string>> = {};

    if (needs("danny")) {
      const { data: staff } = await admin.from("staff").select("email, language").eq("role", "admin").limit(1).maybeSingle();
      if (staff) {
        const { data: prof } = await admin.from("profiles").select("language").eq("email", staff.email).maybeSingle();
        people.danny = { email: staff.email, lang: pickLang(prof?.language, staff.language) };
        urls.danny = `${site}/leads/${lead.id}`;
      }
    }
    if (needs("anibal") && lead.referrer_id) {
      const { data: prof } = await admin.from("profiles").select("email, language").eq("id", lead.referrer_id).maybeSingle();
      if (prof) {
        people.anibal = { email: prof.email, lang: pickLang(prof.language) };
        urls.anibal = `${site}/leads`;
      }
    }
    if (needs("customer")) {
      people.customer = { email: lead.email, phone: lead.phone, lang: pickLang(lead.language) };
      urls.customer = lead.customer_id ? await createInviteLink(lead.id, lead.customer_id) : `${site}/login`;
    }

    for (const ping of plan) {
      const to = people[ping.to];
      const url = urls[ping.to];
      if (!to || !url) continue;
      const message = renderPing(ping, to.lang, vars, url);
      for (const channel of CHANNELS) {
        const ok = await channel.send(to, message);
        console.log(`[ping] ${event} → ${ping.to} (${channel.name}) ${ok ? "sent" : "FAILED"}`);
      }
    }
  } catch (err) {
    console.error(`[ping] ${event} for lead ${leadId} failed:`, err);
  }
}

function pickLang(...candidates: unknown[]): Lang {
  for (const c of candidates) if (isLang(c)) return c;
  return "es";
}
