import type { AlertSetting, Holding, NotificationLog, PriceSnapshot, ScoringResult, Stock } from "./types";

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
  return {
    id: row.id,
    stockId: row.stock_id,
    accountType: row.account_type,
    quantity: Number(row.quantity ?? 0),
    averagePrice: row.average_price === null ? null : Number(row.average_price),
    memo: row.memo,
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

  return row.scores_json as ScoringResult;
}
