"use client";

import { useActionState, useCallback, useEffect } from "react";
import type { MouseEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Person } from "@/entities/person/model/types";
import { prepareAvatarForUpload } from "@/shared/lib/image/avatar-upload";
import {
  deletePersonAction,
  upsertPersonAction,
  type PersonActionState,
} from "@/features/person/actions/person-actions";

type EditorMode = "create" | "edit";
type LinkRelation = "father" | "mother" | "spouse";

type PersonEditorSheetProps = {
  mode: EditorMode;
  persons: Person[];
  person: Person | null;
  linkTargetId?: string | null;
  linkRelation?: LinkRelation | null;
  onClose: () => void;
};

const initialActionState: PersonActionState = {
  ok: false,
  message: null,
};

function optionLabel(person: Person): string {
  return [person.last_name, person.first_name, person.middle_name].filter(Boolean).join(" ");
}

export function PersonEditorSheet({
  mode,
  persons,
  person,
  linkTargetId,
  linkRelation,
  onClose,
}: PersonEditorSheetProps) {
  const [saveState, saveFormAction] = useActionState(upsertPersonAction, initialActionState);
  const [deleteState, deleteFormAction] = useActionState(deletePersonAction, initialActionState);
  const title = mode === "create" ? "Добавить человека" : "Редактировать человека";
  const filtered = persons.filter((candidate) => candidate.id !== person?.id);

  const closeFromUi = useCallback(() => {
    onClose();
    if (window.history.state?.__overlay === "person-editor-sheet") {
      window.history.back();
    }
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeFromUi();
      }
    };

    const handlePopState = () => {
      onClose();
    };

    window.history.pushState({ ...(window.history.state ?? {}), __overlay: "person-editor-sheet" }, "");
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [closeFromUi, onClose]);

  useEffect(() => {
    if (saveState.ok || deleteState.ok) {
      closeFromUi();
    }
  }, [closeFromUi, deleteState.ok, saveState.ok]);

  async function handleSaveAction(formData: FormData) {
    const avatar = formData.get("avatar");
    if (avatar instanceof File && avatar.size > 0) {
      try {
        const prepared = await prepareAvatarForUpload(avatar);
        if (prepared !== avatar) {
          formData.set("avatar", prepared);
        }
      } catch {
        // Если не удалось подготовить изображение, отправляем оригинал.
      }
    }
    saveFormAction(formData);
  }

  function handleDeleteClick(event: MouseEvent<HTMLButtonElement>) {
    const confirmed = window.confirm("Удалить карточку родственника? Это действие нельзя отменить.");
    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#29231b]/35 p-4 backdrop-blur-[2px]">
      <form
        action={handleSaveAction}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[#eadfce] bg-white p-6 shadow-2xl"
        key={`${mode}-${person?.id ?? "new"}-${linkTargetId ?? ""}`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#ece4d8] pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b07a2e]">Редактирование</p>
            <h2 className="mt-1 text-2xl leading-tight text-[#1f1e1a] md:text-4xl md:leading-none">{title}</h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={closeFromUi}>
            ×
          </Button>
        </header>

        {saveState.message ? (
          <p className={`mt-4 rounded-lg px-3 py-2 text-xs ${saveState.ok ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-amber-200 bg-amber-50 text-amber-800"}`}>
            {saveState.message}
          </p>
        ) : null}
        {deleteState.message ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {deleteState.message}
          </p>
        ) : null}

        <input name="id" type="hidden" defaultValue={person?.id ?? ""} />
        <input name="current_avatar_url" type="hidden" defaultValue={person?.avatar_url ?? ""} />
        <input name="link_target_id" type="hidden" defaultValue={linkTargetId ?? ""} />

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Имя</Label>
            <Input name="first_name" required defaultValue={person?.first_name ?? ""} />
          </label>
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Фамилия</Label>
            <Input name="last_name" required defaultValue={person?.last_name ?? ""} />
          </label>
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Отчество</Label>
            <Input name="middle_name" defaultValue={person?.middle_name ?? ""} />
          </label>
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Дата рождения</Label>
            <Input name="birth_date" type="date" required defaultValue={person?.birth_date ?? ""} />
          </label>
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Роль в семье</Label>
            <Input name="role" required defaultValue={person?.role ?? "родственник"} />
          </label>
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Фото</Label>
            <Input name="avatar" type="file" accept="image/*" />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3">
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Место рождения</Label>
            <Input name="birth_place" defaultValue={person?.birth_place ?? ""} />
          </label>
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Биография</Label>
            <Textarea name="bio" rows={3} defaultValue={person?.bio ?? ""} />
          </label>
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Краткая заметка</Label>
            <Textarea name="note" rows={3} defaultValue={person?.note ?? ""} />
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Отец</Label>
            <Select name="father_id" defaultValue={person?.father_id ?? ""}>
              <option value="">-</option>
              {filtered.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {optionLabel(candidate)}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Мать</Label>
            <Select name="mother_id" defaultValue={person?.mother_id ?? ""}>
              <option value="">-</option>
              {filtered.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {optionLabel(candidate)}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Супруг(а)</Label>
            <Select name="spouse_id" defaultValue={person?.spouse_id ?? ""}>
              <option value="">-</option>
              {filtered.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {optionLabel(candidate)}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {mode === "create" ? (
          <section className="mt-4 rounded-2xl border border-[#ece4d8] bg-[#fffcf7] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7b67]">Быстрое добавление родственников</p>
            <p className="mt-1 text-xs text-[#6f6558]">
              Заполните имя, фамилию и дату рождения для нужных карточек. Они создадутся автоматически и сразу свяжутся.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-[#eee4d5] bg-white p-3 md:grid-cols-4">
                <Label className="md:col-span-4 text-[11px] uppercase tracking-[0.14em] text-[#8b7b67]">Отец</Label>
                <Input name="father_first_name" placeholder="Имя" />
                <Input name="father_last_name" placeholder="Фамилия" />
                <Input name="father_birth_date" type="date" />
                <Input name="father_role" placeholder="Роль (по умолчанию: отец)" />
              </div>
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-[#eee4d5] bg-white p-3 md:grid-cols-4">
                <Label className="md:col-span-4 text-[11px] uppercase tracking-[0.14em] text-[#8b7b67]">Мать</Label>
                <Input name="mother_first_name" placeholder="Имя" />
                <Input name="mother_last_name" placeholder="Фамилия" />
                <Input name="mother_birth_date" type="date" />
                <Input name="mother_role" placeholder="Роль (по умолчанию: мать)" />
              </div>
              <div className="grid grid-cols-1 gap-2 rounded-xl border border-[#eee4d5] bg-white p-3 md:grid-cols-4">
                <Label className="md:col-span-4 text-[11px] uppercase tracking-[0.14em] text-[#8b7b67]">Супруг(а)</Label>
                <Input name="spouse_first_name" placeholder="Имя" />
                <Input name="spouse_last_name" placeholder="Фамилия" />
                <Input name="spouse_birth_date" type="date" />
                <Input name="spouse_role" placeholder="Роль (по умолчанию: супруг(а))" />
              </div>
            </div>
          </section>
        ) : null}

        {mode === "create" && linkTargetId ? (
          <label className="mt-3 block text-xs">
            <Label className="mb-1 block uppercase tracking-[0.14em] text-[#8b7b67]">Тип быстрой связи</Label>
            <Select name="link_relation" defaultValue={linkRelation ?? "spouse"}>
              <option value="spouse">Супруг(а)</option>
              <option value="father">Отец</option>
              <option value="mother">Мать</option>
            </Select>
          </label>
        ) : (
          <input name="link_relation" type="hidden" value="" readOnly />
        )}

        <footer className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-[#ece4d8] pt-4">
          {mode === "edit" && person ? (
            <Button type="submit" formAction={deleteFormAction} formNoValidate variant="destructive" onClick={handleDeleteClick}>
              Удалить
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={closeFromUi}>
            Отмена
          </Button>
          <Button type="submit">Сохранить</Button>
        </footer>
      </form>
    </div>
  );
}
