import { createBrowserSafeSupabaseClient, createServiceSupabaseClient } from "./supabase";
import type { PortfolioSettings, StockOverview, TargetPortfolio } from "./types";

export const defaultPortfolioSettings: PortfolioSettings = {
  totalBudget: 130000,
  cashAmount: 130000,
  rakutenNisaBudget: 65000,
  sbiTokuteiBudget: 50000,
  minimumCashRatio: 0.1,
  warningCashRatio: 0.2
};

export async function getPortfolioSettings(): Promise<PortfolioSettings> {
  const supabase = createBrowserSafeSupabaseClient();
  if (!supabase) return defaultPortfolioSettings;
  const { data, error } = await supabase.from("portfolio_settings").select("*").eq("id", 1).maybeSingle();
  if (error || !data) return defaultPortfolioSettings;
  return {
    totalBudget: Number(data.total_budget ?? defaultPortfolioSettings.totalBudget),
    cashAmount: Number(data.cash_amount ?? defaultPortfolioSettings.cashAmount),
    rakutenNisaBudget: Number(data.rakuten_nisa_budget ?? defaultPortfolioSettings.rakutenNisaBudget),
    sbiTokuteiBudget: Number(data.sbi_tokutei_budget ?? defaultPortfolioSettings.sbiTokuteiBudget),
    minimumCashRatio: Number(data.minimum_cash_ratio ?? defaultPortfolioSettings.minimumCashRatio),
    warningCashRatio: Number(data.warning_cash_ratio ?? defaultPortfolioSettings.warningCashRatio)
  };
}

export async function savePortfolioSettings(settings: PortfolioSettings, memo = "画面から資金設定を保存") {
  const supabase = createServiceSupabaseClient();
  if (!supabase) throw new Error("Supabaseのサービスロール設定がありません。");
  const row = {
    id: 1,
    total_budget: settings.totalBudget,
    cash_amount: settings.cashAmount,
    rakuten_nisa_budget: settings.rakutenNisaBudget,
    sbi_tokutei_budget: settings.sbiTokuteiBudget,
    minimum_cash_ratio: settings.minimumCashRatio,
    warning_cash_ratio: settings.warningCashRatio
  };
  const { error } = await supabase.from("portfolio_settings").upsert(row, { onConflict: "id" });
  if (error) throw error;
  const { id: _id, ...historyRow } = row;
  const { error: historyError } = await supabase.from("portfolio_settings_history").insert({ ...historyRow, memo });
  if (historyError) throw historyError;
}

export async function getTargetPortfolio(): Promise<TargetPortfolio[]> {
  const supabase = createBrowserSafeSupabaseClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("target_portfolio").select("*").order("priority");
  if (error) return [];
  return (data ?? []).map((row) => ({
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    targetAccountType: row.target_account_type,
    targetQuantity: row.target_quantity === null ? null : Number(row.target_quantity),
    targetAmount: row.target_amount === null ? null : Number(row.target_amount),
    priority: Number(row.priority ?? 999),
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

export function calculateCashStatus(settings: PortfolioSettings) {
  const cashRatio = settings.totalBudget > 0 ? settings.cashAmount / settings.totalBudget : 0;
  const investedAmount = Math.max(settings.totalBudget - settings.cashAmount, 0);
  const status = cashRatio >= settings.warningCashRatio ? "安全" : cashRatio >= settings.minimumCashRatio ? "注意" : "危険";
  return {
    cashRatio,
    investedAmount,
    rakutenNisaRatio: settings.totalBudget > 0 ? settings.rakutenNisaBudget / settings.totalBudget : 0,
    sbiTokuteiRatio: settings.totalBudget > 0 ? settings.sbiTokuteiBudget / settings.totalBudget : 0,
    status
  };
}

export function calculateTagExposure(overviews: StockOverview[], settings: PortfolioSettings) {
  const tagValues = new Map<string, number>();
  let totalValue = 0;
  for (const row of overviews) {
    const quantity = row.holding?.quantity ?? 0;
    if (quantity <= 0) continue;
    const price = row.latestSnapshot?.currentPrice ?? row.holding?.averagePrice ?? 0;
    const value = price * quantity;
    if (value <= 0) continue;
    totalValue += value;
    for (const tag of row.stock.tags) {
      tagValues.set(tag, (tagValues.get(tag) ?? 0) + value);
    }
  }

  const entries = Array.from(tagValues.entries())
    .map(([tag, value]) => ({ tag, value, ratio: totalValue > 0 ? value / totalValue : 0 }))
    .sort((a, b) => b.value - a.value);
  const semiconductorAi = (tagValues.get("semiconductor") ?? 0) + (tagValues.get("ai") ?? 0);
  const defensive = (tagValues.get("defensive") ?? 0) + (tagValues.get("telecom") ?? 0) + (tagValues.get("infrastructure") ?? 0);
  const cashRatio = settings.totalBudget > 0 ? settings.cashAmount / settings.totalBudget : 0;
  const warnings: string[] = [];
  if (totalValue > 0 && semiconductorAi / totalValue >= 0.4) warnings.push(`半導体・AI関連が${Math.round((semiconductorAi / totalValue) * 100)}%です。短期下落時にポートフォリオ全体が同時に下がる可能性があります。`);
  if (totalValue > 0 && (tagValues.get("high_volatility") ?? 0) / totalValue >= 0.3) warnings.push("高ボラティリティ銘柄が多めです。値動きの大きさに注意してください。");
  if (totalValue > 0 && defensive / totalValue >= 0.5) warnings.push("守り寄りの構成です。安定性を重視する一方、成長テーマの比率は控えめです。");
  if (totalValue > 0 && (tagValues.get("sp500") ?? 0) / totalValue >= 0.3) warnings.push("インデックス土台あり。個別株のブレを抑える役割として監視できます。");
  if (cashRatio < 0.1) warnings.push(`現金比率が${Math.round(cashRatio * 100)}%です。下落時に追加購入する余力が少ないため、新規購入は慎重に検討してください。`);

  return { totalValue, entries, warnings };
}
