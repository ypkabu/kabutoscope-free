import type { SupabaseClient } from "@supabase/supabase-js";
import { getHistoricalPrices, getQuote } from "../finance/yahoo";
import { mapAlertSetting, mapHolding, mapRiskLimit, mapStock } from "../mappers";
import { calculateStockScore } from "../scoring/scoring";
import { investmentHorizonLabels, positionPurposeLabels } from "../strategy";
import { createServiceSupabaseClient } from "../supabase";
import type { AlertSetting, Holding, NotificationType, QuoteResult, RiskLimit, ScoringResult, Stock } from "../types";

type MonitorSummary = {
  checked: number;
  snapshotsSaved: number;
  scoreSaved: number;
  notificationsSent: number;
  errors: string[];
};

export async function runMonitoring(): Promise<MonitorSummary> {
  const summary: MonitorSummary = {
    checked: 0,
    snapshotsSaved: 0,
    scoreSaved: 0,
    notificationsSent: 0,
    errors: []
  };

  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    throw new Error("Supabaseのサービスロール設定がありません。.envまたはGitHub Secretsを確認してください。");
  }

  console.log("【Step 2】株価取得とスナップショット保存を開始します。確認方法: Supabaseのprice_snapshotsに行が追加されることを確認します。");
  console.log("【Step 3】テクニカル指標とルールベーススコアリングを実行します。確認方法: scoring_resultsにscores_jsonが保存されることを確認します。");
  console.log("【Step 5】Discord通知条件を確認します。確認方法: notification_logsとDiscordチャンネルの通知を確認します。");

  const { data: stockRows, error: stockError } = await supabase.from("stocks").select("*").eq("enabled", true).order("symbol");

  if (stockError) {
    throw new Error(`有効銘柄の取得に失敗しました: ${stockError.message}`);
  }

  for (const stockRow of stockRows ?? []) {
    const stock = mapStock(stockRow);
    summary.checked += 1;

    try {
      const [holding, alertSetting, riskLimit] = await Promise.all([fetchHolding(supabase, stock.id), fetchAlertSetting(supabase, stock.id), fetchRiskLimit(supabase, stock.id)]);
      const quote = await getQuote(stock.symbol);
      const historicalPrices = await getHistoricalPrices(stock.symbol, "1y");

      await saveSnapshot(supabase, stock, quote);
      summary.snapshotsSaved += 1;

      const scoring = calculateStockScore({
        stock,
        holding,
        alertSetting,
        riskLimit,
        quote,
        historicalPrices
      });

      await saveScoringResult(supabase, stock, scoring);
      summary.scoreSaved += 1;

      const sentCount = await checkAndNotify(supabase, stock, holding, alertSetting, quote, scoring);
      summary.notificationsSent += sentCount;

      console.log(`監視完了: ${stock.name} ${stock.symbol} / 通知 ${sentCount}件`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.errors.push(`${stock.symbol}: ${message}`);
      console.error(`監視処理を継続します: ${stock.symbol} - ${message}`);
    }
  }

  console.log(`監視サマリー: 確認${summary.checked}件、スナップショット${summary.snapshotsSaved}件、スコア${summary.scoreSaved}件、通知${summary.notificationsSent}件`);
  if (summary.errors.length > 0) {
    console.log("データ取得エラー:");
    for (const error of summary.errors) console.log(`- ${error}`);
  }

  return summary;
}

async function fetchHolding(supabase: SupabaseClient, stockId: string): Promise<Holding | null> {
  const { data, error } = await supabase.from("holdings").select("*").eq("stock_id", stockId).maybeSingle();
  if (error) {
    console.error(`保有情報の取得に失敗しました: ${stockId} - ${error.message}`);
    return null;
  }
  return data ? mapHolding(data) : null;
}

async function fetchAlertSetting(supabase: SupabaseClient, stockId: string): Promise<AlertSetting | null> {
  const { data, error } = await supabase.from("alert_settings").select("*").eq("stock_id", stockId).maybeSingle();
  if (error) {
    console.error(`アラート設定の取得に失敗しました: ${stockId} - ${error.message}`);
    return null;
  }
  return data ? mapAlertSetting(data) : null;
}

async function fetchRiskLimit(supabase: SupabaseClient, stockId: string): Promise<RiskLimit | null> {
  const { data, error } = await supabase.from("risk_limits").select("*").eq("stock_id", stockId).maybeSingle();
  if (error) {
    console.error(`リスク上限の取得に失敗しました: ${stockId} - ${error.message}`);
    return null;
  }
  return data ? mapRiskLimit(data) : null;
}

