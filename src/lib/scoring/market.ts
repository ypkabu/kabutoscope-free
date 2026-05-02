import { marketSymbols } from "@/config/scoringWeights";
import { getHistoricalPrices } from "../finance/yahoo";
import type { HistoricalPrice, MarketContext } from "../types";

export async function getMarketContext(): Promise<MarketContext> {
  const symbols = [...marketSymbols.jp, ...marketSymbols.us];
  const results = await Promise.all(symbols.map((symbol) => summarizeSymbol(symbol)));
  const available = results.filter((item) => item.available);
  const positiveFactors: string[] = [];
  const negativeFactors: string[] = [];
  const cautionFactors: string[] = [];
  let score = 55;

  for (const result of available) {
    if (result.aboveMa5) {
      score += 2;
      positiveFactors.push(`${result.symbol} が5日線を上回る`);
    } else {
      score -= 2;
      negativeFactors.push(`${result.symbol} が5日線を下回る`);
    }
    if (result.aboveMa25) {
      score += 3;
      positiveFactors.push(`${result.symbol} が25日線を上回る`);
    } else {
      score -= 4;
      negativeFactors.push(`${result.symbol} が25日線を下回る`);
    }
    if (result.return5d !== null && result.return5d <= -3) {
      score -= 5;
      cautionFactors.push(`${result.symbol} が5日で大きめに下落`);
    }
  }

  if (available.length === 0) {
    cautionFactors.push("相場指数を取得できなかったため中立扱い");
  }

  const jpWeak = results.filter((item) => marketSymbols.jp.includes(item.symbol)).some((item) => item.available && !item.aboveMa25 && (item.return5d ?? 0) < -2);
  const usWeak = results.filter((item) => marketSymbols.us.includes(item.symbol)).some((item) => item.available && !item.aboveMa25 && (item.return5d ?? 0) < -2);
  const semiconductorWeak = results
    .filter((item) => ["SMH", "SOXX"].includes(item.symbol))
    .some((item) => item.available && (!item.aboveMa25 || (item.return5d ?? 0) < -2));

  return {
    score: clamp(score),
    label: score >= 70 ? "相場環境良好" : score >= 45 ? "相場環境ふつう" : "地合い悪化注意",
    positiveFactors: unique(positiveFactors).slice(0, 8),
    negativeFactors: unique(negativeFactors).slice(0, 8),
    cautionFactors: unique(cautionFactors).slice(0, 8),
    comment: buildComment(score, semiconductorWeak),
    semiconductorWeak,
    jpWeak,
    usWeak,
    generatedAt: new Date().toISOString()
  };
}

async function summarizeSymbol(symbol: string) {
  try {
    const prices = await getHistoricalPrices(symbol, "3mo");
    const closes = prices.map((price) => price.close).filter((value): value is number => value !== null);
    const current = closes.at(-1) ?? null;
    const ma5 = average(closes.slice(-5));
    const ma25 = average(closes.slice(-25));
    return {
      symbol,
      available: current !== null,
      aboveMa5: current !== null && ma5 !== null ? current >= ma5 : false,
      aboveMa25: current !== null && ma25 !== null ? current >= ma25 : false,
      return5d: calculateReturn(prices, 5)
    };
  } catch (error) {
    console.error(`相場指数の取得に失敗しました: ${symbol} - ${error instanceof Error ? error.message : String(error)}`);
    return {
      symbol,
      available: false,
      aboveMa5: false,
      aboveMa25: false,
      return5d: null
    };
  }
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateReturn(prices: HistoricalPrice[], days: number) {
  const closes = prices.map((price) => price.close).filter((value): value is number => value !== null);
  const current = closes.at(-1);
  const past = closes.at(-(days + 1));
  if (!current || !past) return null;
  return ((current - past) / past) * 100;
}

function buildComment(score: number, semiconductorWeak: boolean) {
  if (semiconductorWeak) return "半導体指数が弱いため、半導体銘柄の買い判定を慎重にしています。";
  if (score >= 70) return "主要指数が比較的強く、相場環境は良好寄りです。";
  if (score < 45) return "主要指数が弱く、地合い悪化に注意する状態です。";
  return "相場環境は中立です。銘柄ごとのラインとリスクを優先して確認します。";
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
