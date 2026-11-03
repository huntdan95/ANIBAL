import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Supabase client with the SECRET key. It skips row-level security, so use it
 * only on the server and only for jobs no signed-in user may do themselves:
 * creating sign-in accounts, making login/invite links, the public sign-up
 * page, and looking up who to email.
 */
export function createAdminClient() {
  return createClient(env.supabaseUrl(), env.supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
