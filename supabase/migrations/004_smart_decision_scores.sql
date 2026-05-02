-- KabutoScope Free ルールベースAI判定強化
-- AI APIは使わず、判断メモに保存時点のスコアを残します。

alter table trade_journal add column if not exists buy_score numeric;
alter table trade_journal add column if not exists sell_score numeric;
alter table trade_journal add column if not exists risk_score numeric;
alter table trade_journal add column if not exists do_not_buy_score numeric;
alter table trade_journal add column if not exists fomo_risk_score numeric;
alter table trade_journal add column if not exists averaging_down_risk_score numeric;
alter table trade_journal add column if not exists portfolio_fit_score numeric;
alter table trade_journal add column if not exists final_decision text;

alter table scoring_results add column if not exists market_score numeric;
alter table scoring_results add column if not exists timing_score numeric;
alter table scoring_results add column if not exists fomo_risk_score numeric;
alter table scoring_results add column if not exists averaging_down_risk_score numeric;
alter table scoring_results add column if not exists portfolio_fit_score numeric;
alter table scoring_results add column if not exists decision_confidence_score numeric;
alter table scoring_results add column if not exists do_not_buy_score numeric;
alter table scoring_results add column if not exists final_decision text;

do $$
begin
  raise notice '判断メモとスコア履歴に、ルールベースAI判定用の追加スコア列を追加しました。';
end $$;
