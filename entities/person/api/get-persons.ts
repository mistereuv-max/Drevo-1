import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Person } from "@/entities/person/model/types";
import { env } from "@/shared/config/env";

function isSupabaseConfigured(): boolean {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return false;
  }

  if (url.includes("example.supabase.co") || anonKey === "example-anon-key") {
    return false;
  }

  return true;
}

export const getPersons = cache(async (): Promise<Person[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const supabase = await createClient();

    const queryPromise = supabase
      .from("person")
      .select("*")
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true });

    const result = await Promise.race([
      queryPromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);

    if (!result) {
      return [];
    }

    const { data, error } = result;
    if (error) {
      return [];
    }

    return data ?? [];
  } catch (_error) {
    return [];
  }
});
