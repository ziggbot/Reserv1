-- FitBlueprint cloud sync: one row per signed-in user holding the profile's
-- whole app state as JSON. Run this once in the Supabase SQL editor.

create table if not exists public.app_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Each user reads and writes only their own row.
create policy "own row: select" on public.app_state
  for select using (auth.uid() = user_id);
create policy "own row: insert" on public.app_state
  for insert with check (auth.uid() = user_id);
create policy "own row: update" on public.app_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own row: delete" on public.app_state
  for delete using (auth.uid() = user_id);
