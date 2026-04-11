"use client";

import { Button } from "@/components/ui/button";
import type { Person } from "@/entities/person/model/types";

type PersonSidebarProps = {
  person: Person | null;
  onClose: () => void;
  canEdit?: boolean;
  onEdit?: (person: Person) => void;
};

function initials(person: Person): string {
  return `${person.last_name[0] ?? ""}${person.first_name[0] ?? ""}`.toUpperCase();
}

export function PersonSidebar({ person, onClose, canEdit = false, onEdit }: PersonSidebarProps) {
  if (!person) {
    return null;
  }

  const fullName = [person.last_name, person.first_name, person.middle_name].filter(Boolean).join(" ");

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#29231b]/35 p-4 backdrop-blur-[2px]">
      <section className="w-full max-w-3xl rounded-[28px] border border-[#eadfce] bg-white shadow-2xl">
        <div className="flex max-h-[90vh] flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-[#ece4d8] bg-white p-6 pb-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b07a2e]">Карточка родственника</p>
            <h2 className="mt-1 text-4xl leading-none text-[#1f1e1a]">{fullName}</h2>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            ×
          </Button>
          </header>

          <div className="overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px,1fr]">
              <div className="flex h-40 items-center justify-center rounded-2xl border border-[#eadfce] bg-[#f9efde] text-6xl font-semibold text-[#c0853a]">
                {initials(person)}
              </div>
              <div className="space-y-3">
                <div className="border-b border-[#eee6da] pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b07a2e]">Полное имя</p>
                  <p className="mt-1 text-xl font-medium text-[#1f1e1a]">{fullName}</p>
                </div>
                <div className="border-b border-[#eee6da] pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b07a2e]">Дата рождения</p>
                  <p className="mt-1 text-lg text-[#1f1e1a]">{person.birth_date}</p>
                </div>
                <div className="border-b border-[#eee6da] pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b07a2e]">Роль</p>
                  <p className="mt-1 text-lg text-[#1f1e1a]">{person.role}</p>
                </div>
                <div className="border-b border-[#eee6da] pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b07a2e]">Место рождения</p>
                  <p className="mt-1 text-sm text-[#1f1e1a]">{person.birth_place || "—"}</p>
                </div>
                <div className="border-b border-[#eee6da] pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b07a2e]">Биография</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5c554a]">{person.bio || "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b07a2e]">Заметка</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#5c554a]">{person.note || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          <footer className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-[#ece4d8] bg-white p-6 pt-4">
            {canEdit && onEdit ? (
              <Button type="button" variant="outline" onClick={() => onEdit(person)}>
                Редактировать
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              Закрыть
            </Button>
          </footer>
        </div>
      </section>
    </div>
  );
}
