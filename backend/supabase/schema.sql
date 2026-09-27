-- Questra — quota table.
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → Run).

create table if not exists public.query_usage (
  id          uuid primary key default gen_random_uuid(),
  subject     text not null,          -- 'user:<uuid>' | 'anon:<id>' | 'ip:<addr>'
  created_at  timestamptz not null default now()
);

create index if not exists query_usage_subject_idx
  on public.query_usage (subject, created_at desc);

-- Locked down: only the backend (service role) reads/writes this table.
alter table public.query_usage enable row level security;
