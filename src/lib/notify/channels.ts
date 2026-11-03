import "server-only";
import type { Lang } from "@/i18n/messages";
import { sendEmail } from "@/lib/email/send";
import type { Message } from "./render";

export type Recipient = { email: string; phone?: string | null; lang: Lang };

/**
 * A way to deliver a ping. Only email exists today.
 *
 * To add text messages later (Twilio):
 *   1. Add a short `sms` line to each template in src/i18n/messages.ts (ping.templates).
 *   2. Write `smsChannel` here that sends `message.sms` to `to.phone` with Twilio.
 *   3. Add it to CHANNELS below (and TWILIO_* keys to .env.example).
 * Nothing else in the app needs to change.
 */
export interface Channel {
  name: "email" | "sms";
  send(to: Recipient, message: Message): Promise<boolean>;
}

export const emailChannel: Channel = {
  name: "email",
  send: (to, m) => sendEmail({ to: to.email, subject: m.subject, text: m.text, html: m.html }),
};

export const CHANNELS: Channel[] = [emailChannel];
