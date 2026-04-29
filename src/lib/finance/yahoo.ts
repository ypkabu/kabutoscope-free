import YahooFinance from "yahoo-finance2";
import type { HistoricalPrice, QuoteResult } from "../types";

const MANUAL_SYMBOLS = new Set(["SP500_FUND"]);
const yahooFinance = new YahooFinance();

export async function getQuote(symbol: string): Promise<QuoteResult> {
  if (MANUAL_SYMBOLS.has(symbol)) {
    return {
      symbol,
      currentPrice: null,
      previousClose: null,
      change: null,
      changePercent: null,
      volume: null,
      currency: null,
      marketTime: null,
      rawJson: { skipped: true, reason: "初版では手動監視のためYahoo Finance取得対象外です。" },
      error: "手動監視銘柄です"
    };
  }

  try {
    const quote = (await yahooFinance.quote(symbol)) as any;
    const currentPrice = numberOrNull(quote.regularMarketPrice ?? quote.postMarketPrice ?? quote.preMarketPrice);
    const previousClose = numberOrNull(quote.regularMarketPreviousClose);
    const change = numberOrNull(quote.regularMarketChange);
    const changePercent = numberOrNull(quote.regularMarketChangePercent);

    return {
      symbol,
      currentPrice,
      previousClose,
      change,
      changePercent,
      volume: numberOrNull(quote.regularMarketVolume),
      currency: quote.currency ?? null,
      marketTime: normalizeMarketTime(quote.regularMarketTime),
      rawJson: quote
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`株価取得に失敗しました: ${symbol} - ${message}`);
    return {
      symbol,
      currentPrice: null,
      previousClose: null,
      change: null,
      changePercent: null,
      volume: null,
      currency: null,
      marketTime: null,
      rawJson: { error: message },
      error: message
    };
  }
}

export async function getHistoricalPrices(symbol: string, range = "1y"): Promise<HistoricalPrice[]> {
  if (MANUAL_SYMBOLS.has(symbol)) {
    return [];
  }

  const period1 = getPeriodStart(range);

  try {
    const period2 = Math.floor(Date.now() / 1000);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${Math.floor(period1.getTime() / 1000)}&period2=${period2}&interval=1d&events=history`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Yahoo Finance chart API error: ${response.status}`);
    }

    const json = (await response.json()) as any;
    const result = json.chart?.result?.[0];
    const timestamps: number[] = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0] ?? {};
    const rows = timestamps.map((timestamp, index) => ({
      date: new Date(timestamp * 1000),
      open: quote.open?.[index],
      high: quote.high?.[index],
      low: quote.low?.[index],
      close: quote.close?.[index],
      volume: quote.volume?.[index]
    }));

    return rows
      .map((row) => ({
        date: new Date(row.date),
        open: numberOrNull(row.open),
        high: numberOrNull(row.high),
        low: numberOrNull(row.low),
        close: numberOrNull(row.close),
        volume: numberOrNull(row.volume)
      }))
      .filter((row) => row.close !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`履歴価格取得に失敗しました: ${symbol} - ${message}`);
    return [];
  }
}

function getPeriodStart(range: string) {
  const now = new Date();
  const days = range === "6mo" ? 190 : range === "3mo" ? 100 : range === "2y" ? 740 : 380;
  now.setDate(now.getDate() - days);
  return now;
}

function normalizeMarketTime(value: unknown) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
