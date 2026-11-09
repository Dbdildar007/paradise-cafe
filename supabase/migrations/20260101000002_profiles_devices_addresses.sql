-- =====================================================================================================
-- Part 2: customer profile, devices, addresses
-- =====================================================================================================

create table public.profiles (
  id                 uuid primary key default gen_random_uuid(),
  firebase_uid       text not null unique,
  phone_e164         text not null unique check (phone_e164 ~ '^\+91[6-9][0-9]{9}$'),
  phone_verified_at  timestamptz not null default now(),
  full_name          text check (char_length(full_name) between 1 and 120),
  email              citext unique check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  avatar_url         text,
  date_of_birth      date check (date_of_birth > date '1900-01-01' and date_of_birth <= current_date),
  gender             public.gender_type,
  preferred_language text not null default 'en' check (preferred_language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  marketing_opt_in   boolean not null default false,
  status             public.user_status not null default 'active',
  loyalty_tier       text not null default 'bronze' check (loyalty_tier in ('bronze', 'silver', 'gold', 'platinum')),
  loyalty_points     integer not null default 0 check (loyalty_points >= 0),
  referral_code      text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  referred_by        uuid references public.profiles (id) on delete set null,
  last_login_at      timestamptz,
  login_count        integer not null default 0 check (login_count >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
comment on table public.profiles is 'One row per customer. Created/loaded by the auth-sync Edge Function after Firebase verifies the OTP.';

create index profiles_status_idx on public.profiles (status) where deleted_at is null;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Signed-in customers may edit only their own *profile details*; identity, status and loyalty are server-controlled.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  -- current_user is the DATABASE role: 'authenticated' for direct customer writes, the function owner inside our
  -- trusted SECURITY DEFINER functions (delete_my_account, ...), and service_role for Edge Functions.
  if current_user in ('authenticated', 'anon') then
    if new.id            is distinct from old.id
    or new.firebase_uid  is distinct from old.firebase_uid
    or new.phone_e164    is distinct from old.phone_e164
    or new.status        is distinct from old.status
    or new.loyalty_tier  is distinct from old.loyalty_tier
    or new.loyalty_points is distinct from old.loyalty_points
    or new.referral_code is distinct from old.referral_code
    or new.referred_by   is distinct from old.referred_by
    or new.login_count   is distinct from old.login_count
    or new.last_login_at is distinct from old.last_login_at
    or new.phone_verified_at is distinct from old.phone_verified_at
    or new.created_at    is distinct from old.created_at
    or new.deleted_at    is distinct from old.deleted_at then
      raise exception 'protected_column' using errcode = '42501', detail = 'This column can only be changed by the server.';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_columns before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Resolves the caller's profile id. SECURITY DEFINER so policies on other tables can use it without recursion.
create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.firebase_uid = public.jwt_uid()
    and p.deleted_at is null
    and p.status = 'active'
  limit 1;
$$;

create table public.user_devices (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  device_id     text not null check (char_length(device_id) between 8 and 128),
  platform      public.device_platform not null default 'other',
  push_token    text,
  app_version   text check (char_length(app_version) <= 32),
  os_version    text check (char_length(os_version) <= 32),
  device_model  text check (char_length(device_model) <= 80),
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (profile_id, device_id)
);
create index user_devices_profile_idx on public.user_devices (profile_id);
create trigger user_devices_set_updated_at before update on public.user_devices
  for each row execute function public.set_updated_at();

create table public.addresses (
  id             uuid primary key default gen_random_uuid(),
  profile_id     uuid not null references public.profiles (id) on delete cascade,
  label          public.address_label not null default 'home',
  recipient_name text check (char_length(recipient_name) <= 120),
  phone_e164     text check (phone_e164 ~ '^\+91[6-9][0-9]{9}$'),
  line1          text not null check (char_length(line1) between 3 and 200),
  line2          text check (char_length(line2) <= 200),
  landmark       text check (char_length(landmark) <= 120),
  city           text not null check (char_length(city) between 2 and 80),
  state          text not null check (char_length(state) between 2 and 80),
  pincode        text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  latitude       numeric(9, 6) check (latitude between -90 and 90),
  longitude      numeric(9, 6) check (longitude between -180 and 180),
  is_default     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
create index addresses_profile_idx on public.addresses (profile_id) where deleted_at is null;
create unique index addresses_one_default_per_profile on public.addresses (profile_id) where is_default and deleted_at is null;
create trigger addresses_set_updated_at before update on public.addresses
  for each row execute function public.set_updated_at();

-- Setting a new default automatically un-defaults the previous one.
create or replace function public.ensure_single_default_address()
returns trigger
language plpgsql
as $$
begin
  if new.is_default and new.deleted_at is null then
    update public.addresses
       set is_default = false
     where profile_id = new.profile_id
       and id <> new.id
       and is_default
       and deleted_at is null;
  end if;
  return new;
end;
$$;
create trigger addresses_single_default before insert or update of is_default on public.addresses
  for each row execute function public.ensure_single_default_address();
