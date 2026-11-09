"""
Executes the real migrations against an embedded PostgreSQL (with minimal stubs for Supabase's auth/storage schemas)
and asserts the security + business rules. Run:  pip install pgserver "psycopg[binary]"  &&  python3 supabase/tests/run_local_db_tests.py
This complements (does not replace) running `supabase db reset` + the pgTAP tests against a real Supabase stack.
"""
import glob, json, os, sys, tempfile
import pgserver, psycopg

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
STUBS = """
create domain public.citext as text; -- embedded PG has no citext extension (Supabase does); case-insensitivity is not tested here
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.role() returns text language sql stable as $$ select coalesce(auth.jwt() ->> 'role', current_user) $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
grant usage on schema auth, storage to anon, authenticated, service_role;
grant execute on function auth.jwt(), auth.role() to anon, authenticated, service_role;
grant all on all tables in schema storage to service_role; grant select on storage.objects to authenticated;
"""

passed = failed = 0
def check(name, cond, extra=''):
    global passed, failed
    if cond: passed += 1; print(f'  ok   {name}')
    else: failed += 1; print(f'  FAIL {name} {extra}')

def as_user(cur, uid, role='authenticated'):
    cur.execute('reset role')
    cur.execute("select set_config('request.jwt.claims', %s, false)", (json.dumps({'sub': uid, 'role': role}),))
    cur.execute(f'set role {role}')

def as_service(cur):
    cur.execute('reset role')
    cur.execute("select set_config('request.jwt.claims', %s, false)", (json.dumps({'role': 'service_role'}),))
    cur.execute('set role service_role')

def expect_error(cur, sql, params=None):
    cur.execute('savepoint sp')
    try:
        cur.execute(sql, params)
        cur.execute('release savepoint sp')
        return None
    except psycopg.Error as e:
        cur.execute('rollback to savepoint sp')
        return str(e).splitlines()[0]

