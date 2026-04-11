"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CreatePersonInput, UpdatePersonInput } from "@/entities/person/model/types";

export type PersonActionState = {
  ok: boolean;
  message: string | null;
};

const defaultActionState: PersonActionState = {
  ok: false,
  message: null,
};

const nullableUuid = z.union([z.literal(""), z.string().uuid()]).transform((value) =>
  value === "" ? null : value,
);

const personSchema = z.object({
  id: z.union([z.literal(""), z.string().uuid()]).optional(),
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().min(1),
  middle_name: z.string().trim().optional(),
  birth_date: z.string().trim().min(1),
  birth_place: z.string().trim().optional(),
  role: z.string().trim().min(1),
  bio: z.string().trim().optional(),
  note: z.string().trim().optional(),
  father_id: nullableUuid.optional(),
  mother_id: nullableUuid.optional(),
  spouse_id: nullableUuid.optional(),
  current_avatar_url: z.string().optional(),
  link_target_id: nullableUuid.optional(),
  link_relation: z.enum(["father", "mother", "spouse", ""]).optional(),
});

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapDbError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('relation "person" does not exist')) {
    return "Таблица person не найдена. Выполните SQL-миграцию `supabase/migrations/0001_init.sql` в Supabase.";
  }

  if (normalized.includes("row-level security") || normalized.includes("permission denied")) {
    return "Нет прав на изменение данных. Проверьте авторизацию и RLS-политики в Supabase.";
  }

  if (normalized.includes("invalid input syntax for type uuid")) {
    return "Ошибка связей: выбран некорректный родственник в одном из полей отец/мать/супруг.";
  }

  if (normalized.includes("fetch failed")) {
    return "Не удалось связаться с Supabase. Проверьте URL/ключи в .env.local и сеть.";
  }

  return `Ошибка Supabase: ${message}`;
}

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("UNAUTHORIZED");
  }

  return { supabase, userId: data.user.id };
}

function getFileExtension(file: File): string {
  const fromType = file.type.split("/")[1];
  if (fromType) {
    return fromType.replace(/[^a-zA-Z0-9]/g, "");
  }

  const nameSegments = file.name.split(".");
  const fromName = nameSegments[nameSegments.length - 1];
  return fromName ? fromName.replace(/[^a-zA-Z0-9]/g, "") : "bin";
}

export async function upsertPersonAction(
  _prevState: PersonActionState = defaultActionState,
  formData: FormData,
): Promise<PersonActionState> {
  let userId: string;
  const adminSupabase = createAdminClient();

  try {
    const auth = await requireAuthenticatedUser();
    userId = auth.userId;
  } catch (_error) {
    return {
      ok: false,
      message: "Нет доступа. Войдите как администратор через /admin/login и включите режим редактирования.",
    };
  }

  const parsed = personSchema.safeParse({
    id: getFormString(formData, "id"),
    first_name: getFormString(formData, "first_name"),
    last_name: getFormString(formData, "last_name"),
    middle_name: getFormString(formData, "middle_name"),
    birth_date: getFormString(formData, "birth_date"),
    birth_place: getFormString(formData, "birth_place"),
    role: getFormString(formData, "role"),
    bio: getFormString(formData, "bio"),
    note: getFormString(formData, "note"),
    father_id: getFormString(formData, "father_id"),
    mother_id: getFormString(formData, "mother_id"),
    spouse_id: getFormString(formData, "spouse_id"),
    current_avatar_url: getFormString(formData, "current_avatar_url"),
    link_target_id: getFormString(formData, "link_target_id"),
    link_relation: getFormString(formData, "link_relation"),
  });

  if (!parsed.success) {
    return { ok: false, message: "Ошибка валидации. Заполните обязательные поля формы." };
  }

  const values = parsed.data;
  const file = formData.get("avatar");
  let avatarUrl = values.current_avatar_url ?? "";

  if (file instanceof File && file.size > 0) {
    const extension = getFileExtension(file);
    const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await adminSupabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      return { ok: false, message: `Не удалось загрузить фото: ${mapDbError(uploadError.message)}` };
    }

    const {
      data: { publicUrl },
    } = adminSupabase.storage.from("avatars").getPublicUrl(filePath);

    avatarUrl = publicUrl;
  }

  const relationPayload = {
    father_id: values.father_id,
    mother_id: values.mother_id,
    spouse_id: values.spouse_id,
  };

  if (!values.id && values.link_target_id && values.link_relation) {
    if (values.link_relation === "father") {
      relationPayload.father_id = values.link_target_id;
    }
    if (values.link_relation === "mother") {
      relationPayload.mother_id = values.link_target_id;
    }
    if (values.link_relation === "spouse") {
      relationPayload.spouse_id = values.link_target_id;
    }
  }

  const payload: CreatePersonInput = {
    first_name: values.first_name,
    last_name: values.last_name,
    middle_name: values.middle_name || null,
    birth_date: values.birth_date,
    birth_place: values.birth_place || null,
    role: values.role,
    bio: values.bio || null,
    note: values.note || null,
    avatar_url: avatarUrl,
    ...relationPayload,
  };

  if (!values.id) {
    const insertedId = crypto.randomUUID();
    const { error } = await adminSupabase.from("person").insert({ ...payload, id: insertedId });
    if (error) {
      return { ok: false, message: `Не удалось добавить карточку. ${mapDbError(error.message)}` };
    }

    if (values.link_target_id && values.link_relation === "spouse") {
      const { error: spouseError } = await adminSupabase
        .from("person")
        .update({ spouse_id: insertedId } satisfies UpdatePersonInput)
        .eq("id", values.link_target_id)
        .is("spouse_id", null);

      if (spouseError) {
        return { ok: false, message: `Карточка создана, но связь не обновлена. ${mapDbError(spouseError.message)}` };
      }
    }
  } else {
    const { error } = await adminSupabase
      .from("person")
      .update(payload satisfies UpdatePersonInput)
      .eq("id", values.id);
    if (error) {
      return { ok: false, message: `Не удалось обновить карточку. ${mapDbError(error.message)}` };
    }
  }

  revalidatePath("/");
  return { ok: true, message: null };
}

export async function deletePersonAction(
  _prevState: PersonActionState = defaultActionState,
  formData: FormData,
): Promise<PersonActionState> {
  const adminSupabase = createAdminClient();

  try {
    await requireAuthenticatedUser();
  } catch (_error) {
    return {
      ok: false,
      message: "Нет доступа. Войдите как администратор через /admin/login и повторите.",
    };
  }

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, message: "Не указан идентификатор карточки." };
  }

  const { error } = await adminSupabase.from("person").delete().eq("id", id);
  if (error) {
    return { ok: false, message: `Не удалось удалить карточку. ${mapDbError(error.message)}` };
  }

  revalidatePath("/");
  return { ok: true, message: null };
}
