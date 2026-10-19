create extension if not exists pgcrypto;
create table if not exists public.applications (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(),
 epic_username text not null, discord_username text not null,
 current_rank text not null, peak_rank text not null,
 age integer not null check (age between 13 and 100),
 region text not null, platform text not null,
 hours_played integer not null check (hours_played between 0 and 100000),
 motivation text not null, tournament_experience text not null,
 practice_availability text not null,
 status text not null default 'pending' check (status in ('pending','accepted','rejected'))
);
create table if not exists public.staff (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null default 'staff' check (role in ('owner','staff'))
);
alter table public.applications enable row level security;
alter table public.staff enable row level security;
-- No public table policies: only the trusted server's service role accesses these tables.
-- Add staff manually after inviting their auth user account:
-- insert into public.staff(user_id,role) values ('AUTH_USER_UUID','owner');
