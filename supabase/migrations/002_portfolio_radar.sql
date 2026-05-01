-- KabutoScope Free 追加改善スキーマ
-- 投資助言ではなく、自分用の情報整理・振り返り用のデータを保存します。

alter table holdings add column if not exists investment_horizon text;
alter table holdings add column if not exists position_purpose text;

alter table holdings drop constraint if exists holdings_investment_horizon_check;
alter table holdings add constraint holdings_investment_horizon_check check (investment_horizon in ('SHORT', 'MEDIUM', 'LONG'));

alter table holdings drop constraint if exists holdings_position_purpose_check;
alter table holdings add constraint holdings_position_purpose_check check (position_purpose in ('CORE', 'INCOME', 'GROWTH', 'THEME', 'REBOUND', 'WATCH'));

update holdings h
set investment_horizon = case
  when s.tags ?| array['long_term','dividend','shareholder_benefit','defensive','infrastructure','sp500','index'] then 'LONG'
  when s.tags ?| array['semiconductor','ai','high_volatility','defense','datacenter'] and h.account_type = 'TOKUTEI' then 'SHORT'
  when s.tags ?| array['semiconductor','ai','high_volatility','defense','datacenter'] and h.account_type = 'WATCH_ONLY' then 'MEDIUM'
  when h.account_type = 'NISA' then 'LONG'
  when h.account_type = 'TOKUTEI' then 'SHORT'
  when h.account_type = 'WATCH_ONLY' then 'MEDIUM'
  else 'MEDIUM'
end
from stocks s
where h.stock_id = s.id
  and h.investment_horizon is null;

update holdings h
set position_purpose = case
  when s.tags ?| array['sp500','index'] then 'CORE'
  when s.tags ?| array['dividend','shareholder_benefit'] then 'INCOME'
  when s.tags ?| array['semiconductor','ai','defense','datacenter','space'] then 'THEME'
  when s.tags ?| array['game','ip','growth','software'] then 'GROWTH'
  when h.account_type = 'WATCH_ONLY' then 'WATCH'
  else 'WATCH'
end
from stocks s
where h.stock_id = s.id
  and h.position_purpose is null;

do $$
begin
  raise notice '既存保有データに investment_horizon / position_purpose を自動補完しました。';
end $$;

create table if not exists risk_limits (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid not null references stocks(id) on delete cascade,
  max_investment_amount numeric,
  max_portfolio_weight numeric,
  warning_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(stock_id)
);

