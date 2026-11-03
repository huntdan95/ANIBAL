"use server";

import { getLang } from "@/i18n/server";
import { sendLoginLink } from "@/lib/links";

export type LoginState = { status: "idle" | "sent" | "invalid" };

export async function requestLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 200) {
    return { status: "invalid" };
  }
  try {
    await sendLoginLink(email, await getLang());
  } catch (err) {
    // Show the same "check your email" message either way; log for Danny.
    console.error("Login link failed:", err);
  }
  return { status: "sent" };
}
