-- =============================================================================
-- SEBI Kavach — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE
--    Extends auth.users with role + telegram linking fields
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                              uuid references auth.users(id) on delete cascade primary key,
  email                           text,
  role                            text not null default 'investor' check (role in ('investor', 'admin')),
  telegram_chat_id                text unique,
  telegram_username               text,
  telegram_link_code              text,
  telegram_link_code_expires_at   timestamptz,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

-- Auto-update updated_at on row changes
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. AUTO-CREATE PROFILE ON SIGNUP
--    Triggered whenever a new user signs up via Supabase Auth
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. SCAN HISTORY TABLE
--    Stores every AI scan result for linked users
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.scan_history (
  id               bigint generated always as identity primary key,
  user_id          uuid references public.profiles(id) on delete cascade not null,
  scan_type        text not null check (scan_type in ('text', 'image', 'audio', 'video')),
  risk_level       text not null check (risk_level in ('low', 'medium', 'high', 'unknown')),
  confidence_score numeric(4,2),
  trust_category   text,
  is_synthetic     boolean default false,
  input_summary    text,
  explanation      text,
  created_at       timestamptz not null default now()
);

create index if not exists scan_history_user_id_idx on public.scan_history (user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.scan_history enable row level security;

-- profiles: users can read/update their own row
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- admins can read all profiles
create policy "profiles_select_admin"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- scan_history: users see only their own scans
create policy "scan_history_select_own"
  on public.scan_history for select
  using (
    user_id = (select id from public.profiles where id = auth.uid())
  );

-- scan_history: service role (backend) can insert on behalf of any user
-- (service_role key bypasses RLS — no extra policy needed)

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. HOW TO PROMOTE A USER TO ADMIN
--    Run in SQL Editor after the user has signed up:
-- ─────────────────────────────────────────────────────────────────────────────
-- update public.profiles set role = 'admin' where email = 'admin@sebi.gov.in';

-- =============================================================================
-- DONE. Your Supabase schema is ready.
-- =============================================================================
