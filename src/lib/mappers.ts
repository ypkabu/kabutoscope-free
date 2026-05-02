import { normalizeInvestmentHorizon, normalizePositionPurpose } from "./strategy";
import type { AlertSetting, Holding, NotificationLog, PriceSnapshot, RiskLimit, ScoringResult, Stock } from "./types";

export function mapStock(row: Record<string, any>): Stock {
  return {
    id: row.id,
    symbol: row.symbol,
    name: row.name,
    market: row.market,
    country: row.country,
    sector: row.sector,
    tags: Array.isArray(row.tags) ? row.tags : [],
    enabled: Boolean(row.enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapHolding(row: Record<string, any>): Holding {
  const tags = Array.isArray(row.stocks?.tags) ? row.stocks.tags : [];
  const accountType = row.account_type;
  return {
    id: row.id,
    stockId: row.stock_id,
    accountType,
    investmentHorizon: normalizeInvestmentHorizon(row.investment_horizon, accountType, tags),
    positionPurpose: normalizePositionPurpose(row.position_purpose, accountType, tags),
    quantity: Number(row.quantity ?? 0),
    averagePrice: row.average_price === null ? null : Number(row.average_price),
    memo: row.memo,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapRiskLimit(row: Record<string, any>): RiskLimit {
  return {
    id: row.id,
    stockId: row.stock_id,
    maxInvestmentAmount: row.max_investment_amount === null ? null : Number(row.max_investment_amount),
    maxPortfolioWeight: row.max_portfolio_weight === null ? null : Number(row.max_portfolio_weight),
    warningEnabled: Boolean(row.warning_enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapAlertSetting(row: Record<string, any>): AlertSetting {
  return {
    id: row.id,
    stockId: row.stock_id,
    buyBelow: row.buy_below === null ? null : Number(row.buy_below),
    takeProfit: row.take_profit === null ? null : Number(row.take_profit),
    strongTakeProfit: row.strong_take_profit === null ? null : Number(row.strong_take_profit),
    stopLoss: row.stop_loss === null ? null : Number(row.stop_loss),
    notifyEnabled: Boolean(row.notify_enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapPriceSnapshot(row: Record<string, any>): PriceSnapshot {
  return {
    id: row.id,
    stockId: row.stock_id,
    symbol: row.symbol,
    currentPrice: row.current_price === null ? null : Number(row.current_price),
    previousClose: row.previous_close === null ? null : Number(row.previous_close),
    change: row.change === null ? null : Number(row.change),
    changePercent: row.change_percent === null ? null : Number(row.change_percent),
    volume: row.volume === null ? null : Number(row.volume),
    currency: row.currency,
    marketTime: row.market_time,
    rawJson: row.raw_json,
    createdAt: row.created_at
  };
}

export function mapNotificationLog(row: Record<string, any>): NotificationLog {
  return {
    id: row.id,
    stockId: row.stock_id,
    symbol: row.symbol,
    notificationType: row.notification_type,
    currentPrice: row.current_price === null ? null : Number(row.current_price),
    message: row.message,
    nisaScore: row.nisa_score === null ? null : Number(row.nisa_score),
    tokuteiScore: row.tokutei_score === null ? null : Number(row.tokutei_score),
    buyScore: row.buy_score === null ? null : Number(row.buy_score),
    sellScore: row.sell_score === null ? null : Number(row.sell_score),
    riskScore: row.risk_score === null ? null : Number(row.risk_score),
    createdAt: row.created_at
  };
}

export function mapScoringResult(row: Record<string, any>): ScoringResult | null {
  if (!row?.scores_json) {
    return null;
  }

  const score = row.scores_json as ScoringResult;
  const neutralBlock = createFallbackScoreBlock("データ不足", 50, "古いスコア履歴のため、この項目は次回監視時に更新されます。");
  return {
    ...score,
    nisaScore: normalizeScoreBlock(score.nisaScore),
    tokuteiScore: normalizeScoreBlock(score.tokuteiScore),
    buyScore: normalizeScoreBlock(score.buyScore),
    sellScore: normalizeScoreBlock(score.sellScore),
    riskScore: normalizeScoreBlock(score.riskScore),
    confidenceScore: normalizeScoreBlock(score.confidenceScore),
    marketScore: normalizeScoreBlock(score.marketScore ?? neutralBlock),
    timingScore: normalizeScoreBlock(score.timingScore ?? neutralBlock),
    fomoRiskScore: normalizeScoreBlock(score.fomoRiskScore ?? createFallbackScoreBlock("通常", 20, "古いスコア履歴のため、次回監視時に更新されます。")),
    averagingDownRiskScore: normalizeScoreBlock(score.averagingDownRiskScore ?? createFallbackScoreBlock("通常", 20, "古いスコア履歴のため、次回監視時に更新されます。")),
    portfolioFitScore: normalizeScoreBlock(score.portfolioFitScore ?? neutralBlock),
    decisionConfidenceScore: normalizeScoreBlock(score.decisionConfidenceScore ?? score.confidenceScore ?? neutralBlock),
    doNotBuyScore: normalizeScoreBlock(score.doNotBuyScore ?? createFallbackScoreBlock("注意点あり", (score.doNotBuyReasons ?? []).length * 8, "古いスコア履歴のため、買わない理由スコアは参考値です。")),
    doNotBuyReasons: score.doNotBuyReasons ?? [],
    overallLabel: score.overallLabel ?? score.buyScore?.label ?? "監視のみ",
    finalDecision: score.finalDecision ?? score.overallLabel ?? score.buyScore?.label ?? "監視のみ",
    scenarios: score.scenarios ?? {
      bullish: "次回の監視実行後にシナリオを更新します。",
      neutral: "価格ラインとスコアを確認しながら監視します。",
      bearish: "悪材料や地合い悪化がある場合は見直し候補として確認します。"
    },
    positionProfitPercent: score.positionProfitPercent ?? null
  };
}

function normalizeScoreBlock(block: any) {
  return {
    score: Number(block?.score ?? 0),
    label: String(block?.label ?? "データ不足"),
    reasons: Array.isArray(block?.reasons) ? block.reasons : [],
    positiveFactors: Array.isArray(block?.positiveFactors) ? block.positiveFactors : [],
    negativeFactors: Array.isArray(block?.negativeFactors) ? block.negativeFactors : [],
    cautionFactors: Array.isArray(block?.cautionFactors) ? block.cautionFactors : [],
    comment: String(block?.comment ?? "データ不足のため判定信頼度は低めです。")
  };
}

function createFallbackScoreBlock(label: string, score: number, comment: string) {
  return {
    score,
    label,
    reasons: [],
    positiveFactors: [],
    negativeFactors: [],
    cautionFactors: [],
    comment
  };
}
