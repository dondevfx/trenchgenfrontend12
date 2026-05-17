-- ============================================================
-- React Duel — Full Schema
-- Paste this entire file into your Supabase SQL Editor and click Run
-- ============================================================

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  wallet_address text,
  c_coins numeric default 0 check (c_coins >= 0),
  wins int default 0,
  losses int default 0,
  elo int default 1000,
  streak int default 0,
  last_bonus_claimed timestamptz,
  created_at timestamptz default now()
);

-- Matches
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  player1_id uuid references profiles(id),
  player2_id uuid references profiles(id),
  winner_id uuid references profiles(id),
  entry_fee_c numeric default 0,
  prize_pool_c numeric default 0,
  platform_fee_c numeric default 0,
  reaction_time_ms int,
  early_click boolean default false,
  played_at timestamptz default now()
);

-- Transactions
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  type text check (type in ('deposit', 'withdrawal', 'match_win', 'match_loss', 'daily_bonus')),
  amount_c numeric,
  crypto_amount numeric,
  crypto_symbol text,
  tx_hash text,
  status text default 'confirmed',
  created_at timestamptz default now()
);

-- Atomic balance: credit
create or replace function credit_coins(user_id uuid, amount numeric)
returns void language sql security definer as $$
  update profiles set c_coins = c_coins + amount where id = user_id;
$$;

-- Atomic balance: deduct (fails silently if insufficient — checked in app)
create or replace function deduct_coins(user_id uuid, amount numeric)
returns void language sql security definer as $$
  update profiles set c_coins = c_coins - amount where id = user_id and c_coins >= amount;
$$;

-- Win counter
create or replace function increment_win(uid uuid)
returns void language sql security definer as $$
  update profiles set wins = wins + 1, streak = streak + 1 where id = uid;
$$;

-- Loss counter
create or replace function increment_loss(uid uuid)
returns void language sql security definer as $$
  update profiles set losses = losses + 1, streak = 0 where id = uid;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
drop policy if exists "profiles_read_all" on profiles;
drop policy if exists "profiles_update_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_read_all"   on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

alter table matches enable row level security;
drop policy if exists "matches_read_all" on matches;
create policy "matches_read_all" on matches for select using (true);

alter table transactions enable row level security;
drop policy if exists "transactions_read_own" on transactions;
create policy "transactions_read_own" on transactions for select using (auth.uid() = user_id);