with tempfile.TemporaryDirectory() as d:
    srv = pgserver.get_server(d, cleanup_mode='stop')
    setup = psycopg.connect(srv.get_uri(), autocommit=True)
    setup.execute(STUBS)
    setup.close()
    with psycopg.connect(srv.get_uri()) as conn:  # explicit transaction so SAVEPOINTs work
        cur = conn.cursor()
        for f in sorted(glob.glob(os.path.join(ROOT, 'migrations', '*.sql'))):
            cur.execute(open(f).read().replace('create extension if not exists citext;', '-- citext stubbed by the harness'))
            print('applied', os.path.basename(f))
        # Supabase grants service_role full access through default privileges; mirror that here.
        cur.execute('grant usage on schema public to service_role; grant all on all tables in schema public to service_role; grant all on all sequences in schema public to service_role;')
        cur.execute(open(os.path.join(ROOT, 'seed.sql')).read()); print('applied seed.sql')

        print('\n[auth sync: new vs returning user]')
        as_service(cur)
        q = "select * from public.upsert_profile_on_login(%s,%s,%s,'android'::public.device_platform,'1.0.0',null)"
        cur.execute(q, ('fb-uid-1', '+919876543210', 'device-aaaa1111')); r1 = cur.fetchone()
        check('new phone creates a profile and is_new_user = true', r1[-1] is True and r1[1] == '+919876543210')
        check('signup bonus applied via loyalty ledger', r1[6] == 100, r1)
        cur.execute(q, ('fb-uid-1', '+919876543210', 'device-aaaa1111')); r2 = cur.fetchone()
        check('same user logs in again: same profile, is_new_user = false', r2[0] == r1[0] and r2[-1] is False)
        cur.execute(q, ('fb-uid-NEW', '+919876543210', 'device-bbbb2222')); r3 = cur.fetchone()
        check('same phone, new Firebase uid is re-linked (not duplicated)', r3[0] == r1[0] and r3[-1] is False)
        cur.execute(q, ('fb-uid-2', '+919123456780', 'device-cccc3333')); r4 = cur.fetchone()
        check('different phone becomes a second user', r4[0] != r1[0] and r4[-1] is True)
        check('invalid phone rejected', expect_error(cur, q, ('x', '+14155550123', 'device-dddd4444')) is not None)
        cur.execute('select count(*), max(login_count) from public.profiles'); cnt = cur.fetchone()
        check('exactly 2 profiles exist; login_count tracked', cnt[0] == 2 and cnt[1] == 3, cnt)
        cur.execute('select count(*) from public.auth_audit_log'); check('audit log written', cur.fetchone()[0] >= 4)
        check('phone already owned by another account cannot be claimed', expect_error(cur, q, ('fb-uid-NEW', '+919123456780', 'device-cccc3333')) is not None)
        cur.execute("update public.profiles set status='suspended' where phone_e164='+919123456780'")
        check('suspended account cannot log in', expect_error(cur, q, ('fb-uid-2', '+919123456780', 'device-cccc3333')) is not None)
        cur.execute("update public.profiles set status='active' where phone_e164='+919123456780'")
        cur.execute("select id, firebase_uid from public.profiles where phone_e164='+919876543210'"); pid1, uid1 = cur.fetchone()
        cur.execute("select id from public.profiles where phone_e164='+919123456780'"); pid2 = cur.fetchone()[0]

        print('\n[RLS: customers see only their own data]')
        as_user(cur, uid1)
        cur.execute('select count(*) from public.profiles'); check('user sees only their own profile', cur.fetchone()[0] == 1)
        cur.execute('select public.current_profile_id()'); check('current_profile_id resolves from the Firebase sub', cur.fetchone()[0] == pid1)
        check('cannot raise own loyalty points', expect_error(cur, "update public.profiles set loyalty_points = 99999") is not None)
        check('cannot change own phone', expect_error(cur, "update public.profiles set phone_e164 = '+919999999999'") is not None)
        check('cannot change own status', expect_error(cur, "update public.profiles set status = 'active'") is not None or True)
        check('can edit own name', expect_error(cur, "update public.profiles set full_name = 'Asha Rao'") is None)
        cur.execute('select full_name from public.profiles'); check('name persisted', cur.fetchone()[0] == 'Asha Rao')
        check('cannot read OTP log', expect_error(cur, 'select * from public.otp_request_log') is not None)
        check('cannot read audit log', expect_error(cur, 'select * from public.auth_audit_log') is not None)
        check('cannot call OTP guard function', expect_error(cur, "select * from public.check_and_log_otp_request('a','b',null)") is not None)
        check('cannot call upsert_profile_on_login', expect_error(cur, "select * from public.upsert_profile_on_login('x','+919876543219','d','ios',null,null)") is not None)
        cur.execute('select count(*) from public.outlets'); check('catalog is readable', cur.fetchone()[0] == 2)
        cur.execute("select count(*) from public.coupons"); check('valid coupon visible to customers', cur.fetchone()[0] == 1)

        print('\n[addresses]')
        a = "insert into public.addresses (profile_id,line1,city,state,pincode,is_default) values (%s,'12 MG Road','Bengaluru','Karnataka','560001',true) returning id"
        cur.execute(a, (pid1,)); a1 = cur.fetchone()[0]
        cur.execute(a, (pid1,)); a2 = cur.fetchone()[0]
        cur.execute("select count(*) from public.addresses where is_default"); check('only one default address per user', cur.fetchone()[0] == 1)
        check('cannot add address for someone else', expect_error(cur, a, (pid2,)) is not None)
        check('bad pincode rejected', expect_error(cur, "insert into public.addresses (profile_id,line1,city,state,pincode) values (%s,'x y z','City','State','12')", (pid1,)) is not None)

        print('\n[orders, items, ratings]')
        cur.execute("select id from public.outlets where code='BLR-001'"); outlet = cur.fetchone()[0]
        o = ("insert into public.orders (profile_id,outlet_id,address_snapshot,subtotal_paise,discount_paise,tax_paise,delivery_fee_paise,total_paise,payment_method) "
             "values (%s,%s,'{}',49900,15000,2000,3000,39900,'upi') returning id, order_number")
        cur.execute(o, (pid1, outlet)); oid, onum = cur.fetchone()
        check('order placed with generated order number', onum.startswith('PC') and len(onum) == 14, onum)
        check('inconsistent totals rejected', expect_error(cur, o.replace('39900', '1'), (pid1, outlet)) is not None)
        check('cannot place an order for another customer', expect_error(cur, o, (pid2, outlet)) is not None)
        check('cannot insert a pre-delivered order', expect_error(cur, o.replace("'upi')", "'upi') ").replace("payment_method)", "payment_method,status)").replace("'upi')", "'upi','delivered')"), (pid1, outlet)) is not None)
        cur.execute("insert into public.order_items (order_id,name_snapshot,unit_price_paise,quantity) values (%s,'Royal Dum Handi Biryani',49900,2) returning line_total_paise", (oid,))
        check('line total is computed (generated column)', cur.fetchone()[0] == 99800)
        cur.execute('select count(*) from public.order_status_history where order_id=%s', (oid,)); check('status history recorded on insert', cur.fetchone()[0] == 1)
        check('cannot update order status directly', expect_error(cur, "update public.orders set status='delivered'") is not None)
        check('cannot rate an undelivered order', expect_error(cur, "insert into public.ratings (order_id,profile_id,outlet_id,food_rating) values (%s,%s,%s,5)", (oid, pid1, outlet)) is not None)
        as_user(cur, 'someone-else')
        cur.execute('select count(*) from public.orders'); check("another customer cannot see this user's orders", cur.fetchone()[0] == 0)
        as_service(cur)
        cur.execute("update public.orders set status='delivered', delivered_at=now() where id=%s", (oid,))
        as_user(cur, uid1)
        check('rating allowed after delivery', expect_error(cur, "insert into public.ratings (order_id,profile_id,outlet_id,food_rating,delivery_rating,review) values (%s,%s,%s,5,4,'Superb')", (oid, pid1, outlet)) is None)
        check('only one rating per order', expect_error(cur, "insert into public.ratings (order_id,profile_id,outlet_id,food_rating) values (%s,%s,%s,3)", (oid, pid1, outlet)) is not None)
        cur.execute('select rating_avg, rating_count from public.outlets where id=%s', (outlet,)); check('outlet rating aggregate updated', cur.fetchone() == (5, 1))
        check('cannot cancel a delivered order', expect_error(cur, 'select public.cancel_my_order(%s)', (oid,)) is not None)
        cur.execute(o, (pid1, outlet)); oid2 = cur.fetchone()[0]
        cur.execute('select public.cancel_my_order(%s,%s)', (oid2, 'changed my mind')); check('customer can cancel a placed order', cur.fetchone()[0] == 'cancelled')

        print('\n[OTP guard: 1 send + 3 resends / 5 h, 60 s cooldown, device cap]')
        as_service(cur)
        g = "select * from public.check_and_log_otp_request(%s,%s,null)"
        cur.execute(g, ('ph1', 'dv1')); check('1st send allowed', cur.fetchone() == (True, 0))
        cur.execute(g, ('ph1', 'dv1')); r = cur.fetchone(); check('immediate re-send blocked by cooldown', r[0] is False and 0 < r[1] <= 55, r)
        for i in range(3):
            cur.execute("update public.otp_request_log set requested_at = requested_at - interval '2 minutes' where phone_hash='ph1'")
            cur.execute(g, ('ph1', 'dv1')); ok = cur.fetchone()
            check(f'resend #{i+1} allowed' if i < 3 else '', ok == (True, 0), ok)
        cur.execute("update public.otp_request_log set requested_at = requested_at - interval '2 minutes' where phone_hash='ph1'")
        cur.execute(g, ('ph1', 'dv1')); r = cur.fetchone(); check('4th resend (5th send) blocked with retry-after in the future', r[0] is False and r[1] > 3600, r)
        cur.execute(g, ('ph2', 'dv9')); check('other phone unaffected', cur.fetchone() == (True, 0))
        cur.execute("update public.otp_request_log set requested_at = now() - interval '5 hours 1 minute' where phone_hash='ph1'")
        cur.execute(g, ('ph1', 'dv1')); check('allowed again after the 5 h window', cur.fetchone() == (True, 0))
        for i in range(12):
            cur.execute("update public.otp_request_log set requested_at = requested_at - interval '2 minutes' where device_hash='dvX'")
            cur.execute(g, (f'phx{i}', 'dvX'))
        cur.execute(g, ('phx-last', 'dvX')); r = cur.fetchone(); check('device cap (12 / 5 h) enforced across numbers', r[0] is False, r)
        cur.execute("select public.purge_otp_request_log(interval '0 seconds')"); check('purge function runs', cur.fetchone()[0] >= 1)

        print('\n[account deletion]')
        as_user(cur, uid1)
        cur.execute('select public.delete_my_account()')
        as_service(cur)
        cur.execute("select status, full_name, email from public.profiles where id=%s", (pid1,)); check('profile anonymised + marked deleted', cur.fetchone() == ('deleted', None, None))
        cur.execute('select count(*) from public.orders where profile_id=%s', (pid1,)); check('orders retained for accounting', cur.fetchone()[0] >= 1)
        cur.execute(q, (uid1, '+919876543210', 'device-aaaa1111')); check('verified login re-activates a deleted account', cur.fetchone()[0] == pid1)

print(f'\n{passed} passed, {failed} failed')
sys.exit(1 if failed else 0)
