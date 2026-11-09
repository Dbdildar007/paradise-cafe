-- =====================================================================================================
-- Part 4: coupon redemptions, loyalty ledger, favourites, notifications
-- =====================================================================================================

create table public.coupon_redemptions (
  id           uuid primary key default gen_random_uuid(),
  coupon_id    uuid not null references public.coupons (id) on delete restrict,
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  order_id     uuid not null references public.orders (id) on delete cascade,
  redeemed_at  timestamptz not null default now(),
  unique (coupon_id, order_id)
);
create index coupon_redemptions_profile_idx on public.coupon_redemptions (profile_id, coupon_id);

create table public.loyalty_ledger (
  id            bigint generated always as identity primary key,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  points_delta  integer not null check (points_delta <> 0),
  reason        text not null check (reason in ('order_earn', 'order_refund', 'redeem', 'signup_bonus', 'referral', 'adjustment')),
  order_id      uuid references public.orders (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index loyalty_ledger_profile_idx on public.loyalty_ledger (profile_id, created_at desc);

-- profiles.loyalty_points is a cache of SUM(points_delta); tier derives from lifetime points.
create or replace function public.apply_loyalty_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
begin
  update public.profiles
     set loyalty_points = greatest(0, loyalty_points + new.points_delta)
   where id = new.profile_id
   returning loyalty_points into v_points;

  update public.profiles
     set loyalty_tier = case
           when v_points >= 5000 then 'platinum'
           when v_points >= 2000 then 'gold'
           when v_points >= 500  then 'silver'
           else 'bronze'
         end
   where id = new.profile_id;
  return new;
end;
$$;
create trigger loyalty_ledger_apply after insert on public.loyalty_ledger
  for each row execute function public.apply_loyalty_entry();

create table public.favorite_outlets (
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  outlet_id   uuid not null references public.outlets (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, outlet_id)
);

create table public.favorite_items (
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  menu_item_id  uuid not null references public.menu_items (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (profile_id, menu_item_id)
);

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  type        public.notification_type not null default 'system',
  title       text not null check (char_length(title) <= 120),
  body        text check (char_length(body) <= 500),
  data        jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_unread_idx on public.notifications (profile_id, created_at desc) where read_at is null;
