# MVP Spec (Phase 1)

## Цель

Публичный просмотр семейного древа + админ-редактирование после авторизации.

## Жесткие ограничения

- Только сущность `person` и базовые связи (`father_id`, `mother_id`, `spouse_id`)
- Без ролей, поиска, комментариев, уведомлений, мультиязычности
- Стек: Next.js App Router, TypeScript, Tailwind, shadcn/ui, Supabase, React Flow

## Этапы реализации

1. Структура проекта
2. Supabase schema + types
3. Подключение Supabase
4. Базовая страница
5. Рендер древа
6. Карточка
7. Modal/Sidebar
8. Hidden auth
9. Admin mode
10. CRUD Person
11. Upload avatar
12. Интеграция

