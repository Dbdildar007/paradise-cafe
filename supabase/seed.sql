-- Development seed (never run in production): two outlets, categories, a few items and a welcome coupon.
insert into public.outlets (code, name, address_line, city, state, pincode, latitude, longitude, phone_e164)
values
  ('BLR-001', 'Paradise Cafe - Indiranagar', '100 Feet Road, Indiranagar', 'Bengaluru', 'Karnataka', '560038', 12.971900, 77.641200, '+918012345678'),
  ('HYD-001', 'Paradise Cafe - Secunderabad', 'MG Road, Secunderabad', 'Hyderabad', 'Telangana', '500003', 17.440100, 78.498300, '+914012345678')
on conflict (code) do nothing;

insert into public.menu_categories (name, sort_order) values ('Royal Biryanis', 1), ('Kebabs & Roasts', 2), ('Desserts', 3)
on conflict (name) do nothing;

insert into public.menu_items (outlet_id, category_id, name, description, price_paise, is_veg, spice_level)
select o.id, c.id, v.name, v.description, v.price, v.veg, v.spice
from public.outlets o
join (values
  ('Royal Dum Handi Biryani', 'Slow-cooked 48 hours in a sealed clay handi', 49900, false, 3, 'Royal Biryanis'),
  ('Shahi Tukda', 'Slow-simmered rabdi with saffron', 19900, true, 0, 'Desserts')
) as v(name, description, price, veg, spice, category) on true
join public.menu_categories c on c.name = v.category
where o.code = 'BLR-001'
on conflict do nothing;

insert into public.coupons (code, description, discount_type, discount_value, min_order_paise, first_order_only)
values ('ROYALWELCOME', 'Rs 150 off your first royal dum handi order', 'flat', 15000, 29900, true)
on conflict (code) do nothing;
