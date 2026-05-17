-- Run this in your Supabase SQL Editor to add the diamond currency system

alter table profiles
  add column if not exists diamonds bigint default 0 check (diamonds >= 0),
  add column if not exists last_diamond_bonus timestamptz;

create or replace function credit_diamonds(user_id uuid, amount bigint)
returns void language sql security definer as $$
  update profiles set diamonds = diamonds + amount where id = user_id;
$$;

create or replace function deduct_diamonds(user_id uuid, amount bigint)
returns void language sql security definer as $$
  update profiles set diamonds = diamonds - amount where id = user_id and diamonds >= amount;
$$;
