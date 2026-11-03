"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase in the browser. Used only to send a quote PDF straight to storage
 * with a one-time upload link the server made (so big PDFs don't pass through
 * the website, which has a 4.5 MB limit on Vercel).
 */
export function createBrowserSupabase() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
