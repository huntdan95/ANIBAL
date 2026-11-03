import "server-only";
import { env } from "@/lib/env";

export type Email = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Sends one email through Resend. With no RESEND_API_KEY set (local testing),
 * the email is printed to the terminal instead, links included.
 * Returns true when it was handed off successfully.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  const apiKey = env.resendApiKey();
  if (!apiKey) {
    console.log(
      `\n──── EMAIL (not sent: no RESEND_API_KEY) ────\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}\n────────────────────────────────────────────\n`,
    );
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.emailFrom(),
        to: [email.to],
        reply_to: env.emailReplyTo(),
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });
    if (!res.ok) {
      console.error(`Email to ${email.to} failed: ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Email to ${email.to} failed:`, err);
    return false;
  }
}
