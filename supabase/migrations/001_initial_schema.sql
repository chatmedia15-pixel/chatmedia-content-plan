-- ============================================================
-- 001 INITIAL SCHEMA — Content Plan Chatmedia
-- ============================================================

-- Enable extension
create extension if not exists "pgcrypto";

-- ── Enum ───────────────────────────────────────────────
do $$ begin
  create type workflow_stage as enum ('planning','calendar','published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type platform_type as enum ('Instagram','TikTok');
exception when duplicate_object then null; end $$;

-- ── profiles (audit) ───────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger auto-create profile saat user baru
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ── brands ─────────────────────────────────────────────
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text,
  color text default '#2F5CFF',
  pillars jsonb not null default '[]'::jsonb,
  ideas jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── content_items (satu tabel, workflow_stage) ─────────
create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  title text not null,
  hook text,
  concept text,
  caption text,
  cta text,
  visual_notes text,
  audience text,
  hashtags jsonb not null default '[]'::jsonb,
  content_pillar text,
  platform platform_type not null,
  format text,
  objective text,
  style text,
  production_status text not null default 'Ide',
  workflow_stage workflow_stage not null default 'planning',
  planned_date date,
  published_at timestamptz,
  link_ref text,             -- link referensi (dari source lama)
  published_url text,        -- link live setelah publish
  duration_seconds integer,
  reason text,
  notes text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists idx_content_brand_date
  on content_items(brand_id, planned_date);
create index if not exists idx_content_stage_status
  on content_items(workflow_stage, production_status);
create index if not exists idx_content_platform_date
  on content_items(platform, planned_date);

-- ── content_ideas ──────────────────────────────────────
create table if not exists content_ideas (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  title text not null,
  hook text,
  concept text,
  caption text,
  cta text,
  audience text,
  content_pillar text,
  platform text,
  format text,
  objective text,
  style text,
  visual_notes text,
  flow jsonb default '[]'::jsonb,
  hashtags jsonb default '[]'::jsonb,
  duration_seconds integer,
  source text default 'manual',   -- manual | template | AI
  reason text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ideas_brand_created
  on content_ideas(brand_id, created_at desc);

-- ── social_account_snapshots ───────────────────────────
create table if not exists social_account_snapshots (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  platform text not null default 'Instagram',
  username text,
  profile_url text,
  avatar_url text,
  is_verified boolean,
  followers bigint,
  posts_count bigint,
  total_likes bigint,
  total_views bigint,
  avg_likes numeric,
  avg_views numeric,
  recent_posts jsonb default '[]'::jsonb,
  source text default 'CreatorCrawl',
  sync_status text default 'success',
  sync_message text,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_snapshot_brand_time
  on social_account_snapshots(brand_id, synced_at desc);

-- ── integration_sync_logs ──────────────────────────────
create table if not exists integration_sync_logs (
  id uuid primary key default gen_random_uuid(),
  integration_key text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_processed integer default 0,
  message text,
  metadata jsonb
);

-- ── ai_generations (audit) ─────────────────────────────
create table if not exists ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  feature text not null,           -- content_ideas | caption | insight | ...
  brand_id uuid references brands(id) on delete set null,
  input_summary jsonb,
  output_text text,
  status text default 'success',
  error_message text,
  model_name text,
  created_at timestamptz not null default now()
);

-- ── updated_at trigger ─────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated
before update on profiles
for each row execute function set_updated_at();

drop trigger if exists trg_brands_updated on brands;
create trigger trg_brands_updated
before update on brands
for each row execute function set_updated_at();

drop trigger if exists trg_content_updated on content_items;
create trigger trg_content_updated
before update on content_items
for each row execute function set_updated_at();