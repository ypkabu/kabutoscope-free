-- KabutoScope Free 初期スキーマ
-- このSQLはSupabase SQL Editorで実行してください。
-- 本アプリは個人用の情報整理・通知ツールであり、投資助言や自動売買は行いません。

create extension if not exists pgcrypto;

create table if not exists stocks (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  market text not null,
  country text not null,
  sector text not null default '',
  tags jsonb not null default '[]'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid not null references stocks(id) on delete cascade,
  account_type text not null check (account_type in ('NISA', 'TOKUTEI', 'WATCH_ONLY')),
  quantity numeric not null default 0,
  average_price numeric,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(stock_id)
);

create table if not exists alert_settings (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid not null references stocks(id) on delete cascade,
  buy_below numeric,
  take_profit numeric,
  strong_take_profit numeric,
  stop_loss numeric,
  notify_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(stock_id)
);

create table if not exists price_snapshots (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid not null references stocks(id) on delete cascade,
  symbol text not null,
  current_price numeric,
  previous_close numeric,
  change numeric,
  change_percent numeric,
  volume numeric,
  currency text,
  market_time timestamptz,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid not null references stocks(id) on delete cascade,
  symbol text not null,
  notification_type text not null check (
    notification_type in (
      'BUY_LINE',
      'BUY_SCORE',
      'TAKE_PROFIT',
      'STRONG_TAKE_PROFIT',
      'STOP_LOSS',
      'HIGH_RISK',
      'SELL_SCORE'
    )
  ),
  current_price numeric,
  message text not null,
  nisa_score numeric,
  tokutei_score numeric,
  buy_score numeric,
  sell_score numeric,
  risk_score numeric,
  created_at timestamptz not null default now()
);

