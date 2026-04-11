# Family Tree Platform

MVP веб-приложение "Генеалогическое древо семьи" на Next.js + Supabase.

## Архитектура

- `app` - роутинг и композиция страниц (App Router)
- `features` - фичи UI/бизнес-логики (tree, auth, person-form и т.д.)
- `entities` - доменные сущности (`person`)
- `shared` - общие утилиты/конфиги
- `lib` - интеграции (Supabase, типы, инфраструктура)
- `components` - переиспользуемые UI-компоненты
- `supabase/migrations` - schema-first SQL миграции

## Быстрый старт

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase

1. Применить SQL из `supabase/migrations/0001_init.sql`.
2. Сгенерировать типы:

```bash
npm run supabase:types
```

3. Проверить, что bucket `avatars` создан и политики активны.

