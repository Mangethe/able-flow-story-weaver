alter table public.story_progress add column story_version integer not null default 1 check (story_version > 0);
alter table public.story_progress add column revision bigint not null default 1 check (revision > 0);
alter table public.story_progress add column last_mutation_id uuid;
alter table public.story_progress drop constraint story_progress_profile_story_unique;
alter table public.story_progress add constraint story_progress_profile_story_version_unique unique(profile_id,story_id,story_version);
-- Old clients may still read/delete their own rows, but cannot bypass revision checks.
revoke insert, update on public.story_progress from authenticated;
create function public.save_story_progress(
 p_story_id text, p_story_version integer, p_current_node_id text,
 p_choices_made jsonb, p_expected_revision bigint, p_mutation_id uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); saved public.story_progress%rowtype;
begin
 if owner_id is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_expected_revision is null or p_expected_revision < 0 or p_mutation_id is null then
   raise exception 'Invalid save revision or mutation ID' using errcode='22023';
 end if;
 if p_expected_revision = 0 then
   insert into public.story_progress(profile_id,story_id,story_version,current_node_id,choices_made,last_mutation_id)
   values(owner_id,p_story_id,p_story_version,p_current_node_id,p_choices_made,p_mutation_id)
   on conflict(profile_id,story_id,story_version) do nothing;
 end if;
 select * into saved from public.story_progress
 where profile_id=owner_id and story_id=p_story_id and story_version=p_story_version for update;
 if not found then return jsonb_build_object('status','conflict','progress',null); end if;
 if saved.last_mutation_id=p_mutation_id then
   return jsonb_build_object('status','saved','progress',to_jsonb(saved));
 end if;
 if saved.revision<>p_expected_revision then
   return jsonb_build_object('status','conflict','progress',to_jsonb(saved));
 end if;
 update public.story_progress set current_node_id=p_current_node_id,choices_made=p_choices_made,
 revision=revision+1,last_mutation_id=p_mutation_id where id=saved.id returning * into saved;
 return jsonb_build_object('status','saved','progress',to_jsonb(saved));
end;
$$;
revoke all on function public.save_story_progress(text,integer,text,jsonb,bigint,uuid) from public,anon;
grant execute on function public.save_story_progress(text,integer,text,jsonb,bigint,uuid) to authenticated;
comment on function public.save_story_progress(text,integer,text,jsonb,bigint,uuid) is 'Owner-only atomic compare-and-swap; expected revision 0 creates; repeated last mutation ID is idempotent.';