async function saveSnapshot(supabase: SupabaseClient, stock: Stock, quote: QuoteResult) {
  const { error } = await supabase.from("price_snapshots").insert({
    stock_id: stock.id,
    symbol: stock.symbol,
    current_price: quote.currentPrice,
    previous_close: quote.previousClose,
    change: quote.change,
    change_percent: quote.changePercent,
    volume: quote.volume,
    currency: quote.currency,
    market_time: quote.marketTime,
    raw_json: quote.rawJson
  });

  if (error) {
    throw new Error(`価格スナップショット保存に失敗しました: ${error.message}`);
  }
}

async function saveScoringResult(supabase: SupabaseClient, stock: Stock, scoring: ScoringResult) {
  const { error } = await supabase.from("scoring_results").insert({
    stock_id: stock.id,
    symbol: stock.symbol,
    nisa_score: scoring.nisaScore.score,
    tokutei_score: scoring.tokuteiScore.score,
    buy_score: scoring.buyScore.score,
    sell_score: scoring.sellScore.score,
    risk_score: scoring.riskScore.score,
    confidence_score: scoring.confidenceScore.score,
    scores_json: scoring
  });

  if (error) {
    throw new Error(`スコア保存に失敗しました: ${error.message}`);
  }
}

async function checkAndNotify(
  supabase: SupabaseClient,
  stock: Stock,
  holding: Holding | null,
  alertSetting: AlertSetting | null,
  quote: QuoteResult,
  scoring: ScoringResult
) {
  if (!alertSetting?.notifyEnabled || quote.currentPrice === null) {
    return 0;
  }

  const currentPrice = quote.currentPrice;
  const notificationTypes: NotificationType[] = [];

  if (alertSetting.buyBelow !== null && currentPrice <= alertSetting.buyBelow) notificationTypes.push("BUY_LINE");
  if (scoring.buyScore.score >= 80) notificationTypes.push("BUY_SCORE");
  if (alertSetting.takeProfit !== null && currentPrice >= alertSetting.takeProfit) notificationTypes.push("TAKE_PROFIT");
  if (alertSetting.strongTakeProfit !== null && currentPrice >= alertSetting.strongTakeProfit) notificationTypes.push("STRONG_TAKE_PROFIT");
  if (alertSetting.stopLoss !== null && currentPrice <= alertSetting.stopLoss) notificationTypes.push("STOP_LOSS");
  if (scoring.riskScore.score >= 75) notificationTypes.push("HIGH_RISK");
  if (scoring.sellScore.score >= 75) notificationTypes.push("SELL_SCORE");

  let sent = 0;
  for (const notificationType of Array.from(new Set(notificationTypes))) {
    const alreadySent = await hasNotificationToday(supabase, stock.id, notificationType);
    if (alreadySent) {
      console.log(`重複通知を抑止しました: ${stock.symbol} ${notificationType}`);
      continue;
    }

    const message = buildDiscordMessage(stock, holding, alertSetting, quote, scoring, notificationType);
    await sendDiscordMessage(message);
    await saveNotificationLog(supabase, stock, notificationType, currentPrice, message, scoring);
    sent += 1;
  }

  return sent;
}

async function hasNotificationToday(supabase: SupabaseClient, stockId: string, notificationType: NotificationType) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("notification_logs")
    .select("id")
    .eq("stock_id", stockId)
    .eq("notification_type", notificationType)
    .gte("created_at", start.toISOString())
    .limit(1);

  if (error) {
    console.error(`重複通知チェックに失敗しました: ${error.message}`);
    return false;
  }

  return Boolean(data && data.length > 0);
}

async function saveNotificationLog(
  supabase: SupabaseClient,
  stock: Stock,
  notificationType: NotificationType,
  currentPrice: number,
  message: string,
  scoring: ScoringResult
) {
  const { error } = await supabase.from("notification_logs").insert({
    stock_id: stock.id,
    symbol: stock.symbol,
    notification_type: notificationType,
    current_price: currentPrice,
    message,
    nisa_score: scoring.nisaScore.score,
    tokutei_score: scoring.tokuteiScore.score,
    buy_score: scoring.buyScore.score,
    sell_score: scoring.sellScore.score,
    risk_score: scoring.riskScore.score
  });

  if (error) {
    throw new Error(`通知ログ保存に失敗しました: ${error.message}`);
  }
}

