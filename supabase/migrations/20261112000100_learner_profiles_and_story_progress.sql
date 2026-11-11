-- One learner profile per Supabase Auth identity, including anonymous users.
create table public.learner_profiles (
  id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 100),
  processing_speed integer not null default 2000 check (processing_speed between 100 and 60000),
  contrast_need boolean not null default false,
  communication_modality text not null default 'text'
    check (communication_modality in ('text', 'aac', 'ssl', 'combined')),
  created_at timestamptz not null default now()
);
comment on column public.learner_profiles.processing_speed is 'Scan interval in milliseconds.';
comment on column public.learner_profiles.id is 'Owner: Supabase Auth user ID, including anonymous sign-ins.';

create table public.story_progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null default auth.uid() references public.learner_profiles(id) on delete cascade,
  story_id text not null check (char_length(btrim(story_id)) between 1 and 200),
  current_node_id text not null check (char_length(btrim(current_node_id)) between 1 and 200),
  choices_made jsonb not null default '[]'::jsonb check (jsonb_typeof(choices_made) = 'array'),
  updated_at timestamptz not null default now(),
  constraint story_progress_profile_story_unique unique (profile_id, story_id)
);
comment on column public.story_progress.choices_made is 'Ordered choice history as a JSON array; for example [{"node_id":"garden","choice_id":"water","target_node_id":"pond"}].';

create function public.set_story_progress_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;
create trigger story_progress_updated_at
before insert or update on public.story_progress
for each row execute function public.set_story_progress_updated_at();

alter table public.learner_profiles enable row level security;
alter table public.story_progress enable row level security;

revoke all on table public.learner_profiles, public.story_progress from public, anon, authenticated;
grant select, insert, update, delete on table public.learner_profiles, public.story_progress to authenticated;

create policy learner_profiles_select_own on public.learner_profiles
for select to authenticated using ((select auth.uid()) = id);
create policy learner_profiles_insert_own on public.learner_profiles
for insert to authenticated with check ((select auth.uid()) = id);
create policy learner_profiles_update_own on public.learner_profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy learner_profiles_delete_own on public.learner_profiles
for delete to authenticated using ((select auth.uid()) = id);

create policy story_progress_select_own on public.story_progress
for select to authenticated using ((select auth.uid()) = profile_id);
create policy story_progress_insert_own on public.story_progress
for insert to authenticated with check ((select auth.uid()) = profile_id);
create policy story_progress_update_own on public.story_progress
for update to authenticated using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);
create policy story_progress_delete_own on public.story_progress
for delete to authenticated using ((select auth.uid()) = profile_id);
