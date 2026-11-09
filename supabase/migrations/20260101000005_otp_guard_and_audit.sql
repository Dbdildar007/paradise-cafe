-- =====================================================================================================
-- Part 5: OTP abuse guard (SMS-pumping / toll-fraud protection) and auth audit log.
-- Written ONLY by Edge Functions using the service role. Never exposed to anon / authenticated.
-- Policy mirrors the app: 1 initial send + 3 resends per phone per 5 hours, 60 s cooldown, device cap.
-- =====================================================================================================

create table public.otp_request_log (
  id            bigint generated always as identity primary key,
  phone_hash    text not null,          -- HMAC-SHA256(phone, server pepper); the phone number itself is never stored
  device_hash   text not null,
  ip            inet,
  allowed       boolean not null,
  reason        text,
  requested_at  timestamptz not null default now()
);
create index otp_request_log_phone_idx  on public.otp_request_log (phone_hash, requested_at desc);
create index otp_request_log_device_idx on public.otp_request_log (device_hash, requested_at desc);
create index otp_request_log_time_idx   on public.otp_request_log (requested_at);

create or replace function public.check_and_log_otp_request(
  p_phone_hash  text,
  p_device_hash text,
  p_ip          inet default null
)
returns table (allowed boolean, retry_after_sec integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  c_window            constant interval := interval '5 hours';
  c_cooldown          constant interval := interval '55 seconds';  -- app shows 60 s; 5 s tolerance for clock skew
  c_max_per_phone     constant integer  := 4;                      -- 1 initial send + 3 resends
  c_max_per_device    constant integer  := 12;
  v_count             integer;
  v_oldest            timestamptz;
  v_last              timestamptz;
  v_retry             integer;
begin
  -- Serialise concurrent requests for the same phone so the limit cannot be raced.
  perform pg_advisory_xact_lock(hashtextextended(p_phone_hash, 0));

  select count(*), min(requested_at), max(requested_at)
    into v_count, v_oldest, v_last
    from public.otp_request_log
   where phone_hash = p_phone_hash and allowed and requested_at > now() - c_window;

  if v_last is not null and v_last > now() - c_cooldown then
    v_retry := greatest(1, ceil(extract(epoch from (v_last + c_cooldown - now())))::integer);
    insert into public.otp_request_log (phone_hash, device_hash, ip, allowed, reason)
    values (p_phone_hash, p_device_hash, p_ip, false, 'cooldown');
    return query select false, v_retry;
    return;
  end if;

  if v_count >= c_max_per_phone then
    v_retry := greatest(1, ceil(extract(epoch from (v_oldest + c_window - now())))::integer);
    insert into public.otp_request_log (phone_hash, device_hash, ip, allowed, reason)
    values (p_phone_hash, p_device_hash, p_ip, false, 'phone_limit');
    return query select false, v_retry;
    return;
  end if;

  select count(*), min(requested_at)
    into v_count, v_oldest
    from public.otp_request_log
   where device_hash = p_device_hash and allowed and requested_at > now() - c_window;

  if v_count >= c_max_per_device then
    v_retry := greatest(1, ceil(extract(epoch from (v_oldest + c_window - now())))::integer);
    insert into public.otp_request_log (phone_hash, device_hash, ip, allowed, reason)
    values (p_phone_hash, p_device_hash, p_ip, false, 'device_limit');
    return query select false, v_retry;
    return;
  end if;

  insert into public.otp_request_log (phone_hash, device_hash, ip, allowed, reason)
  values (p_phone_hash, p_device_hash, p_ip, true, null);
  return query select true, 0;
end;
$$;

-- Retention: keep 30 days (schedule with pg_cron: select cron.schedule('purge-otp-log', '15 3 * * *', 'select public.purge_otp_request_log()');)
create or replace function public.purge_otp_request_log(p_keep interval default interval '30 days')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.otp_request_log where requested_at < now() - p_keep;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

create table public.auth_audit_log (
  id          bigint generated always as identity primary key,
  profile_id  uuid references public.profiles (id) on delete set null,
  event       text not null check (event in ('signup', 'login', 'login_blocked', 'logout', 'account_deleted')),
  ip          inet,
  device_id   text,
  app_version text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index auth_audit_log_profile_idx on public.auth_audit_log (profile_id, created_at desc);
