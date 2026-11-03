// WHO gets WHICH ping for each event. Pure logic, no sending. See tests/unit/notify.test.ts.
//
// The rule: when something happens, the other people involved hear about it.
// Aníbal only hears about people he referred. The customer only gets emails
// that need them to do something (or the thank-you note).
import type { Messages } from "@/i18n/messages";
import type { Stage } from "@/lib/types";

export type PingEvent =
  | "lead_added"
  | "contacted"
  | "info_sent"
  | "quote_posted"
  | "proceed"
  | "bound"
  | "not_bought"
  | "not_fit";

export type Who = "danny" | "anibal" | "customer";
export type TemplateKey = keyof Messages["ping"]["templates"];
export type ButtonKey = keyof Messages["ping"]["buttons"];
export type PlannedPing = { to: Who; template: TemplateKey; button: ButtonKey };

export type PlanContext = {
  /** Was this lead referred by Aníbal? */
  referred: boolean;
  /** Who added the lead (lead_added only). null = the public sign-up page. */
  addedBy?: "admin" | "referrer" | null;
};

const toDanny = (template: TemplateKey): PlannedPing => ({ to: "danny", template, button: "viewLead" });
const toAnibal = (template: TemplateKey): PlannedPing => ({ to: "anibal", template, button: "myReferrals" });
const toCustomer = (template: TemplateKey, button: ButtonKey): PlannedPing => ({ to: "customer", template, button });

export function planPings(event: PingEvent, ctx: PlanContext): PlannedPing[] {
  const anibal = (template: TemplateKey) => (ctx.referred ? [toAnibal(template)] : []);
  switch (event) {
    case "lead_added":
      return [
        toCustomer("welcome", "sendInfo"),
        ...(ctx.addedBy === "referrer" ? [toDanny("newReferral")] : []),
        ...(ctx.addedBy === "admin" ? anibal("addedByDanny") : []),
        // Public sign-up page: through Aníbal's own link, both Danny and Aníbal hear about it.
        ...(ctx.addedBy == null && ctx.referred ? [toDanny("newSignupAnibal"), toAnibal("signupViaLink")] : []),
        ...(ctx.addedBy == null && !ctx.referred ? [toDanny("newSignup")] : []),
      ];
    case "contacted":
      return anibal("contacted");
    case "info_sent":
      return [toDanny("infoSentDanny"), ...anibal("infoSentAnibal")];
    case "quote_posted":
      return [toCustomer("quoteReady", "viewQuote"), ...anibal("quoteSent")];
    case "proceed":
      return [toDanny("proceed")]; // Aníbal sees it in the activity feed, no email
    case "bound":
      return [toCustomer("boundCustomer", "myFile"), ...anibal("boundAnibal")];
    case "not_bought":
      return anibal("notBought"); // the customer is never emailed about closing
    case "not_fit":
      return anibal("notFit");
  }
}

/**
 * Which ping (if any) Danny's stage change should send. Only real changes
 * count. "Info sent" and "Quote sent" ping when the customer or Danny actually
 * does those things, not when Danny picks them from the dropdown.
 */
export function stageChangeEvent(from: Stage, to: Stage): PingEvent | null {
  if (from === to) return null;
  if (to === "contacted" || to === "bound" || to === "not_bought" || to === "not_fit") return to;
  return null;
}
