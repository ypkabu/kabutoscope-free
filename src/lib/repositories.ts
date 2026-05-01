import { seedAlertSettings, seedHoldings, seedStocks } from "./seedData";
import { calculateStockScore } from "./scoring/scoring";
import { createBrowserSafeSupabaseClient } from "./supabase";
import type { AlertSetting, Holding, NotificationLog, PriceSnapshot, RiskLimit, ScoringResult, StockOverview } from "./types";
import { mapAlertSetting, mapHolding, mapNotificationLog, mapPriceSnapshot, mapRiskLimit, mapScoringResult, mapStock } from "./mappers";

function fallbackOverview(): StockOverview[] {
  return seedStocks.map((stock) => {
    const holding = seedHoldings.find((item) => item.stockId === stock.id) ?? null;
    const alertSetting = seedAlertSettings.find((item) => item.stockId === stock.id) ?? null;
    const scoring = calculateStockScore({
      stock,
      holding,
      alertSetting,
      quote: null,
      historicalPrices: []
    });

    return {
      stock,
      holding,
      alertSetting,
      riskLimit: null,
      latestSnapshot: null,
      scoring,
      recentNotifications: []
    };
  });
}

export async function getStockOverviews(): Promise<StockOverview[]> {
  const supabase = createBrowserSafeSupabaseClient();

  if (!supabase) {
    return fallbackOverview();
  }

  const [stocksRes, holdingsRes, alertsRes, riskLimitsRes, snapshotsRes, scoringRes, notificationsRes] = await Promise.all([
    supabase.from("stocks").select("*").order("symbol"),
    supabase.from("holdings").select("*"),
    supabase.from("alert_settings").select("*"),
    supabase.from("risk_limits").select("*"),
    supabase.from("price_snapshots").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("scoring_results").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("notification_logs").select("*").order("created_at", { ascending: false }).limit(100)
  ]);

  if (stocksRes.error) {
    console.error("株式マスター取得に失敗しました", stocksRes.error.message);
    return fallbackOverview();
  }

  const stocks = (stocksRes.data ?? []).map(mapStock);
  const holdings = new Map<string, Holding>((holdingsRes.data ?? []).map((row) => {
    const holding = mapHolding(row);
    return [holding.stockId, holding];
  }));
  const alerts = new Map<string, AlertSetting>((alertsRes.data ?? []).map((row) => {
    const alert = mapAlertSetting(row);
    return [alert.stockId, alert];
  }));
  const riskLimits = new Map<string, RiskLimit>((riskLimitsRes.data ?? []).map((row) => {
    const riskLimit = mapRiskLimit(row);
    return [riskLimit.stockId, riskLimit];
  }));
  const snapshots = new Map<string, PriceSnapshot>();
  for (const row of snapshotsRes.data ?? []) {
    const snapshot = mapPriceSnapshot(row);
    if (!snapshots.has(snapshot.stockId)) {
      snapshots.set(snapshot.stockId, snapshot);
    }
  }

  const scores = new Map<string, ScoringResult>();
  for (const row of scoringRes.data ?? []) {
    const scoring = mapScoringResult(row);
    if (scoring && !scores.has(row.stock_id)) {
      scores.set(row.stock_id, scoring);
    }
  }

  const notifications = new Map<string, NotificationLog[]>();
  for (const row of notificationsRes.data ?? []) {
    const log = mapNotificationLog(row);
    const list = notifications.get(log.stockId) ?? [];
    list.push(log);
    notifications.set(log.stockId, list);
  }

  return stocks.map((stock) => {
    const holding = holdings.get(stock.id) ?? null;
    const alertSetting = alerts.get(stock.id) ?? null;
    const riskLimit = riskLimits.get(stock.id) ?? null;
    const latestSnapshot = snapshots.get(stock.id) ?? null;
    const scoring =
      scores.get(stock.id) ??
      calculateStockScore({
        stock,
        holding,
        alertSetting,
        riskLimit,
        quote: latestSnapshot
          ? {
              symbol: stock.symbol,
              currentPrice: latestSnapshot.currentPrice,
              previousClose: latestSnapshot.previousClose,
              change: latestSnapshot.change,
              changePercent: latestSnapshot.changePercent,
              volume: latestSnapshot.volume,
              currency: latestSnapshot.currency,
              marketTime: latestSnapshot.marketTime,
              rawJson: latestSnapshot.rawJson
            }
          : null,
        historicalPrices: []
      });

    return {
      stock,
      holding,
      alertSetting,
      riskLimit,
      latestSnapshot,
      scoring,
      recentNotifications: notifications.get(stock.id) ?? []
    };
  });
}

export async function getStockOverviewBySymbol(symbol: string): Promise<StockOverview | null> {
  const overviews = await getStockOverviews();
  return overviews.find((overview) => overview.stock.symbol.toLowerCase() === symbol.toLowerCase()) ?? null;
}

export function getRankingScore(overview: StockOverview, type: string) {
  const scoring = overview.scoring;

  if (!scoring) {
    return 0;
  }

  switch (type) {
    case "nisa":
      return scoring.nisaScore.score;
    case "tokutei":
      return scoring.tokuteiScore.score;
    case "buy":
      return scoring.buyScore.score;
    case "sell":
      return scoring.sellScore.score;
    case "risk":
      return scoring.riskScore.score;
    case "short-term-sell":
      return overview.holding?.investmentHorizon === "SHORT" ? scoring.sellScore.score : 0;
    case "long-term-review":
      return overview.holding?.investmentHorizon === "LONG" ? Math.max(scoring.sellScore.score, scoring.riskScore.score) : 0;
    default:
      return 0;
  }
}

export async function getRankedOverviews(type: string) {
  const overviews = await getStockOverviews();
  return overviews.sort((a, b) => getRankingScore(b, type) - getRankingScore(a, type));
}
