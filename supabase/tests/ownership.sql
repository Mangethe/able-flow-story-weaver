-- Run as postgres; all users, profiles and progress are rolled back.
begin;
select set_config('able_flow_test.a',gen_random_uuid()::text,true);
select set_config('able_flow_test.b',gen_random_uuid()::text,true);
select set_config('able_flow_test.mutation',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,is_anonymous) values
(current_setting('able_flow_test.a')::uuid,'authenticated','authenticated',true),
(current_setting('able_flow_test.b')::uuid,'authenticated','authenticated',true);
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('able_flow_test.a'),'role','authenticated','is_anonymous',true)::text,true);
insert into public.learner_profiles(display_name) values('QA A');
do $$
declare result jsonb; count_rows integer;
begin
 if current_user<>'authenticated' then raise exception 'RLS bypass in test'; end if;
 result:=public.save_story_progress('qa-story',1,'garden','[]',0,current_setting('able_flow_test.mutation')::uuid);
 if result->>'status'<>'saved' or (result#>>'{progress,revision}')::integer<>1 then raise exception 'Create failed'; end if;
 result:=public.save_story_progress('qa-story',1,'garden','[]',0,current_setting('able_flow_test.mutation')::uuid);
 if (result#>>'{progress,revision}')::integer<>1 then raise exception 'Retry not idempotent'; end if;
 result:=public.save_story_progress('qa-story',1,'stale','[]',0,gen_random_uuid());
 if result->>'status'<>'conflict' or result#>>'{progress,current_node_id}'<>'garden' then raise exception 'Stale save overwrote progress'; end if;
 result:=public.save_story_progress('qa-story',1,'pond','[]',1,gen_random_uuid());
 if result->>'status'<>'saved' or (result#>>'{progress,revision}')::integer<>2 then raise exception 'CAS update failed'; end if;
 result:=public.save_story_progress('qa-story',2,'new-start','[]',0,gen_random_uuid());
 if result->>'status'<>'saved' or (result#>>'{progress,revision}')::integer<>1 then raise exception 'Version isolation failed'; end if;
 begin
  perform public.save_story_progress('qa-story',1,'bad','{}',2,gen_random_uuid());
  raise exception 'Object choices accepted';
 exception when check_violation then null; end;
 begin
  update public.story_progress set revision=100;
  raise exception 'Direct update bypass allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.story_progress(profile_id,story_id,current_node_id) values(auth.uid(),'bypass','x');
  raise exception 'Direct insert bypass allowed';
 exception when insufficient_privilege then null; end;
 if (select count(*) from public.story_progress)<>2 then raise exception 'Version rows missing'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('able_flow_test.b'),'role','authenticated','is_anonymous',true)::text,true);
insert into public.learner_profiles(display_name) values('QA B');
do $$
declare result jsonb; affected integer;
begin
 if (select count(*) from public.story_progress)<>0 or (select count(*) from public.learner_profiles)<>1 then raise exception 'Cross-user data visible'; end if;
 result:=public.save_story_progress('qa-story',1,'other-start','[]',0,gen_random_uuid());
 if result#>>'{progress,profile_id}'<>auth.uid()::text then raise exception 'RPC owner mismatch'; end if;
 delete from public.story_progress where profile_id=current_setting('able_flow_test.a')::uuid;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-user delete allowed'; end if;
 update public.learner_profiles set display_name='forbidden' where id=current_setting('able_flow_test.a')::uuid;
 get diagnostics affected=row_count;
 if affected<>0 then raise exception 'Cross-user profile update allowed'; end if;
 delete from public.learner_profiles where id=auth.uid();
 if (select count(*) from public.story_progress)<>0 then raise exception 'Cascade failed'; end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('able_flow_test.a'),'role','authenticated','is_anonymous',true)::text,true);
do $$ begin
 if (select count(*) from public.story_progress)<>2 then raise exception 'Other learner modified A'; end if;
end $$;
set local role anon;
select set_config('request.jwt.claims','{}',true);
do $$ begin
 begin
  perform public.save_story_progress('qa-story',1,'x','[]',0,gen_random_uuid());
  raise exception 'Unauthenticated RPC allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform count(*) from public.story_progress;
  raise exception 'Unauthenticated read allowed';
 exception when insufficient_privilege then null; end;
end $$;
rollback;
select 'PASS: CAS revisions, stale-save denial, idempotent retry, version isolation, RPC ownership, direct-write denial, RLS, cascade and anon denial; fixtures rolled back' as verification;
