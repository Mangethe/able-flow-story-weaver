-- Run through the Supabase SQL editor/MCP as postgres. All fixtures roll back.
begin;
select set_config('able_flow_test.a', gen_random_uuid()::text, true);
select set_config('able_flow_test.b', gen_random_uuid()::text, true);
insert into auth.users (id, aud, role, is_anonymous, created_at, updated_at)
values
(current_setting('able_flow_test.a')::uuid, 'authenticated', 'authenticated', true, now(), now()),
(current_setting('able_flow_test.b')::uuid, 'authenticated', 'authenticated', true, now(), now());

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub',current_setting('able_flow_test.a'),'role','authenticated','is_anonymous',true)::text, true);
insert into public.learner_profiles (display_name) values ('QA learner A');
insert into public.story_progress (story_id, current_node_id, choices_made)
values ('quiet-garden', 'garden', '[]');

select set_config('request.jwt.claims', json_build_object('sub',current_setting('able_flow_test.b'),'role','authenticated','is_anonymous',true)::text, true);
insert into public.learner_profiles (display_name, communication_modality) values ('QA learner B', 'aac');
insert into public.story_progress (story_id, current_node_id) values ('quiet-garden', 'garden');

do $$
begin
  if (select count(*) from public.learner_profiles) <> 1 or (select count(*) from public.story_progress) <> 1
  then raise exception 'B can see another learner'; end if;
end;
$$;

select set_config('request.jwt.claims', json_build_object('sub',current_setting('able_flow_test.a'),'role','authenticated','is_anonymous',true)::text, true);
do $$
declare affected integer;
begin
  if current_user <> 'authenticated' then raise exception 'Test bypassed RLS'; end if;
  if (select count(*) from public.learner_profiles) <> 1 or (select count(*) from public.story_progress) <> 1
  then raise exception 'A can see another learner'; end if;

  update public.learner_profiles set processing_speed=3000 where id=auth.uid();
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Own profile update failed'; end if;

  insert into public.story_progress (story_id,current_node_id,choices_made)
  values ('quiet-garden','pond','[{"node_id":"garden","choice_id":"water","target_node_id":"pond"}]')
  on conflict (profile_id,story_id) do update
  set current_node_id=excluded.current_node_id,choices_made=excluded.choices_made;
  if (select current_node_id from public.story_progress) <> 'pond' then raise exception 'Own upsert failed'; end if;

  update public.story_progress set updated_at='2000-01-01' where profile_id=auth.uid();
  if (select updated_at from public.story_progress) < '2025-01-01' then raise exception 'Timestamp trigger failed'; end if;

  update public.story_progress set current_node_id='forbidden' where profile_id=current_setting('able_flow_test.b')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-user update allowed'; end if;
  delete from public.story_progress where profile_id=current_setting('able_flow_test.b')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-user delete allowed'; end if;
  update public.learner_profiles set display_name='forbidden' where id=current_setting('able_flow_test.b')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-user profile update allowed'; end if;
  delete from public.learner_profiles where id=current_setting('able_flow_test.b')::uuid;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'Cross-user profile delete allowed'; end if;

  begin
    insert into public.learner_profiles (id,display_name) values (current_setting('able_flow_test.b')::uuid,'forbidden');
    raise exception 'Cross-user profile insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.story_progress (profile_id,story_id,current_node_id)
    values (current_setting('able_flow_test.b')::uuid,'another-story','forbidden');
    raise exception 'Cross-user progress insert allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.story_progress set profile_id=current_setting('able_flow_test.b')::uuid where profile_id=auth.uid();
    raise exception 'Progress ownership transfer allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.learner_profiles set id=current_setting('able_flow_test.b')::uuid where id=auth.uid();
    raise exception 'Profile ownership transfer allowed';
  exception when insufficient_privilege then null; end;
  begin
    update public.story_progress set choices_made='{}' where profile_id=auth.uid();
    raise exception 'Object-valued choices allowed';
  exception when check_violation then null; end;

  delete from public.learner_profiles where id=auth.uid();
  get diagnostics affected = row_count;
  if affected <> 1 or (select count(*) from public.story_progress) <> 0
  then raise exception 'Own delete or cascade failed'; end if;
end;
$$;

select set_config('request.jwt.claims', json_build_object('sub',current_setting('able_flow_test.b'),'role','authenticated','is_anonymous',true)::text, true);
do $$
begin
  if (select display_name from public.learner_profiles) <> 'QA learner B' or
     (select current_node_id from public.story_progress) <> 'garden'
  then raise exception 'Another learner was modified'; end if;
end;
$$;

set local role anon;
select set_config('request.jwt.claims', '{}', true);
do $$
declare target text;
begin
  foreach target in array array['learner_profiles','story_progress'] loop
    if has_table_privilege(current_user,'public.'||target,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE')
    then raise exception 'Unauthenticated privilege on %',target; end if;
    begin
      execute format('select count(*) from public.%I',target);
      raise exception 'Unauthenticated read allowed on %',target;
    exception when insufficient_privilege then null; end;
  end loop;
end;
$$;
rollback;
select 'PASS: own CRUD/upsert, cross-user read/write/transfer denial, unauthenticated denial, JSON constraint, timestamp and cascade; fixtures rolled back' as verification;
