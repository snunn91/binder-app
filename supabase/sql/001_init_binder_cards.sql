-- Binder + card catalog schema for Supabase migration.
-- Run this in Supabase SQL editor before app testing.

create extension if not exists pgcrypto;

create table if not exists public.expansions (
  id text primary key,
  name text not null,
  series text,
  total integer,
  printed_total integer,
  language text,
  language_code text,
  release_date date,
  is_online_only boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cards (
  id text primary key,
  name text not null,
  number text,
  rarity text,
  supertype text,
  subtypes text[] not null default '{}',
  types text[] not null default '{}',
  rules text[] not null default '{}',
  image_small text,
  image_large text,
  expansion_id text references public.expansions(id) on delete set null,
  expansion_name text,
  expansion_release_date date,
  expansion_sort_order integer,
  language text,
  language_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cards_name on public.cards (name);
create index if not exists idx_cards_expansion_id on public.cards (expansion_id);
create index if not exists idx_cards_rarity on public.cards (rarity);
create index if not exists idx_cards_release_order on public.cards (expansion_release_date desc, expansion_sort_order desc);
create index if not exists idx_cards_types_gin on public.cards using gin (types);

create table if not exists public.binders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  layout text not null check (layout in ('2x2', '3x3', '4x4')),
  color_scheme text not null default 'default',
  goals jsonb not null default '[]'::jsonb,
  goal_cooldowns text[] not null default '{}',
  show_goals boolean not null default true,
  goals_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_binders_user_created on public.binders (user_id, created_at desc);

create table if not exists public.binder_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  binder_id uuid not null references public.binders(id) on delete cascade,
  page_index integer not null,
  slots integer not null,
  card_order jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (binder_id, page_index)
);

create index if not exists idx_binder_pages_lookup on public.binder_pages (user_id, binder_id, page_index asc);

alter table public.cards enable row level security;
alter table public.expansions enable row level security;
alter table public.binders enable row level security;
alter table public.binder_pages enable row level security;

-- Public read is okay for card catalog data.
drop policy if exists "cards public read" on public.cards;
create policy "cards public read"
on public.cards
for select
using (true);

drop policy if exists "expansions public read" on public.expansions;
create policy "expansions public read"
on public.expansions
for select
using (true);

-- Users can only access their own binder data.
drop policy if exists "binders own rows" on public.binders;
create policy "binders own rows"
on public.binders
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "binder pages own rows" on public.binder_pages;
create policy "binder pages own rows"
on public.binder_pages
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
