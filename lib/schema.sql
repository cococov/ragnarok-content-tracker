create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null unique,
  discord_username text not null,
  discord_avatar text,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists user_sessions_expires_at_idx
  on user_sessions (expires_at);

create table if not exists user_tracker_states (
  user_id uuid primary key references app_users(id) on delete cascade,
  state_json jsonb not null,
  updated_at timestamptz not null default now()
);
