create extension if not exists "pgcrypto";

create table if not exists public.person (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  middle_name text null,
  birth_date date not null,
  birth_place text null,
  role text not null,
  bio text null,
  note text null,
  avatar_url text not null default '',
  father_id uuid null references public.person(id) on delete set null,
  mother_id uuid null references public.person(id) on delete set null,
  spouse_id uuid null references public.person(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint person_no_self_parent check (father_id is null or father_id <> id),
  constraint person_no_self_mother check (mother_id is null or mother_id <> id),
  constraint person_no_self_spouse check (spouse_id is null or spouse_id <> id)
);

create index if not exists idx_person_father_id on public.person(father_id);
create index if not exists idx_person_mother_id on public.person(mother_id);
create index if not exists idx_person_spouse_id on public.person(spouse_id);
create index if not exists idx_person_last_name on public.person(last_name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_person_updated_at on public.person;
create trigger trg_person_updated_at
before update on public.person
for each row
execute function public.set_updated_at();

alter table public.person enable row level security;

drop policy if exists "Public can read person" on public.person;
create policy "Public can read person"
on public.person
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated can insert person" on public.person;
create policy "Authenticated can insert person"
on public.person
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated can update person" on public.person;
create policy "Authenticated can update person"
on public.person
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can delete person" on public.person;
create policy "Authenticated can delete person"
on public.person
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public can read avatars" on storage.objects;
create policy "Public can read avatars"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'avatars');

drop policy if exists "Authenticated can upload avatars" on storage.objects;
create policy "Authenticated can upload avatars"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars');

drop policy if exists "Authenticated can update avatars" on storage.objects;
create policy "Authenticated can update avatars"
on storage.objects
for update
to authenticated
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

drop policy if exists "Authenticated can delete avatars" on storage.objects;
create policy "Authenticated can delete avatars"
on storage.objects
for delete
to authenticated
using (bucket_id = 'avatars');

