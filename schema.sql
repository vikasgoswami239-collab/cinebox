-- CineBox schema: run in Supabase Dashboard > SQL Editor.
-- Keep the Supabase service_role key private. Never put it in the browser app.

create extension if not exists pgcrypto;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')) default 'editor',
  created_at timestamptz not null default now()
);

create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  type text not null check (type in ('movie', 'series')),
  year integer check (year is null or year between 1888 and 2100),
  genre text not null default 'General',
  description text not null default '',
  youtube_url text not null,
  poster_url text not null default '',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;
alter table public.titles enable row level security;

-- Public visitors can only read published titles.
drop policy if exists "Anyone can read published titles" on public.titles;
create policy "Anyone can read published titles"
  on public.titles for select
  using (published = true or exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  ));

-- Only admins can create/update/delete titles.
drop policy if exists "Admins can insert titles" on public.titles;
create policy "Admins can insert titles"
  on public.titles for insert to authenticated
  with check (exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  ));

drop policy if exists "Admins can update titles" on public.titles;
create policy "Admins can update titles"
  on public.titles for update to authenticated
  using (exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  ))
  with check (exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  ));

drop policy if exists "Admins can delete titles" on public.titles;
create policy "Admins can delete titles"
  on public.titles for delete to authenticated
  using (exists (
    select 1 from public.user_roles r
    where r.user_id = auth.uid() and r.role = 'admin'
  ));

-- A user can read only their own role row. This app checks the role after login.
drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid());

-- Intentionally no client insert/update/delete policy for user_roles.
-- Assign an admin manually from the SQL Editor after creating the user:
-- insert into public.user_roles (user_id, role)
-- values ('AUTH_USER_UUID_HERE', 'admin')
-- on conflict (user_id) do update set role = 'admin';

create index if not exists titles_published_created_at_idx
  on public.titles (published, created_at desc);
create index if not exists titles_type_idx on public.titles (type);
