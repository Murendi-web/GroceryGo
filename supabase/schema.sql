-- GroceryGo database schema. Run in Supabase: SQL Editor > New query.
-- Safe to re-run.

-- ───────────── profiles ─────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  name            text not null default '',
  email           text not null default '',
  phone           text not null default '',
  preferred_store text not null default 'Checkers',
  language        text not null default 'en',
  notifications   boolean not null default true,
  is_pro          boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Guest'
    ),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── lists ─────────────
create table if not exists public.lists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null default 'My List',
  store      text not null default 'Checkers',
  budget     numeric(10, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.list_items (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.lists (id) on delete cascade,
  name       text not null,
  category   text not null default 'Other',
  price      numeric(10, 2) not null default 0 check (price >= 0),
  qty        integer not null default 1 check (qty >= 1),
  checked    boolean not null default false,
  is_custom  boolean not null default false,
  created_at timestamptz not null default now(),
  unique (list_id, name)
);

-- ───────────── favourites and history ─────────────
create table if not exists public.favourites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  item_name  text not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_name)
);

create table if not exists public.shopping_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  store      text not null,
  total      numeric(10, 2) not null default 0,
  item_count integer not null default 0,
  items      jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ───────────── AI usage (written by the Edge Function only) ─────────────
create table if not exists public.ai_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  tokens_used integer not null default 0,
  message     text,
  created_at  timestamptz not null default now()
);

-- ───────────── prices (written by the scraper only) ─────────────
create table if not exists public.prices (
  id         uuid primary key default gen_random_uuid(),
  item_name  text not null,
  store      text not null,
  price      numeric(10, 2) not null check (price > 0),
  scraped_at timestamptz not null default now(),
  is_valid   boolean not null default true,
  unique (item_name, store)
);

-- ───────────── indexes ─────────────
create index if not exists idx_lists_user          on public.lists (user_id);
create index if not exists idx_list_items_list     on public.list_items (list_id);
create index if not exists idx_favourites_user     on public.favourites (user_id);
create index if not exists idx_history_user_date   on public.shopping_history (user_id, created_at desc);
create index if not exists idx_ai_usage_user_date  on public.ai_usage (user_id, created_at desc);
create index if not exists idx_ai_usage_date       on public.ai_usage (created_at);

-- ───────────── updated_at ─────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_lists_updated_at on public.lists;
create trigger set_lists_updated_at before update on public.lists
  for each row execute function public.set_updated_at();

-- ───────────── row level security ─────────────
alter table public.profiles         enable row level security;
alter table public.lists            enable row level security;
alter table public.list_items       enable row level security;
alter table public.favourites       enable row level security;
alter table public.shopping_history enable row level security;
alter table public.ai_usage         enable row level security;
alter table public.prices           enable row level security;

drop policy if exists "own profile read"   on public.profiles;
drop policy if exists "own profile update" on public.profiles;
create policy "own profile read"   on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile update" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Users may edit these columns only. is_pro can never be self-granted.
revoke update on public.profiles from anon, authenticated;
grant  update (name, phone, preferred_store, language, notifications) on public.profiles to authenticated;

drop policy if exists "own lists" on public.lists;
create policy "own lists" on public.lists for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own list items" on public.list_items;
create policy "own list items" on public.list_items for all to authenticated
  using (exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())))
  with check (exists (select 1 from public.lists l where l.id = list_id and l.user_id = (select auth.uid())));

drop policy if exists "own favourites" on public.favourites;
create policy "own favourites" on public.favourites for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own history" on public.shopping_history;
create policy "own history" on public.shopping_history for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own ai usage read" on public.ai_usage;
create policy "own ai usage read" on public.ai_usage for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "prices public read" on public.prices;
create policy "prices public read" on public.prices for select to anon, authenticated using (true);
