import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function getSafeUser(timeoutMs = 1500): Promise<User | null> {
  try {
    const supabase = await createClient();

    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);

    if (!result) {
      return null;
    }

    const { data, error } = result;
    if (error) {
      return null;
    }

    return data.user ?? null;
  } catch {
    return null;
  }
}

