-- =====================================================================================================
-- Part 3: outlets & menu, orders, payments, ratings
-- Money is stored in integer paise (never floats).
-- =====================================================================================================

create table public.outlets (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique check (code ~ '^[A-Z0-9_-]{3,24}$'),
  name               text not null check (char_length(name) between 2 and 120),
  address_line       text not null,
  city               text not null,
  state              text not null,
  pincode            text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  latitude           numeric(9, 6) not null check (latitude between -90 and 90),
  longitude          numeric(9, 6) not null check (longitude between -180 and 180),
  phone_e164         text check (phone_e164 ~ '^\+91[0-9]{10}$'),
  opens_at           time not null default '10:00',
  closes_at          time not null default '23:30',
  delivery_radius_km numeric(5, 2) not null default 8 check (delivery_radius_km > 0),
  avg_prep_minutes   smallint not null default 25 check (avg_prep_minutes between 1 and 240),
  rating_avg         numeric(3, 2) not null default 0 check (rating_avg between 0 and 5),
  rating_count       integer not null default 0 check (rating_count >= 0),
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index outlets_city_active_idx on public.outlets (city) where is_active;
create trigger outlets_set_updated_at before update on public.outlets
  for each row execute function public.set_updated_at();

create table public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (char_length(name) between 2 and 80),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  outlet_id     uuid not null references public.outlets (id) on delete cascade,
  category_id   uuid not null references public.menu_categories (id) on delete restrict,
  name          text not null check (char_length(name) between 2 and 120),
  description   text check (char_length(description) <= 1000),
  price_paise   integer not null check (price_paise >= 0),
  is_veg        boolean not null,
  spice_level   smallint check (spice_level between 0 and 5),
  image_url     text,
  tags          text[] not null default '{}',
  is_available  boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index menu_items_outlet_idx on public.menu_items (outlet_id, is_available);
create index menu_items_category_idx on public.menu_items (category_id);
create trigger menu_items_set_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();

create sequence public.order_number_seq as bigint start 1 cache 20;

create table public.coupons (
  id                    uuid primary key default gen_random_uuid(),
  code                  citext not null unique check (code ~ '^[A-Za-z0-9_-]{4,24}$'),
  description           text,
  discount_type         public.discount_type not null,
  discount_value        integer not null check (discount_value > 0),
  max_discount_paise    integer check (max_discount_paise > 0),
  min_order_paise       integer not null default 0 check (min_order_paise >= 0),
  first_order_only      boolean not null default false,
  valid_from            timestamptz not null default now(),
  valid_until           timestamptz,
  usage_limit_total     integer check (usage_limit_total > 0),
  usage_limit_per_user  integer not null default 1 check (usage_limit_per_user > 0),
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  check (discount_type <> 'percent' or discount_value <= 100),
  check (valid_until is null or valid_until > valid_from)
);

create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  order_number       text not null unique
                       default ('PC' || to_char(now(), 'YYMMDD') || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  profile_id         uuid not null references public.profiles (id) on delete restrict,
  outlet_id          uuid not null references public.outlets (id) on delete restrict,
  address_id         uuid references public.addresses (id) on delete set null,
  address_snapshot   jsonb not null,
  status             public.order_status not null default 'placed',
  subtotal_paise     integer not null check (subtotal_paise >= 0),
  discount_paise     integer not null default 0 check (discount_paise >= 0),
  tax_paise          integer not null default 0 check (tax_paise >= 0),
  delivery_fee_paise integer not null default 0 check (delivery_fee_paise >= 0),
  total_paise        integer not null check (total_paise >= 0),
  coupon_id          uuid references public.coupons (id) on delete set null,
  payment_method     public.payment_method not null,
  payment_status     public.payment_status not null default 'pending',
  notes              text check (char_length(notes) <= 500),
  placed_at          timestamptz not null default now(),
  accepted_at        timestamptz,
  dispatched_at      timestamptz,
  delivered_at       timestamptz,
  cancelled_at       timestamptz,
  cancel_reason      text check (char_length(cancel_reason) <= 300),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  check (total_paise = subtotal_paise - discount_paise + tax_paise + delivery_fee_paise),
  check (discount_paise <= subtotal_paise)
);
create index orders_profile_placed_idx on public.orders (profile_id, placed_at desc);
create index orders_outlet_status_idx on public.orders (outlet_id, status);
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  menu_item_id      uuid references public.menu_items (id) on delete set null,
  name_snapshot     text not null,
  unit_price_paise  integer not null check (unit_price_paise >= 0),
  quantity          smallint not null check (quantity between 1 and 50),
  modifiers         jsonb not null default '[]'::jsonb,
  line_total_paise  integer generated always as (unit_price_paise * quantity) stored
);
create index order_items_order_idx on public.order_items (order_id);

create table public.order_status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  changed_by  text not null default 'system',
  note        text,
  created_at  timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- Every status change is recorded automatically (audit trail for support & disputes).
create or replace function public.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_history (order_id, status, changed_by)
    values (new.id, new.status, coalesce(auth.role(), 'system'));
  end if;
  return new;
end;
$$;
create trigger orders_log_status after insert or update of status on public.orders
  for each row execute function public.log_order_status();

create table public.payments (
  id                    uuid primary key default gen_random_uuid(),
  order_id              uuid not null references public.orders (id) on delete restrict,
  provider              text not null check (provider in ('razorpay', 'phonepe', 'paytm', 'stripe', 'cod')),
  provider_payment_id   text,
  amount_paise          integer not null check (amount_paise >= 0),
  currency              char(3) not null default 'INR',
  status                public.payment_status not null default 'pending',
  metadata              jsonb not null default '{}'::jsonb,   -- never store card numbers / CVV / UPI PINs
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
create index payments_order_idx on public.payments (order_id);
create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create table public.ratings (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null unique references public.orders (id) on delete cascade,
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  outlet_id        uuid not null references public.outlets (id) on delete cascade,
  food_rating      smallint not null check (food_rating between 1 and 5),
  delivery_rating  smallint check (delivery_rating between 1 and 5),
  review           text check (char_length(review) <= 2000),
  tags             text[] not null default '{}',
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index ratings_outlet_idx on public.ratings (outlet_id, created_at desc) where is_published;
create index ratings_profile_idx on public.ratings (profile_id);
create trigger ratings_set_updated_at before update on public.ratings
  for each row execute function public.set_updated_at();

-- Only the customer who received a DELIVERED order can rate it, and only for that order's outlet.
create or replace function public.validate_rating_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.orders o
    where o.id = new.order_id
      and o.profile_id = new.profile_id
      and o.outlet_id = new.outlet_id
      and o.status = 'delivered'
  ) then
    raise exception 'rating_not_allowed' using errcode = '42501', detail = 'Only delivered orders of the same customer can be rated.';
  end if;
  return new;
end;
$$;
create trigger ratings_validate before insert on public.ratings
  for each row execute function public.validate_rating_order();

-- Keeps outlets.rating_avg / rating_count current.
create or replace function public.refresh_outlet_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_outlet uuid := coalesce(new.outlet_id, old.outlet_id);
begin
  update public.outlets o
     set rating_avg = coalesce(s.avg_rating, 0),
         rating_count = coalesce(s.cnt, 0)
    from (
      select round(avg(food_rating)::numeric, 2) as avg_rating, count(*)::int as cnt
      from public.ratings
      where outlet_id = v_outlet and is_published
    ) s
   where o.id = v_outlet;
  return null;
end;
$$;
create trigger ratings_refresh_outlet after insert or update or delete on public.ratings
  for each row execute function public.refresh_outlet_rating();
