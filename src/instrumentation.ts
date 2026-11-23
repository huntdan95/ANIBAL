import { emailFromWarning, env } from "@/lib/env";

/**
 * Runs once whenever a server instance starts (on Vercel: each cold start), so settings that
 * quietly break emails show up in Vercel → Logs.
 */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const warning = emailFromWarning(env.emailFrom(), process.env.NODE_ENV);
  if (warning) console.warn(`[config] ${warning}`);
}
