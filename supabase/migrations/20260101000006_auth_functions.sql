-- =====================================================================================================
-- Part 6: server-side auth functions (service role only)
-- upsert_profile_on_login: called by the auth-sync Edge Function AFTER the Firebase ID token was verified.
--   * unknown Firebase UID + unknown phone -> create the profile (new user)
--   * known phone under a different Firebase UID (account re-created in Firebase) -> re-link
--   * known UID -> load profile
-- Suspended accounts are rejected. Soft-deleted accounts are re-activated on a verified login.
-- =====================================================================================================

create or replace function public.upsert_profile_on_login(
  p_firebase_uid text,
  p_phone_e164   text,
  p_device_id    text,
  p_platform     public.device_platform,
  p_app_version  text,
  p_ip           inet default null
)
returns table (
  profile_id     uuid,
  phone_e164     text,
  full_name      text,
  email          text,
  avatar_url     text,
  loyalty_tier   text,
  loyalty_points integer,
  referral_code  text,
  is_new_user    boolean
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_profile public.profiles%rowtype;
  v_new     boolean := false;
begin
  if p_phone_e164 !~ '^\+91[6-9][0-9]{9}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;

  select * into v_profile from public.profiles where firebase_uid = p_firebase_uid for update;

  if not found then
    select * into v_profile from public.profiles where profiles.phone_e164 = p_phone_e164 for update;
    if found then
      update public.profiles set firebase_uid = p_firebase_uid where id = v_profile.id;
    else
      insert into public.profiles (firebase_uid, phone_e164)
      values (p_firebase_uid, p_phone_e164)
      returning * into v_profile;
      v_new := true;
      insert into public.loyalty_ledger (profile_id, points_delta, reason) values (v_profile.id, 100, 'signup_bonus');
    end if;
  end if;

  -- The phone verified by Firebase is the source of truth. If this Firebase user changed their number, follow it
  -- (unless another account already owns that number).
  if v_profile.phone_e164 <> p_phone_e164 then
    if exists (select 1 from public.profiles x where x.phone_e164 = p_phone_e164 and x.id <> v_profile.id) then
      raise exception 'phone_conflict' using errcode = '23505';
    end if;
    update public.profiles set phone_e164 = p_phone_e164 where id = v_profile.id;
  end if;

  if v_profile.status = 'suspended' then
    insert into public.auth_audit_log (profile_id, event, ip, device_id, app_version)
    values (v_profile.id, 'login_blocked', p_ip, p_device_id, p_app_version);
    raise exception 'account_suspended' using errcode = 'P0001';
  end if;

  update public.profiles
     set last_login_at = now(),
         login_count = login_count + 1,
         phone_verified_at = now(),
         status = 'active',
         deleted_at = null
   where id = v_profile.id;

  insert into public.user_devices (profile_id, device_id, platform, app_version, last_seen_at)
  values (v_profile.id, p_device_id, p_platform, p_app_version, now())
  on conflict on constraint user_devices_profile_id_device_id_key
  do update set platform = excluded.platform, app_version = excluded.app_version, last_seen_at = now();

  insert into public.auth_audit_log (profile_id, event, ip, device_id, app_version)
  values (v_profile.id, case when v_new then 'signup' else 'login' end, p_ip, p_device_id, p_app_version);

  return query
    select p.id, p.phone_e164, p.full_name, p.email::text, p.avatar_url, p.loyalty_tier, p.loyalty_points, p.referral_code, v_new
      from public.profiles p
     where p.id = v_profile.id;
end;
$$;

-- Customer-initiated cancel (only before the kitchen starts preparing).
create or replace function public.cancel_my_order(p_order_id uuid, p_reason text default null)
returns public.order_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid := public.current_profile_id();
  v_status  public.order_status;
begin
  if v_profile is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  update public.orders
     set status = 'cancelled', cancelled_at = now(), cancel_reason = left(p_reason, 300)
   where id = p_order_id
     and profile_id = v_profile
     and status in ('placed', 'accepted')
   returning status into v_status;

  if v_status is null then
    raise exception 'order_not_cancellable' using errcode = 'P0001';
  end if;
  return v_status;
end;
$$;

-- GDPR/DPDP style erasure request: anonymise the profile, keep orders for tax/accounting.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile uuid := public.current_profile_id();
begin
  if v_profile is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  update public.profiles
     set status = 'deleted', deleted_at = now(), full_name = null, email = null, avatar_url = null,
         date_of_birth = null, gender = null, marketing_opt_in = false
   where id = v_profile;
  delete from public.user_devices where profile_id = v_profile;
  delete from public.addresses where profile_id = v_profile;
  delete from public.notifications where profile_id = v_profile;
  insert into public.auth_audit_log (profile_id, event) values (v_profile, 'account_deleted');
end;
$$;
