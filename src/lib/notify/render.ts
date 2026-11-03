// HOW a ping looks: picks the template in the recipient's language and builds
// the email. Pure, so it can be tested without sending anything.
import { messages, type Lang, type PingVars } from "@/i18n/messages";
import { renderEmail } from "@/lib/email/template";
import type { PlannedPing } from "./plan";

export type Message = { subject: string; text: string; html: string };

export function renderPing(ping: PlannedPing, lang: Lang, vars: PingVars, url: string): Message {
  const t = messages[lang];
  const { subject, lines } = t.ping.templates[ping.template](vars);
  const { text, html } = renderEmail({
    lines,
    button: { label: t.ping.buttons[ping.button], url },
    footer: ping.to === "customer" ? [t.ping.linkDays] : undefined,
    signature: t.email.signature,
  });
  return { subject, text, html };
}

export function firstName(fullName: string): string {
  // "EJEMPLO – Juan Pérez" -> "Juan"; "María López" -> "María"
  const words = fullName
    .replace(/^EJEMPLO\s*[–-]\s*/i, "")
    .trim()
    .split(/\s+/);
  return words[0] || fullName;
}
