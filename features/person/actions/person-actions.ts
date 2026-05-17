"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CreatePersonInput, UpdatePersonInput } from "@/entities/person/model/types";
import type { Database } from "@/lib/types/database";

export type PersonActionState = {
  ok: boolean;
  message: string | null;
};

const defaultActionState: PersonActionState = {
  ok: false,
  message: null,
};

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
type PersonRow = Database["public"]["Tables"]["person"]["Row"];

const nullableUuid = z.union([z.literal(""), z.string().uuid()]).transform((value) => (value === "" ? null : value));

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
  father_first_name: z.string().trim().optional(),
  father_last_name: z.string().trim().optional(),
  father_birth_date: z.string().trim().optional(),
  father_role: z.string().trim().optional(),
  mother_first_name: z.string().trim().optional(),
  mother_last_name: z.string().trim().optional(),
  mother_birth_date: z.string().trim().optional(),
  mother_role: z.string().trim().optional(),
  spouse_first_name: z.string().trim().optional(),
  spouse_last_name: z.string().trim().optional(),
  spouse_birth_date: z.string().trim().optional(),
  spouse_role: z.string().trim().optional(),
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
  if (normalized.includes("bucket not found")) {
    return "Storage bucket `avatars` не найден. Проверьте миграцию и создание bucket в Supabase.";
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

function getFileExtension(file: File): string {
  const fromType = file.type.split("/")[1];
  if (fromType) {
    return fromType.replace(/[^a-zA-Z0-9]/g, "");
  }
  const fromName = file.name.split(".").at(-1);
  return fromName ? fromName.replace(/[^a-zA-Z0-9]/g, "") : "bin";
}

function validateAvatarFile(file: File): string | null {
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return "Фото слишком большое. Максимальный размер: 5 MB.";
  }
  if (!ALLOWED_AVATAR_MIME_TYPES.has(file.type)) {
    return "Неподдерживаемый формат фото. Разрешены: JPG, PNG, WEBP, GIF.";
  }
  return null;
}

function buildParentsMap(persons: PersonRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  persons.forEach((person) => {
    map.set(person.id, [person.father_id, person.mother_id].filter(Boolean) as string[]);
  });
  return map;
}

function isAncestor(ancestorId: string, personId: string, parentsMap: Map<string, string[]>): boolean {
  const visited = new Set<string>();
  const stack = [...(parentsMap.get(personId) ?? [])];
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || visited.has(currentId)) {
      continue;
    }
    if (currentId === ancestorId) {
      return true;
    }
    visited.add(currentId);
    stack.push(...(parentsMap.get(currentId) ?? []));
  }
  return false;
}

