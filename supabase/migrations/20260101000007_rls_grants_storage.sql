-- =====================================================================================================
-- Part 7: Row Level Security, grants, storage
-- Rules: RLS is ENABLED and FORCED on every table. Customers (role `authenticated`, Firebase JWT) only ever see their
-- own rows. Catalog data is readable by everyone. Internal tables have NO policies (service role only).
-- =====================================================================================================

-- ---- enable + force RLS everywhere -----------------------------------------------------------------
alter table public.profiles             enable row level security;
alter table public.user_devices         enable row level security;
alter table public.addresses            enable row level security;
alter table public.outlets              enable row level security;
alter table public.menu_categories      enable row level security;
alter table public.menu_items           enable row level security;
alter table public.coupons              enable row level security;
alter table public.orders               enable row level security;
alter table public.order_items          enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments             enable row level security;
alter table public.ratings              enable row level security;
alter table public.coupon_redemptions   enable row level security;
alter table public.loyalty_ledger       enable row level security;
alter table public.favorite_outlets     enable row level security;
alter table public.favorite_items       enable row level security;
alter table public.notifications        enable row level security;
alter table public.otp_request_log      enable row level security;
alter table public.auth_audit_log       enable row level security;

alter table public.profiles             force row level security;
alter table public.user_devices         force row level security;
alter table public.addresses            force row level security;
alter table public.orders               force row level security;
alter table public.order_items          force row level security;
alter table public.payments             force row level security;
alter table public.ratings              force row level security;
alter table public.otp_request_log      force row level security;
alter table public.auth_audit_log       force row level security;

-- ---- privileges: start from nothing, grant precisely -----------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

grant usage on schema public to anon, authenticated;

-- public catalog
grant select on public.outlets, public.menu_categories, public.menu_items to anon, authenticated;
grant select on public.coupons to authenticated;

-- customer-owned data
grant select on public.profiles to authenticated;
grant update (full_name, email, avatar_url, date_of_birth, gender, preferred_language, marketing_opt_in)
  on public.profiles to authenticated;
grant select, insert, update, delete on public.user_devices to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select, insert on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select on public.order_status_history to authenticated;
grant select on public.payments to authenticated;
grant select, insert, update, delete on public.ratings to authenticated;
grant select on public.coupon_redemptions to authenticated;
grant select on public.loyalty_ledger to authenticated;
grant select, insert, delete on public.favorite_outlets to authenticated;
grant select, insert, delete on public.favorite_items to authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant usage on sequence public.order_number_seq to authenticated;

-- callable helpers
grant execute on function public.jwt_uid()               to anon, authenticated;
grant execute on function public.current_profile_id()    to authenticated;
grant execute on function public.cancel_my_order(uuid, text) to authenticated;
grant execute on function public.delete_my_account()     to authenticated;

-- service-role-only functions (Edge Functions)
grant execute on function public.check_and_log_otp_request(text, text, inet) to service_role;
grant execute on function public.upsert_profile_on_login(text, text, text, public.device_platform, text, inet) to service_role;
grant execute on function public.purge_otp_request_log(interval) to service_role;

-- ---- policies ---------------------------------------------------------------------------------------
-- profiles
create policy profiles_select_own on public.profiles for select to authenticated
  using (firebase_uid = public.jwt_uid() and deleted_at is null);
create policy profiles_update_own on public.profiles for update to authenticated
  using (firebase_uid = public.jwt_uid() and deleted_at is null)
  with check (firebase_uid = public.jwt_uid());

-- devices
create policy devices_own on public.user_devices for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- addresses
create policy addresses_select_own on public.addresses for select to authenticated
  using (profile_id = public.current_profile_id() and deleted_at is null);
create policy addresses_insert_own on public.addresses for insert to authenticated
  with check (profile_id = public.current_profile_id());
create policy addresses_update_own on public.addresses for update to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());
create policy addresses_delete_own on public.addresses for delete to authenticated
  using (profile_id = public.current_profile_id());

-- catalog (read-only for everyone)
create policy outlets_read on public.outlets for select to anon, authenticated using (is_active);
create policy menu_categories_read on public.menu_categories for select to anon, authenticated using (is_active);
create policy menu_items_read on public.menu_items for select to anon, authenticated
  using (is_available and exists (select 1 from public.outlets o where o.id = outlet_id and o.is_active));

-- coupons: only currently valid, active coupons are visible
create policy coupons_read on public.coupons for select to authenticated
  using (is_active and valid_from <= now() and (valid_until is null or valid_until > now()));

-- orders: customers can read their orders and place new ones (always as 'placed' / 'pending'); updates go through functions
create policy orders_select_own on public.orders for select to authenticated
  using (profile_id = public.current_profile_id());
create policy orders_insert_own on public.orders for insert to authenticated
  with check (
    profile_id = public.current_profile_id()
    and status = 'placed'
    and payment_status = 'pending'
    and delivered_at is null and cancelled_at is null
  );

create policy order_items_select_own on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.profile_id = public.current_profile_id()));
create policy order_items_insert_own on public.order_items for insert to authenticated
  with check (exists (
    select 1 from public.orders o
    where o.id = order_id and o.profile_id = public.current_profile_id() and o.status = 'placed'
  ));

create policy order_history_select_own on public.order_status_history for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.profile_id = public.current_profile_id()));

create policy payments_select_own on public.payments for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.profile_id = public.current_profile_id()));

-- ratings
create policy ratings_select on public.ratings for select to authenticated
  using (is_published or profile_id = public.current_profile_id());
create policy ratings_insert_own on public.ratings for insert to authenticated
  with check (profile_id = public.current_profile_id());
create policy ratings_update_own on public.ratings for update to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());
create policy ratings_delete_own on public.ratings for delete to authenticated
  using (profile_id = public.current_profile_id());

-- misc customer data
create policy redemptions_select_own on public.coupon_redemptions for select to authenticated
  using (profile_id = public.current_profile_id());
create policy loyalty_select_own on public.loyalty_ledger for select to authenticated
  using (profile_id = public.current_profile_id());
create policy fav_outlets_own on public.favorite_outlets for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());
create policy fav_items_own on public.favorite_items for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());
create policy notifications_select_own on public.notifications for select to authenticated
  using (profile_id = public.current_profile_id());
create policy notifications_update_own on public.notifications for update to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- otp_request_log & auth_audit_log intentionally have NO policies: only the service role (which bypasses RLS) can touch them.

-- ---- storage: private avatar bucket, one folder per profile ------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy avatars_read_own on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = public.current_profile_id()::text);
create policy avatars_write_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = public.current_profile_id()::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = public.current_profile_id()::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = public.current_profile_id()::text);