async function sendDiscordMessage(message: string) {
  if (process.env.ENABLE_NOTIFICATIONS !== "true") {
    console.log("通知は無効です。ENABLE_NOTIFICATIONS=trueで有効化できます。");
    return;
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log("DISCORD_WEBHOOK_URLが未設定のためDiscord送信をスキップしました。");
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message })
  });

  if (!response.ok) {
    throw new Error(`Discord通知に失敗しました: ${response.status} ${await response.text()}`);
  }
}

function buildDiscordMessage(
  stock: Stock,
  holding: Holding | null,
  alertSetting: AlertSetting,
  quote: QuoteResult,
  scoring: ScoringResult,
  notificationType: NotificationType
) {
  const title = notificationTitle(notificationType);
  const priceSuffix = quote.currency === "JPY" || stock.country === "JP" ? "円" : quote.currency ?? "";
  const url = process.env.APP_BASE_URL ? `${process.env.APP_BASE_URL}/stocks/${encodeURIComponent(stock.symbol)}` : "";
  const reasons = [
    ...scoring.buyScore.positiveFactors.slice(0, 2),
    ...scoring.sellScore.positiveFactors.slice(0, 2),
    ...scoring.riskScore.positiveFactors.slice(0, 2)
  ].slice(0, 5);

  return [
    `【${title}】${stock.name} ${stock.symbol}`,
    "",
    `現在値：${formatPrice(quote.currentPrice)}${priceSuffix}`,
    `買いライン：${formatPrice(alertSetting.buyBelow)}${priceSuffix}`,
    `利確ライン：${formatPrice(alertSetting.takeProfit)}${priceSuffix}`,
    `強め利確ライン：${formatPrice(alertSetting.strongTakeProfit)}${priceSuffix}`,
    `損切りライン：${formatPrice(alertSetting.stopLoss)}${priceSuffix}`,
    `口座区分：${holding?.accountType ?? "WATCH_ONLY"}`,
    `投資期間：${investmentHorizonLabels[holding?.investmentHorizon ?? "MEDIUM"]}`,
    `目的：${positionPurposeLabels[holding?.positionPurpose ?? "WATCH"]}`,
    `平均取得単価：${formatPrice(holding?.averagePrice)}${priceSuffix}`,
    `含み損益：${scoring.positionProfitPercent === null ? "未計算" : `${scoring.positionProfitPercent >= 0 ? "+" : ""}${scoring.positionProfitPercent.toFixed(1)}%`}`,
    "",
    `NISA向き：${scoring.nisaScore.score}/100`,
    `特定口座向き：${scoring.tokuteiScore.score}/100`,
    `買い候補：${scoring.buyScore.score}/100`,
    `売り候補：${scoring.sellScore.score}/100`,
    `危険度：${scoring.riskScore.score}/100`,
    `判定信頼度：${scoring.confidenceScore.score}/100`,
    `総合判定：${scoring.overallLabel}`,
    "",
    "理由：",
    ...(reasons.length > 0 ? reasons.map((reason) => `・${reason}`) : ["・判定材料が不足しているため、手動確認を優先してください"]),
    "",
    ...(scoring.doNotBuyReasons.length > 0 ? ["買わない理由:", ...scoring.doNotBuyReasons.map((reason) => `・${reason}`), ""] : []),
    `コメント：${mainComment(scoring)}`,
    "",
    "注意：これは投資助言ではなく、自分用の情報整理通知です。自動売買は行いません。",
    url ? `詳細：${url}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function notificationTitle(type: NotificationType) {
  const map: Record<NotificationType, string> = {
    BUY_LINE: "買いライン到達",
    BUY_SCORE: "買い候補",
    TAKE_PROFIT: "利確ライン到達",
    STRONG_TAKE_PROFIT: "強め利確候補",
    STOP_LOSS: "損切り検討",
    HIGH_RISK: "危険度高め",
    SELL_SCORE: "売り候補"
  };
  return map[type];
}

function mainComment(scoring: ScoringResult) {
  if (scoring.riskScore.score >= 75) return scoring.riskScore.comment;
  if (scoring.sellScore.score >= 75) return scoring.sellScore.comment;
  if (scoring.buyScore.score >= 75) return scoring.buyScore.comment;
  if (scoring.nisaScore.score >= scoring.tokuteiScore.score) return scoring.nisaScore.comment;
  return scoring.tokuteiScore.comment;
}

function formatPrice(value: number | null | undefined) {
  return value === null || value === undefined ? "未設定" : new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }).format(value);
}