create table if not exists target_portfolio (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text not null,
  target_account_type text not null check (target_account_type in ('NISA', 'TOKUTEI', 'CASH')),
  target_quantity numeric,
  target_amount numeric,
  priority integer not null default 999,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists portfolio_settings (
  id integer primary key default 1 check (id = 1),
  total_budget numeric not null default 130000,
  cash_amount numeric not null default 130000,
  rakuten_nisa_budget numeric not null default 65000,
  sbi_tokutei_budget numeric not null default 50000,
  minimum_cash_ratio numeric not null default 0.10,
  warning_cash_ratio numeric not null default 0.20,
  updated_at timestamptz not null default now()
);

create table if not exists portfolio_settings_history (
  id uuid primary key default gen_random_uuid(),
  total_budget numeric not null,
  cash_amount numeric not null,
  rakuten_nisa_budget numeric not null,
  sbi_tokutei_budget numeric not null,
  minimum_cash_ratio numeric not null,
  warning_cash_ratio numeric not null,
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists trade_journal (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid references stocks(id) on delete set null,
  symbol text not null,
  action_type text not null check (action_type in ('BUY_PLAN','BUY','SELL_PLAN','SELL','HOLD','REVIEW')),
  account_type text not null check (account_type in ('NISA','TOKUTEI')),
  price numeric,
  quantity numeric,
  reason text,
  expected_scenario text,
  exit_condition text,
  take_profit_condition text,
  stop_loss_condition text,
  emotion_tag text check (emotion_tag in ('calm','fear_of_missing_out','panic','planned','revenge_trade','uncertain')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stock_events (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid references stocks(id) on delete cascade,
  symbol text not null,
  event_type text not null check (event_type in ('EARNINGS','DIVIDEND','SHAREHOLDER_BENEFIT','PRODUCT_EVENT','OTHER')),
  event_date date not null,
  title text not null,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists holding_strategy_history (
  id uuid primary key default gen_random_uuid(),
  stock_id uuid references stocks(id) on delete cascade,
  symbol text not null,
  previous_investment_horizon text,
  new_investment_horizon text,
  previous_position_purpose text,
  new_position_purpose text,
  reason text,
  created_at timestamptz not null default now()
);

drop trigger if exists set_risk_limits_updated_at on risk_limits;
create trigger set_risk_limits_updated_at before update on risk_limits for each row execute function set_updated_at();

drop trigger if exists set_target_portfolio_updated_at on target_portfolio;
create trigger set_target_portfolio_updated_at before update on target_portfolio for each row execute function set_updated_at();

drop trigger if exists set_portfolio_settings_updated_at on portfolio_settings;
create trigger set_portfolio_settings_updated_at before update on portfolio_settings for each row execute function set_updated_at();

drop trigger if exists set_trade_journal_updated_at on trade_journal;
create trigger set_trade_journal_updated_at before update on trade_journal for each row execute function set_updated_at();

drop trigger if exists set_stock_events_updated_at on stock_events;
create trigger set_stock_events_updated_at before update on stock_events for each row execute function set_updated_at();

alter table risk_limits enable row level security;
alter table target_portfolio enable row level security;
alter table portfolio_settings enable row level security;
alter table portfolio_settings_history enable row level security;
alter table trade_journal enable row level security;
alter table stock_events enable row level security;
alter table holding_strategy_history enable row level security;

drop policy if exists "public read risk limits" on risk_limits;
create policy "public read risk limits" on risk_limits for select using (true);
drop policy if exists "public read target portfolio" on target_portfolio;
create policy "public read target portfolio" on target_portfolio for select using (true);
drop policy if exists "public read portfolio settings" on portfolio_settings;
create policy "public read portfolio settings" on portfolio_settings for select using (true);
drop policy if exists "public read portfolio settings history" on portfolio_settings_history;
create policy "public read portfolio settings history" on portfolio_settings_history for select using (true);
drop policy if exists "public read trade journal" on trade_journal;
create policy "public read trade journal" on trade_journal for select using (true);
drop policy if exists "public read stock events" on stock_events;
create policy "public read stock events" on stock_events for select using (true);
drop policy if exists "public read holding strategy history" on holding_strategy_history;
create policy "public read holding strategy history" on holding_strategy_history for select using (true);

insert into portfolio_settings (id, total_budget, cash_amount, rakuten_nisa_budget, sbi_tokutei_budget, minimum_cash_ratio, warning_cash_ratio)
values (1, 130000, 130000, 65000, 50000, 0.10, 0.20)
on conflict (id) do nothing;

insert into risk_limits (stock_id, max_investment_amount, max_portfolio_weight, warning_enabled)
select id,
  case symbol
    when '6526.T' then 30000
    when '6857.T' then 30000
    when '7013.T' then 20000
    when '7974.T' then 16000
    when '9434.T' then 25000
    when '9432.T' then 20000
    else null
  end,
  case symbol
    when '6526.T' then 0.25
    when '6857.T' then 0.25
    when '7013.T' then 0.15
    when '7974.T' then 0.15
    when '9434.T' then 0.20
    when '9432.T' then 0.15
    else null
  end,
  true
from stocks
where symbol in ('6526.T','6857.T','7013.T','7974.T','9434.T','9432.T')
on conflict (stock_id) do update set
  max_investment_amount = excluded.max_investment_amount,
  max_portfolio_weight = excluded.max_portfolio_weight,
  warning_enabled = excluded.warning_enabled;

insert into target_portfolio (symbol, name, target_account_type, target_quantity, target_amount, priority, memo) values
('SP500_FUND', 'eMAXIS Slim 米国株式 S&P500', 'NISA', null, 20000, 1, '長期の土台'),
('9434.T', 'ソフトバンク', 'NISA', 100, null, 2, '配当とPayPay優待目的'),
('9432.T', 'NTT', 'NISA', 100, null, 3, '通信インフラ・配当安定枠'),
('7974.T', '任天堂', 'NISA', 1, null, 4, 'ゲームIP長期成長枠'),
('6526.T', 'ソシオネクスト', 'TOKUTEI', 10, null, 5, '半導体短期・中期枠'),
('7013.T', 'IHI', 'TOKUTEI', 5, null, 6, '防衛・宇宙・重工テーマ枠'),
('CASH', '現金', 'CASH', null, 10000, 7, '暴落時の追加購入用')
on conflict (symbol) do update set
  name = excluded.name,
  target_account_type = excluded.target_account_type,
  target_quantity = excluded.target_quantity,
  target_amount = excluded.target_amount,
  priority = excluded.priority,
  memo = excluded.memo;

insert into stock_events (stock_id, symbol, event_type, event_date, title, memo)
select id, symbol, 'EARNINGS', current_date + interval '30 days', name || ' 決算予定', '手動で日付を調整してください。'
from stocks
where symbol in ('7974.T', '7013.T', '7011.T')
on conflict do nothing;