create table if not exists scoring_results (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid not null references stocks(id) on delete cascade,
  symbol text not null,
  nisa_score numeric not null,
  tokutei_score numeric not null,
  buy_score numeric not null,
  sell_score numeric not null,
  risk_score numeric not null,
  confidence_score numeric not null,
  scores_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_stocks_updated_at on stocks;
create trigger set_stocks_updated_at before update on stocks for each row execute function set_updated_at();

drop trigger if exists set_holdings_updated_at on holdings;
create trigger set_holdings_updated_at before update on holdings for each row execute function set_updated_at();

drop trigger if exists set_alert_settings_updated_at on alert_settings;
create trigger set_alert_settings_updated_at before update on alert_settings for each row execute function set_updated_at();

create index if not exists idx_price_snapshots_stock_created on price_snapshots(stock_id, created_at desc);
create index if not exists idx_price_snapshots_symbol_created on price_snapshots(symbol, created_at desc);
create index if not exists idx_notification_logs_stock_type_created on notification_logs(stock_id, notification_type, created_at desc);
create index if not exists idx_scoring_results_stock_created on scoring_results(stock_id, created_at desc);
create index if not exists idx_stocks_enabled on stocks(enabled);

alter table stocks enable row level security;
alter table holdings enable row level security;
alter table alert_settings enable row level security;
alter table price_snapshots enable row level security;
alter table notification_logs enable row level security;
alter table scoring_results enable row level security;
alter table app_settings enable row level security;

drop policy if exists "public read stocks" on stocks;
create policy "public read stocks" on stocks for select using (true);

drop policy if exists "public read holdings" on holdings;
create policy "public read holdings" on holdings for select using (true);

drop policy if exists "public read alert settings" on alert_settings;
create policy "public read alert settings" on alert_settings for select using (true);

drop policy if exists "public read price snapshots" on price_snapshots;
create policy "public read price snapshots" on price_snapshots for select using (true);

drop policy if exists "public read notification logs" on notification_logs;
create policy "public read notification logs" on notification_logs for select using (true);

drop policy if exists "public read scoring results" on scoring_results;
create policy "public read scoring results" on scoring_results for select using (true);

drop policy if exists "public read app settings" on app_settings;
create policy "public read app settings" on app_settings for select using (true);

insert into stocks (id, symbol, name, market, country, sector, tags, enabled) values
('00000000-0000-0000-0000-000000000001', '9434.T', 'ソフトバンク', 'TSE', 'JP', '通信', '["dividend","shareholder_benefit","telecom","defensive","long_term"]', true),
('00000000-0000-0000-0000-000000000002', '9432.T', 'NTT', 'TSE', 'JP', '通信', '["dividend","telecom","infrastructure","defensive","long_term"]', true),
('00000000-0000-0000-0000-000000000003', '7974.T', '任天堂', 'TSE', 'JP', 'ゲーム', '["game","ip","growth","long_term"]', true),
('00000000-0000-0000-0000-000000000004', 'SP500_FUND', 'eMAXIS Slim 米国株式 S&P500', 'FUND', 'JP', '投資信託', '["sp500","index","long_term","nisa","diversified"]', true),
('00000000-0000-0000-0000-000000000005', '6526.T', 'ソシオネクスト', 'TSE', 'JP', '半導体', '["semiconductor","ai","high_volatility","growth","tokutei"]', true),
('00000000-0000-0000-0000-000000000006', '6857.T', 'アドバンテスト', 'TSE', 'JP', '半導体', '["semiconductor","ai","high_volatility","growth","tokutei"]', true),
('00000000-0000-0000-0000-000000000007', '9697.T', 'カプコン', 'TSE', 'JP', 'ゲーム', '["game","growth","long_term"]', true),
('00000000-0000-0000-0000-000000000008', '5803.T', 'フジクラ', 'TSE', 'JP', '電線', '["ai","datacenter","optical_fiber","high_volatility","tokutei"]', true),
('00000000-0000-0000-0000-000000000009', '6146.T', 'ディスコ', 'TSE', 'JP', '半導体製造装置', '["semiconductor","high_quality","high_price","high_volatility"]', true),
('00000000-0000-0000-0000-000000000010', 'NVDA', 'NVIDIA', 'NASDAQ', 'US', 'Semiconductor', '["ai","semiconductor","mega_cap","growth","high_volatility"]', true),
('00000000-0000-0000-0000-000000000011', 'AMD', 'Advanced Micro Devices', 'NASDAQ', 'US', 'Semiconductor', '["ai","semiconductor","growth","high_volatility"]', true),
('00000000-0000-0000-0000-000000000012', 'PLTR', 'Palantir', 'NYSE', 'US', 'Software', '["ai","software","growth","high_volatility"]', true),
('00000000-0000-0000-0000-000000000013', 'MSFT', 'Microsoft', 'NASDAQ', 'US', 'Software', '["ai","software","mega_cap","long_term"]', true),
('00000000-0000-0000-0000-000000000014', 'AAPL', 'Apple', 'NASDAQ', 'US', 'Consumer Technology', '["mega_cap","long_term"]', true),
('00000000-0000-0000-0000-000000000015', 'ASML', 'ASML', 'NASDAQ', 'NL', 'Semiconductor Equipment', '["semiconductor","equipment","long_term"]', true),
('00000000-0000-0000-0000-000000000016', 'TSM', 'Taiwan Semiconductor', 'NYSE', 'TW', 'Foundry', '["semiconductor","foundry","long_term"]', true)
on conflict (symbol) do update set
  name = excluded.name,
  market = excluded.market,
  country = excluded.country,
  sector = excluded.sector,
  tags = excluded.tags,
  enabled = excluded.enabled;

insert into holdings (stock_id, account_type, quantity, average_price, memo)
select id, case
  when symbol in ('9434.T', '9432.T', '7974.T', 'SP500_FUND') then 'NISA'
  when symbol in ('6526.T', '6857.T') then 'TOKUTEI'
  else 'WATCH_ONLY'
end,
0,
null,
case
  when symbol = 'SP500_FUND' then '初版では手動監視の投資信託枠'
  when symbol in ('6526.T', '6857.T') then '短中期の値動きとテーマ性を監視'
  when symbol in ('9434.T', '9432.T', '7974.T') then '長期保有候補として監視'
  else '追加監視候補'
end
from stocks
on conflict (stock_id) do update set
  account_type = excluded.account_type,
  memo = excluded.memo;

insert into alert_settings (stock_id, buy_below, take_profit, strong_take_profit, stop_loss, notify_enabled)
select id,
  case symbol
    when '9434.T' then 215
    when '9432.T' then 150
    when '7974.T' then 7500
    when '6526.T' then 1900
    when '6857.T' then 28000
    when '9697.T' then 3300
    when '5803.T' then 5500
    when '6146.T' then 65000
    else null
  end,
  case symbol
    when '9434.T' then 240
    when '9432.T' then 170
    when '7974.T' then 9000
    when '6526.T' then 2400
    when '6857.T' then 35000
    when '9697.T' then 4000
    when '5803.T' then 6800
    when '6146.T' then 80000
    else null
  end,
  case symbol
    when '9434.T' then 260
    when '9432.T' then 180
    when '7974.T' then 10000
    when '6526.T' then 2700
    when '6857.T' then 40000
    when '9697.T' then 4500
    when '5803.T' then 7200
    when '6146.T' then 90000
    else null
  end,
  case symbol
    when '9434.T' then 200
    when '9432.T' then 140
    when '7974.T' then 7000
    when '6526.T' then 1700
    when '6857.T' then 25000
    when '9697.T' then 3000
    when '5803.T' then 5000
    when '6146.T' then 60000
    else null
  end,
  true
from stocks
on conflict (stock_id) do update set
  buy_below = excluded.buy_below,
  take_profit = excluded.take_profit,
  strong_take_profit = excluded.strong_take_profit,
  stop_loss = excluded.stop_loss,
  notify_enabled = excluded.notify_enabled;

insert into app_settings (key, value, description) values
('app_name', '"KabutoScope Free"', 'アプリ名'),
('disclaimer', '"これは投資助言ではなく、個人用の情報整理通知です。"', '免責文')
on conflict (key) do update set value = excluded.value, description = excluded.description, updated_at = now();
