import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { env } from "@/shared/config/env";

export function createClient() {
  return createBrowserClient<Database, "public">(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
