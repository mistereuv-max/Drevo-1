import { getPersons } from "@/entities/person/api/get-persons";
import { FamilyTreeCanvas } from "@/features/tree/ui/family-tree-canvas";

export default async function HomePage() {
  const persons = await getPersons();
  const isAdmin = true;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1700px] px-5 py-5">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px,1fr]">
        <aside className="rounded-3xl border border-[#e3dacb] bg-[#f8f2e7] p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#b07a2e]">
            Интерактивный проект
          </p>
          <h1 className="mt-2 text-5xl leading-[0.95] text-[#1f1e1a]">Семейное древо</h1>
          <p className="mt-4 text-[22px] leading-none text-[#1f1e1a]">веб-платформа</p>
          <p className="mt-4 text-sm leading-relaxed text-[#615b53]">
            Добавляйте родственников, храните историю семьи и стройте связи между поколениями в удобном визуальном
            формате.
          </p>

          <div className="mt-6 rounded-2xl border border-[#eadfce] bg-[#fffaf1] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b07a2e]">Статус</p>
            <p className="mt-2 text-sm font-medium text-[#1f1e1a]">
              {isAdmin ? "Вход администратора выполнен" : "Публичный режим просмотра"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#756e63]">
              {isAdmin
                ? "Можно добавлять и редактировать карточки прямо на холсте."
                : "Для редактирования откройте /admin/login и авторизуйтесь."}
            </p>
          </div>

          {persons.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-[#eadfce] bg-white p-4">
              <p className="text-xs leading-relaxed text-[#756e63]">
                Пока нет карточек. Создайте первую запись через кнопку «Новая карточка» в панели холста.
              </p>
            </div>
          ) : null}
        </aside>

        <FamilyTreeCanvas persons={persons} isAdmin={isAdmin} />
      </div>
    </main>
  );
}
