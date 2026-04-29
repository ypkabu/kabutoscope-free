import type { AlertSetting, HistoricalPrice, QuoteResult, TechnicalIndicators } from "../types";

export function calculateIndicators(
  quote: QuoteResult | null,
  historicalPrices: HistoricalPrice[],
  alertSetting: AlertSetting | null
): TechnicalIndicators {
  const closes = historicalPrices.map((row) => row.close).filter((value): value is number => value !== null);
  const highs = historicalPrices.map((row) => row.high).filter((value): value is number => value !== null);
  const lows = historicalPrices.map((row) => row.low).filter((value): value is number => value !== null);
  const volumes = historicalPrices.map((row) => row.volume).filter((value): value is number => value !== null);
  const currentPrice = quote?.currentPrice ?? last(closes);

  return {
    currentPrice,
    ma5: movingAverage(closes, 5),
    ma25: movingAverage(closes, 25),
    ma75: movingAverage(closes, 75),
    return5d: returnFrom(closes, currentPrice, 5),
    return20d: returnFrom(closes, currentPrice, 20),
    drawdownFrom52WeekHigh: drawdown(currentPrice, highs),
    riseFrom52WeekLow: riseFromLow(currentPrice, lows),
    volumeRatio: volumeRatio(quote?.volume ?? last(volumes), volumes, 20),
    volatility20d: volatility(closes, 20),
    distanceToBuyBelow: distance(currentPrice, alertSetting?.buyBelow ?? null),
    distanceToTakeProfit: distance(currentPrice, alertSetting?.takeProfit ?? null),
    distanceToStrongTakeProfit: distance(currentPrice, alertSetting?.strongTakeProfit ?? null),
    distanceToStopLoss: distance(currentPrice, alertSetting?.stopLoss ?? null)
  };
}

function movingAverage(values: number[], period: number) {
  if (values.length < period) {
    return null;
  }

  const slice = values.slice(-period);
  return slice.reduce((sum, value) => sum + value, 0) / period;
}

function returnFrom(closes: number[], currentPrice: number | null | undefined, days: number) {
  if (!currentPrice || closes.length <= days) {
    return null;
  }

  const base = closes[closes.length - 1 - days];
  if (!base) {
    return null;
  }

  return ((currentPrice - base) / base) * 100;
}

function drawdown(currentPrice: number | null | undefined, highs: number[]) {
  if (!currentPrice || highs.length === 0) {
    return null;
  }

  const high = Math.max(...highs.slice(-252));
  return high > 0 ? ((currentPrice - high) / high) * 100 : null;
}

function riseFromLow(currentPrice: number | null | undefined, lows: number[]) {
  if (!currentPrice || lows.length === 0) {
    return null;
  }

  const low = Math.min(...lows.slice(-252));
  return low > 0 ? ((currentPrice - low) / low) * 100 : null;
}

function volumeRatio(currentVolume: number | null | undefined, volumes: number[], period: number) {
  if (!currentVolume || volumes.length < period) {
    return null;
  }

  const average = movingAverage(volumes, period);
  return average && average > 0 ? currentVolume / average : null;
}

function volatility(closes: number[], period: number) {
  if (closes.length < period + 1) {
    return null;
  }

  const recent = closes.slice(-(period + 1));
  const returns = recent.slice(1).map((value, index) => ((value - recent[index]) / recent[index]) * 100);
  const average = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - average) ** 2, 0) / returns.length;
  return Math.sqrt(variance);
}

function distance(currentPrice: number | null | undefined, target: number | null) {
  if (!currentPrice || !target) {
    return null;
  }

  return ((currentPrice - target) / target) * 100;
}

function last(values: number[]) {
  return values.length > 0 ? values[values.length - 1] : null;
}
