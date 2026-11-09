-- =====================================================================================================
-- Paradise Cafe - core schema, part 1: extensions, enums, helper functions
-- Auth model: Firebase Phone Auth is the identity provider (Supabase "Third-party auth: Firebase").
-- The Firebase UID arrives in the JWT `sub` claim and is mapped to public.profiles.firebase_uid.
-- =====================================================================================================

create extension if not exists citext;

create type public.gender_type      as enum ('female', 'male', 'non_binary', 'prefer_not_to_say');
create type public.user_status      as enum ('active', 'suspended', 'deleted');
create type public.address_label    as enum ('home', 'work', 'other');
create type public.device_platform  as enum ('ios', 'android', 'other');
create type public.order_status     as enum ('placed', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'refunded');
create type public.payment_status   as enum ('pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded');
create type public.payment_method   as enum ('upi', 'card', 'netbanking', 'wallet', 'cod');
create type public.discount_type    as enum ('flat', 'percent');
create type public.notification_type as enum ('order_update', 'offer', 'loyalty', 'system');

-- Generic updated_at maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- The Firebase UID of the caller (NULL for anonymous / service calls)
create or replace function public.jwt_uid()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '');
$$;

comment on function public.jwt_uid() is 'Firebase UID from the verified JWT. Used by every RLS policy.';
