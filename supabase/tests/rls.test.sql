\set ON_ERROR_STOP off
\pset tuples_only on
\pset format unaligned

create or replace function pg_temp.try(sql text) returns text language plpgsql as $$
begin execute sql; return 'ok'; exception when others then return 'denied: ' || sqlerrm; end $$;
-- pg_temp functions are not callable after SET ROLE across roles reliably, so use a public helper
create or replace function public.t_try(sql text) returns text language plpgsql as $$
begin execute sql; return 'ok'; exception when others then return 'err: ' || sqlerrm; end $$;
create or replace function public.t_count(sql text) returns bigint language plpgsql as $$
declare n bigint; begin execute 'select count(*) from (' || sql || ') q' into n; return n; end $$;
grant execute on function public.t_try(text), public.t_count(text) to anon, authenticated, service_role;

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'alice@x.co', '{"full_name":"Alice Dube","phone":"0712345678"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bob@x.co', '{}');
insert into auth.users (id, email, is_anonymous) values ('cccccccc-0000-0000-0000-000000000003', null, true);

select 'profile trigger: alice  -> ' || name || ' / ' || phone from public.profiles where email = 'alice@x.co';
select 'profile trigger: bob    -> ' || name from public.profiles where email = 'bob@x.co';
select 'profile trigger: guest  -> ' || name from public.profiles where id = 'cccccccc-0000-0000-0000-000000000003';

-- ALICE
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
select 'A insert own list           : ' || public.t_try($q$insert into public.lists (id, user_id, name) values ('11111111-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','A list')$q$);
select 'A insert list for Bob       : ' || public.t_try($q$insert into public.lists (user_id, name) values ('bbbbbbbb-0000-0000-0000-000000000002','sneaky')$q$);
select 'A insert own item           : ' || public.t_try($q$insert into public.list_items (list_id, name, price, qty) values ('11111111-0000-0000-0000-000000000001','Milk',35.99,2)$q$);
select 'A duplicate item name       : ' || public.t_try($q$insert into public.list_items (list_id, name, price, qty) values ('11111111-0000-0000-0000-000000000001','Milk',35.99,1)$q$);
select 'A qty = 0                   : ' || public.t_try($q$insert into public.list_items (list_id, name, price, qty) values ('11111111-0000-0000-0000-000000000001','Eggs',59.99,0)$q$);
select 'A update own name           : ' || public.t_try($q$update public.profiles set name = 'Alice D' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$q$);
select 'A SELF-GRANT is_pro         : ' || public.t_try($q$update public.profiles set is_pro = true where id = 'aaaaaaaa-0000-0000-0000-000000000001'$q$);
select 'A write ai_usage            : ' || public.t_try($q$insert into public.ai_usage (user_id, tokens_used) values ('aaaaaaaa-0000-0000-0000-000000000001', 1)$q$);
select 'A write prices              : ' || public.t_try($q$insert into public.prices (item_name, store, price) values ('Milk','Checkers',1)$q$);
select 'A favourite for self        : ' || public.t_try($q$insert into public.favourites (user_id, item_name) values ('aaaaaaaa-0000-0000-0000-000000000001','Milk')$q$);
select 'A favourite for Bob         : ' || public.t_try($q$insert into public.favourites (user_id, item_name) values ('bbbbbbbb-0000-0000-0000-000000000002','Milk')$q$);
select 'A history for self          : ' || public.t_try($q$insert into public.shopping_history (user_id, store, total) values ('aaaaaaaa-0000-0000-0000-000000000001','Checkers',99)$q$);
select 'A sees profiles (want 1)    : ' || public.t_count('select 1 from public.profiles');

-- BOB
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', false);
select 'B sees Alice lists (want 0) : ' || public.t_count('select 1 from public.lists');
select 'B sees Alice items (want 0) : ' || public.t_count('select 1 from public.list_items');
select 'B sees Alice favs (want 0)  : ' || public.t_count('select 1 from public.favourites');
select 'B sees Alice trips (want 0) : ' || public.t_count('select 1 from public.shopping_history');
select 'B insert into Alice list    : ' || public.t_try($q$insert into public.list_items (list_id, name, price, qty) values ('11111111-0000-0000-0000-000000000001','Planted',1,1)$q$);
select 'B delete Alice item         : ' || public.t_try($q$delete from public.list_items where list_id = '11111111-0000-0000-0000-000000000001'$q$);
select 'B sees profiles (want 1)    : ' || public.t_count('select 1 from public.profiles');

-- ANON
reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);
select 'anon reads lists (want 0)   : ' || public.t_count('select 1 from public.lists');
select 'anon reads profiles (want 0): ' || public.t_count('select 1 from public.profiles');
select 'anon insert list            : ' || public.t_try($q$insert into public.lists (user_id, name) values ('aaaaaaaa-0000-0000-0000-000000000001','x')$q$);

-- SERVICE ROLE (Edge Function + scraper)
reset role; set role service_role;
select 'service writes prices       : ' || public.t_try($q$insert into public.prices (item_name, store, price) values ('Milk','Checkers',35.99)$q$);
select 'service writes ai_usage     : ' || public.t_try($q$insert into public.ai_usage (user_id, tokens_used, message) values ('aaaaaaaa-0000-0000-0000-000000000001', 120, 'hi')$q$);
select 'service sets is_pro         : ' || public.t_try($q$update public.profiles set is_pro = true where email = 'alice@x.co'$q$);

-- Prices readable by everyone, Alice still intact
reset role; set role anon;
select 'anon reads prices (want 1)  : ' || public.t_count('select 1 from public.prices');
reset role;
select 'Alice final name / is_pro   : ' || name || ' / ' || is_pro from public.profiles where email = 'alice@x.co';
select 'Alice items still intact    : ' || count(*) from public.list_items;
