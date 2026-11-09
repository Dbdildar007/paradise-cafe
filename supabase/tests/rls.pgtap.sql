-- pgTAP checks for a real Supabase stack:  supabase test db
begin;
select plan(6);

select has_table('public', 'profiles', 'profiles exists');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'RLS enabled on profiles');
select ok((select relforcerowsecurity from pg_class where oid = 'public.orders'::regclass), 'RLS forced on orders');
select is((select count(*)::int from pg_policies where schemaname = 'public' and tablename = 'otp_request_log'), 0, 'otp_request_log has no policies');
select ok(not has_function_privilege('authenticated', 'public.check_and_log_otp_request(text,text,inet)', 'execute'), 'authenticated cannot call the OTP guard');
select ok(has_function_privilege('service_role', 'public.upsert_profile_on_login(text,text,text,public.device_platform,text,inet)', 'execute'), 'service_role can upsert profiles');

select * from finish();
rollback;
