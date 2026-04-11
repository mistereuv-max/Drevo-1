import type { Database } from "@/lib/types/database";

export type Person = Database["public"]["Tables"]["person"]["Row"];
export type CreatePersonInput = Database["public"]["Tables"]["person"]["Insert"];
export type UpdatePersonInput = Database["public"]["Tables"]["person"]["Update"];