function validateRelationshipConsistency(
  candidateId: string,
  payload: Pick<CreatePersonInput, "father_id" | "mother_id" | "spouse_id">,
  existingPersons: PersonRow[],
): string | null {
  if (payload.father_id && payload.mother_id && payload.father_id === payload.mother_id) {
    return "Один и тот же человек не может быть одновременно отцом и матерью.";
  }
  if (payload.spouse_id && (payload.spouse_id === payload.father_id || payload.spouse_id === payload.mother_id)) {
    return "Супруг(а) не может быть одновременно родителем этого человека.";
  }

  const persons = existingPersons.filter((person) => person.id !== candidateId);
  persons.push({
    id: candidateId,
    first_name: "",
    last_name: "",
    middle_name: null,
    birth_date: new Date().toISOString().slice(0, 10),
    birth_place: null,
    role: "",
    bio: null,
    note: null,
    avatar_url: "",
    father_id: payload.father_id ?? null,
    mother_id: payload.mother_id ?? null,
    spouse_id: payload.spouse_id ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const parentsMap = buildParentsMap(persons);
  if (payload.father_id && isAncestor(candidateId, payload.father_id, parentsMap)) {
    return "Нельзя указать отца: выбранный человек является потомком текущего человека.";
  }
  if (payload.mother_id && isAncestor(candidateId, payload.mother_id, parentsMap)) {
    return "Нельзя указать мать: выбранный человек является потомком текущего человека.";
  }
  if (payload.spouse_id) {
    const spouseIsAncestor = isAncestor(payload.spouse_id, candidateId, parentsMap);
    const spouseIsDescendant = isAncestor(candidateId, payload.spouse_id, parentsMap);
    if (spouseIsAncestor || spouseIsDescendant) {
      return "Супруг(а) не может быть предком или потомком (мать, отец, бабушка, дедушка, ребенок и т.д.).";
    }
  }
  return null;
}

type RelativeDraftInput = { first_name: string; last_name: string; birth_date: string; role: string };

function getRelativeDraft(values: z.infer<typeof personSchema>, relation: "father" | "mother" | "spouse"): RelativeDraftInput | null {
  const firstName = values[`${relation}_first_name`];
  const lastName = values[`${relation}_last_name`];
  const birthDate = values[`${relation}_birth_date`];
  const role = values[`${relation}_role`];

  if (!firstName && !lastName && !birthDate && !role) {
    return null;
  }
  if (!firstName || !lastName || !birthDate) {
    return null;
  }
  return {
    first_name: firstName,
    last_name: lastName,
    birth_date: birthDate,
    role: role || (relation === "spouse" ? "супруг(а)" : relation === "father" ? "отец" : "мать"),
  };
}

export async function upsertPersonAction(
  _prevState: PersonActionState = defaultActionState,
  formData: FormData,
): Promise<PersonActionState> {
  try {
    const userId = "open-admin";
    const adminSupabase = createAdminClient();

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
      father_first_name: getFormString(formData, "father_first_name"),
      father_last_name: getFormString(formData, "father_last_name"),
      father_birth_date: getFormString(formData, "father_birth_date"),
      father_role: getFormString(formData, "father_role"),
      mother_first_name: getFormString(formData, "mother_first_name"),
      mother_last_name: getFormString(formData, "mother_last_name"),
      mother_birth_date: getFormString(formData, "mother_birth_date"),
      mother_role: getFormString(formData, "mother_role"),
      spouse_first_name: getFormString(formData, "spouse_first_name"),
      spouse_last_name: getFormString(formData, "spouse_last_name"),
      spouse_birth_date: getFormString(formData, "spouse_birth_date"),
      spouse_role: getFormString(formData, "spouse_role"),
    });

    if (!parsed.success) {
      return { ok: false, message: "Ошибка валидации. Заполните обязательные поля формы." };
    }

    const values = parsed.data;
    const fatherDraft = getRelativeDraft(values, "father");
    const motherDraft = getRelativeDraft(values, "mother");
    const spouseDraft = getRelativeDraft(values, "spouse");

    const hasIncompleteDraft =
      (!fatherDraft && (values.father_first_name || values.father_last_name || values.father_birth_date || values.father_role)) ||
      (!motherDraft && (values.mother_first_name || values.mother_last_name || values.mother_birth_date || values.mother_role)) ||
      (!spouseDraft && (values.spouse_first_name || values.spouse_last_name || values.spouse_birth_date || values.spouse_role));
    if (hasIncompleteDraft) {
      return {
        ok: false,
        message: "Для быстрого добавления родственника заполните минимум: имя, фамилия и дату рождения.",
      };
    }

    const file = formData.get("avatar");
    let avatarUrl = values.current_avatar_url ?? "";
    if (file instanceof File && file.size > 0) {
      const avatarValidationError = validateAvatarFile(file);
      if (avatarValidationError) {
        return { ok: false, message: avatarValidationError };
      }

      const extension = getFileExtension(file);
      const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await adminSupabase.storage.from("avatars").upload(filePath, file, {
        upsert: false,
        cacheControl: "3600",
        contentType: file.type || undefined,
      });
      if (uploadError) {
        return { ok: false, message: `Не удалось загрузить фото. ${mapDbError(uploadError.message)}` };
      }

      const { data } = adminSupabase.storage.from("avatars").getPublicUrl(filePath);
      avatarUrl = data.publicUrl;
    }

    const relationPayload = {
      father_id: values.father_id,
      mother_id: values.mother_id,
      spouse_id: values.spouse_id,
    };

    if (!values.id && values.link_target_id && values.link_relation) {
      if (values.link_relation === "father") relationPayload.father_id = values.link_target_id;
      if (values.link_relation === "mother") relationPayload.mother_id = values.link_target_id;
      if (values.link_relation === "spouse") relationPayload.spouse_id = values.link_target_id;
    }

    async function createRelativeIfNeeded(
      currentId: string | null | undefined,
      draft: RelativeDraftInput | null,
    ): Promise<string | null | undefined> {
      if (values.id || currentId || !draft) return currentId;
      const newId = crypto.randomUUID();
      const { error } = await adminSupabase.from("person").insert({
        id: newId,
        first_name: draft.first_name,
        last_name: draft.last_name,
        middle_name: null,
        birth_date: draft.birth_date,
        birth_place: null,
        role: draft.role,
        bio: null,
        note: null,
        avatar_url: "",
        father_id: null,
        mother_id: null,
        spouse_id: null,
      });
      if (error) {
        throw new Error(mapDbError(error.message));
      }
      return newId;
    }

    relationPayload.father_id = await createRelativeIfNeeded(relationPayload.father_id, fatherDraft);
    relationPayload.mother_id = await createRelativeIfNeeded(relationPayload.mother_id, motherDraft);
    relationPayload.spouse_id = await createRelativeIfNeeded(relationPayload.spouse_id, spouseDraft);

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

    const candidateId = values.id || crypto.randomUUID();
    const { data: existingPersons, error: existingPersonsError } = await adminSupabase
      .from("person")
      .select(
        "id, first_name, last_name, middle_name, birth_date, birth_place, role, bio, note, avatar_url, father_id, mother_id, spouse_id, created_at, updated_at",
      );
    if (existingPersonsError) {
      return { ok: false, message: `Не удалось проверить связи. ${mapDbError(existingPersonsError.message)}` };
    }

    const relationError = validateRelationshipConsistency(candidateId, relationPayload, existingPersons ?? []);
    if (relationError) {
      return { ok: false, message: relationError };
    }

    if (!values.id) {
      const insertedId = candidateId;
      const { error } = await adminSupabase.from("person").insert({ ...payload, id: insertedId });
      if (error) {
        return { ok: false, message: `Не удалось добавить карточку. ${mapDbError(error.message)}` };
      }

      if (values.link_target_id && values.link_relation === "spouse") {
        await adminSupabase
          .from("person")
          .update({ spouse_id: insertedId } satisfies UpdatePersonInput)
          .eq("id", values.link_target_id)
          .is("spouse_id", null);
      }

      if (relationPayload.spouse_id) {
        await adminSupabase
          .from("person")
          .update({ spouse_id: insertedId } satisfies UpdatePersonInput)
          .eq("id", relationPayload.spouse_id);
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
    return { ok: true, message: "Изменения сохранены." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    return { ok: false, message: `Не удалось сохранить карточку. ${message}` };
  }
}

export async function deletePersonAction(
  _prevState: PersonActionState = defaultActionState,
  formData: FormData,
): Promise<PersonActionState> {
  try {
    const adminSupabase = createAdminClient();
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Неизвестная ошибка";
    return { ok: false, message: `Не удалось удалить карточку. ${message}` };
  }
}
