import { calculateIndicators } from "./indicators";
import type {
  AlertSetting,
  HistoricalPrice,
  Holding,
  QuoteResult,
  ScoreBlock,
  ScoringResult,
  Stock,
  TechnicalIndicators
} from "../types";

type ScoreInput = {
  stock: Stock;
  holding: Holding | null;
  alertSetting: AlertSetting | null;
  quote: QuoteResult | null;
  historicalPrices: HistoricalPrice[];
};

type ScoreDraft = {
  score: number;
  positiveFactors: string[];
  negativeFactors: string[];
  reasons: string[];
};

export function calculateStockScore(input: ScoreInput): ScoringResult {
  const indicators = calculateIndicators(input.quote, input.historicalPrices, input.alertSetting);
  const riskDraft = riskScore(input.stock, indicators, input.quote, input.alertSetting);
  const riskBlock = toBlock(riskDraft, labelRisk(riskDraft.score), buildRiskComment(riskDraft.score, riskDraft.positiveFactors));

  const nisaDraft = nisaScore(input.stock, input.holding, indicators, input.alertSetting, riskDraft.score);
  const tokuteiDraft = tokuteiScore(input.stock, input.holding, indicators, input.alertSetting, riskDraft.score);
  const buyDraft = buyScore(input.stock, indicators, input.quote, input.alertSetting, riskDraft.score);
  const sellDraft = sellScore(input.stock, input.holding, indicators, input.quote, input.alertSetting);
  const confidenceDraft = confidenceScore(input.quote, input.historicalPrices, input.alertSetting, input.holding, indicators);

  return {
    nisaScore: toBlock(nisaDraft, labelNisa(nisaDraft.score), buildNisaComment(nisaDraft.score, input.stock.tags)),
    tokuteiScore: toBlock(
      tokuteiDraft,
      labelTokutei(tokuteiDraft.score),
      buildTokuteiComment(tokuteiDraft.score, input.stock.tags)
    ),
    buyScore: toBlock(buyDraft, labelBuy(buyDraft.score), buildBuyComment(buyDraft.score, riskDraft.score)),
    sellScore: toBlock(sellDraft, labelSell(sellDraft.score), buildSellComment(sellDraft.score)),
    riskScore: riskBlock,
    confidenceScore: toBlock(
      confidenceDraft,
      confidenceDraft.score >= 75 ? "判定信頼度高め" : confidenceDraft.score >= 50 ? "判定信頼度ふつう" : "データ不足",
      confidenceDraft.score < 60 ? "データ不足のため判定信頼度は低めです。" : "主要データが揃っており、ルール判定の材料は比較的十分です。"
    ),
    indicators,
    generatedAt: new Date().toISOString()
  };
}

function nisaScore(
  stock: Stock,
  holding: Holding | null,
  indicators: TechnicalIndicators,
  alertSetting: AlertSetting | null,
  riskScoreValue: number
): ScoreDraft {
  const draft = baseDraft(45);
  addByTags(draft, stock.tags, {
    long_term: [12, "長期保有タグあり"],
    dividend: [10, "配当タグあり"],
    shareholder_benefit: [8, "優待タグあり"],
    defensive: [8, "ディフェンシブ性あり"],
    infrastructure: [8, "インフラ性あり"],
    telecom: [7, "通信セクター"],
    mega_cap: [6, "大型株タグあり"],
    diversified: [6, "分散投資タグあり"]
  });

  penalizeByTags(draft, stock.tags, {
    high_volatility: [12, "値動きが大きいタグあり"],
    tokutei: [8, "特定口座向きタグあり"]
  });

  if (holding?.accountType === "NISA") addPositive(draft, 10, "NISA枠の監視対象");
  if (indicators.volatility20d !== null && indicators.volatility20d < 2) addPositive(draft, 8, "20日ボラティリティが低め");
  if (indicators.volatility20d !== null && indicators.volatility20d > 4) addNegative(draft, 8, "20日ボラティリティが高め");
  if (indicators.return20d !== null && indicators.return20d > 18) addNegative(draft, 10, "20日上昇率が高く過熱注意");
  if (indicators.return20d !== null && indicators.return20d < -12) addNegative(draft, 8, "20日下落率が大きい");
  if (aboveMa(indicators, "ma75")) addPositive(draft, 8, "現在値が75日線を上回る");
  if (belowMa(indicators, "ma75")) addNegative(draft, 12, "現在値が75日線を下回る");
  if (alertSetting?.stopLoss && indicators.distanceToStopLoss !== null && indicators.distanceToStopLoss < 5) {
    addNegative(draft, 7, "損切りラインが近い");
  }
  if (riskScoreValue > 75) addNegative(draft, 10, "危険度が高い");

  return finish(draft);
}

function tokuteiScore(
  stock: Stock,
  holding: Holding | null,
  indicators: TechnicalIndicators,
  alertSetting: AlertSetting | null,
  riskScoreValue: number
): ScoreDraft {
  const draft = baseDraft(40);
  addByTags(draft, stock.tags, {
    semiconductor: [12, "半導体テーマ"],
    ai: [10, "AIテーマ"],
    high_volatility: [10, "短中期で値幅が出やすい"],
    growth: [8, "成長テーマ"],
    tokutei: [8, "特定口座向きタグあり"],
    game: [5, "ゲームテーマ"]
  });

  penalizeByTags(draft, stock.tags, {
    defensive: [8, "ディフェンシブ寄りで値幅が小さめ"],
    telecom: [6, "通信安定株で短期妙味は控えめ"]
  });

  if (holding?.accountType === "TOKUTEI") addPositive(draft, 10, "特定口座の監視対象");
  if (indicators.return5d !== null && indicators.return5d > 3 && indicators.return5d < 14) addPositive(draft, 8, "短期モメンタムあり");
  if (indicators.volumeRatio !== null && indicators.volumeRatio > 1.2) addPositive(draft, 8, "出来高が増加");
  if (indicators.distanceToBuyBelow !== null && Math.abs(indicators.distanceToBuyBelow) <= 5) addPositive(draft, 8, "買いラインに近い");
  if (!alertSetting?.buyBelow || !alertSetting?.takeProfit) addNegative(draft, 10, "明確な売買ラインが不足");
  if (riskScoreValue > 80) addNegative(draft, 15, "危険度が80超で短期候補としても注意");
  if (indicators.volatility20d !== null && indicators.volatility20d < 1.2) addNegative(draft, 7, "値動きが小さい");

  return finish(draft);
}

function buyScore(
  stock: Stock,
  indicators: TechnicalIndicators,
  quote: QuoteResult | null,
  alertSetting: AlertSetting | null,
  riskScoreValue: number
): ScoreDraft {
  const draft = baseDraft(35);
  const currentPrice = quote?.currentPrice ?? null;

  if (currentPrice !== null && alertSetting?.buyBelow !== null && alertSetting?.buyBelow !== undefined) {
    if (currentPrice <= alertSetting.buyBelow) addPositive(draft, 25, "買いラインに到達");
    else if (indicators.distanceToBuyBelow !== null && indicators.distanceToBuyBelow <= 5) addPositive(draft, 14, "買いラインに近い");
    else if (indicators.distanceToBuyBelow !== null && indicators.distanceToBuyBelow > 20) addNegative(draft, 16, "買いラインから大きく上に離れている");
  } else {
    addNegative(draft, 8, "買いライン未設定");
  }

  addByTags(draft, stock.tags, {
    semiconductor: [6, "半導体テーマ"],
    ai: [6, "AIテーマ"],
    game: [5, "ゲームテーマ"],
    long_term: [4, "長期テーマ"]
  });

  if (indicators.ma25 !== null && currentPrice !== null && currentPrice <= indicators.ma25 * 1.03 && currentPrice >= indicators.ma25 * 0.94) {
    addPositive(draft, 8, "25日線付近で監視しやすい");
  }
  if (aboveMa(indicators, "ma75")) addPositive(draft, 6, "75日線を維持");
  if (indicators.return5d !== null && indicators.return5d < 0 && indicators.return5d > -8) addPositive(draft, 7, "短期下落後で押し目候補");
  if (indicators.return20d !== null && indicators.return20d > 18) addNegative(draft, 12, "20日上昇率が高く過熱注意");
  if (indicators.volumeRatio !== null && indicators.volumeRatio > 1.2) addPositive(draft, 6, "出来高が増加");
  if (currentPrice !== null && alertSetting?.stopLoss && currentPrice <= alertSetting.stopLoss) addNegative(draft, 25, "損切りライン以下");
  if (riskScoreValue > 75) addNegative(draft, 14, "危険度が高い");
  if (belowMa(indicators, "ma75") && indicators.return5d !== null && indicators.return5d < -8) addNegative(draft, 10, "75日線割れで反発確認が弱い");

  return finish(draft);
}

function sellScore(
  stock: Stock,
  holding: Holding | null,
  indicators: TechnicalIndicators,
  quote: QuoteResult | null,
  alertSetting: AlertSetting | null
): ScoreDraft {
  const draft = baseDraft(25);
  const currentPrice = quote?.currentPrice ?? null;
  const hasHolding = Boolean(holding && holding.quantity > 0);

  if (!hasHolding) addNegative(draft, 12, "保有数量がないため利確候補ではない");
  if (currentPrice !== null && alertSetting?.takeProfit && currentPrice >= alertSetting.takeProfit) addPositive(draft, 20, "利確ラインに到達");
  if (currentPrice !== null && alertSetting?.strongTakeProfit && currentPrice >= alertSetting.strongTakeProfit) {
    addPositive(draft, 28, "強め利確ラインに到達");
  }
  if (indicators.return5d !== null && indicators.return5d > 8) addPositive(draft, 8, "5日上昇率が高い");
  if (indicators.return20d !== null && indicators.return20d > 18) addPositive(draft, 10, "20日上昇率が高い");
  if (indicators.ma25 !== null && currentPrice !== null && currentPrice > indicators.ma25 * 1.15) addPositive(draft, 8, "25日線から上に離れている");
  if (indicators.volumeRatio !== null && indicators.volumeRatio > 1.8 && indicators.return5d !== null && indicators.return5d > 4) {
    addPositive(draft, 8, "上昇後の出来高急増");
  }
  if (hasHolding && holding?.averagePrice && currentPrice !== null && currentPrice > holding.averagePrice) {
    addPositive(draft, 8, "保有単価を上回る");
  }
  if (hasHolding && holding?.averagePrice && currentPrice !== null && currentPrice < holding.averagePrice) {
    addNegative(draft, 12, "現在値が平均取得単価を下回る");
  }
  if (holding?.accountType === "NISA" && stock.tags.includes("defensive") && !(currentPrice !== null && alertSetting?.strongTakeProfit && currentPrice >= alertSetting.strongTakeProfit)) {
    addNegative(draft, 10, "NISA長期ディフェンシブ枠のため通常利確は控えめ");
  }

  return finish(draft);
}

function riskScore(stock: Stock, indicators: TechnicalIndicators, quote: QuoteResult | null, alertSetting: AlertSetting | null): ScoreDraft {
  const draft = baseDraft(25);
  const currentPrice = quote?.currentPrice ?? null;

  if (currentPrice !== null && alertSetting?.stopLoss && currentPrice <= alertSetting.stopLoss) addPositive(draft, 30, "損切りラインに到達");
  else if (indicators.distanceToStopLoss !== null && indicators.distanceToStopLoss < 5) addPositive(draft, 15, "損切りラインに接近");
  if (belowMa(indicators, "ma25")) addPositive(draft, 8, "25日線を下回る");
  if (belowMa(indicators, "ma75")) addPositive(draft, 12, "75日線を下回る");
  if (indicators.return5d !== null && indicators.return5d < -8) addPositive(draft, 12, "5日下落率が大きい");
  if (indicators.return20d !== null && indicators.return20d < -12) addPositive(draft, 8, "20日下落率が大きい");
  if (indicators.volatility20d !== null && indicators.volatility20d > 4) addPositive(draft, 10, "20日ボラティリティが高い");
  if (indicators.volumeRatio !== null && indicators.volumeRatio > 1.8 && indicators.return5d !== null && indicators.return5d < 0) {
    addPositive(draft, 8, "下落中の出来高増加");
  }
  if (stock.tags.includes("high_volatility")) addPositive(draft, 8, "高ボラティリティタグあり");
  if (aboveMa(indicators, "ma75")) addNegative(draft, 8, "75日線を維持");
  if (indicators.volatility20d !== null && indicators.volatility20d < 1.5) addNegative(draft, 7, "ボラティリティが低め");
  if (stock.tags.includes("defensive") || stock.tags.includes("long_term")) addNegative(draft, 5, "長期安定タグあり");

  return finish(draft);
}

function confidenceScore(
  quote: QuoteResult | null,
  historicalPrices: HistoricalPrice[],
  alertSetting: AlertSetting | null,
  holding: Holding | null,
  indicators: TechnicalIndicators
): ScoreDraft {
  const draft = baseDraft(20);
  if (quote?.currentPrice !== null && quote?.currentPrice !== undefined) addPositive(draft, 20, "現在値あり");
  else addNegative(draft, 20, "現在値なし");
  if (historicalPrices.length >= 75) addPositive(draft, 20, "75日以上の履歴価格あり");
  else if (historicalPrices.length > 0) addPositive(draft, 8, "一部の履歴価格あり");
  else addNegative(draft, 14, "履歴価格なし");
  if (quote?.volume !== null && quote?.volume !== undefined) addPositive(draft, 10, "出来高あり");
  else addNegative(draft, 6, "出来高なし");
  if (indicators.ma25 !== null && indicators.ma75 !== null) addPositive(draft, 15, "移動平均を計算可能");
  if (alertSetting?.buyBelow && alertSetting.takeProfit && alertSetting.strongTakeProfit && alertSetting.stopLoss) {
    addPositive(draft, 15, "アラート設定が揃っている");
  } else {
    addNegative(draft, 8, "アラート設定が一部不足");
  }
  if (holding) addPositive(draft, 8, "保有管理データあり");
  else addNegative(draft, 4, "保有管理データなし");

  return finish(draft);
}

function baseDraft(score: number): ScoreDraft {
  return { score, positiveFactors: [], negativeFactors: [], reasons: [] };
}

function addPositive(draft: ScoreDraft, points: number, reason: string) {
  draft.score += points;
  draft.positiveFactors.push(reason);
  draft.reasons.push(`+${points}: ${reason}`);
}

function addNegative(draft: ScoreDraft, points: number, reason: string) {
  draft.score -= points;
  draft.negativeFactors.push(reason);
  draft.reasons.push(`-${points}: ${reason}`);
}

function addByTags(draft: ScoreDraft, tags: string[], rules: Record<string, [number, string]>) {
  for (const [tag, [points, reason]] of Object.entries(rules)) {
    if (tags.includes(tag)) addPositive(draft, points, reason);
  }
}

function penalizeByTags(draft: ScoreDraft, tags: string[], rules: Record<string, [number, string]>) {
  for (const [tag, [points, reason]] of Object.entries(rules)) {
    if (tags.includes(tag)) addNegative(draft, points, reason);
  }
}

function finish(draft: ScoreDraft): ScoreDraft {
  return { ...draft, score: clamp(Math.round(draft.score)) };
}

function toBlock(draft: ScoreDraft, label: string, comment: string): ScoreBlock {
  return {
    score: draft.score,
    label,
    reasons: draft.reasons,
    positiveFactors: draft.positiveFactors,
    negativeFactors: draft.negativeFactors,
    comment
  };
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

function aboveMa(indicators: TechnicalIndicators, key: "ma25" | "ma75") {
  const ma = indicators[key];
  return indicators.currentPrice !== null && ma !== null && indicators.currentPrice >= ma;
}

function belowMa(indicators: TechnicalIndicators, key: "ma25" | "ma75") {
  const ma = indicators[key];
  return indicators.currentPrice !== null && ma !== null && indicators.currentPrice < ma;
}

function labelNisa(score: number) {
  if (score >= 78) return "NISA向き";
  if (score >= 58) return "監視候補";
  return "様子見";
}

function labelTokutei(score: number) {
  if (score >= 78) return "特定口座向き";
  if (score >= 58) return "監視候補";
  return "様子見";
}

function labelBuy(score: number) {
  if (score >= 80) return "買い候補";
  if (score >= 60) return "監視候補";
  return "様子見";
}

function labelSell(score: number) {
  if (score >= 85) return "強め利確候補";
  if (score >= 70) return "一部利確候補";
  if (score >= 50) return "継続保有";
  return "様子見";
}

function labelRisk(score: number) {
  if (score >= 75) return "危険度高め";
  if (score >= 55) return "注意";
  return "通常監視";
}

function buildNisaComment(score: number, tags: string[]) {
  if (score >= 78 && (tags.includes("dividend") || tags.includes("defensive"))) {
    return "配当・優待・安定性の観点からNISA長期枠に向いています。";
  }
  if (score >= 70) return "NISA向きスコアが高く、長期保有候補として監視できます。";
  if (tags.includes("high_volatility")) return "テーマ性はありますが、値動きが荒いためNISAでは慎重に監視したい候補です。";
  return "長期枠としては追加材料待ちの監視候補です。";
}

function buildTokuteiComment(score: number, tags: string[]) {
  if (score >= 78 && (tags.includes("semiconductor") || tags.includes("ai"))) {
    return "半導体テーマ性は強いですが、値動きが荒いため特定口座向きです。";
  }
  if (score >= 65) return "短中期の値幅を取りにいく監視候補です。";
  return "短期売買よりも様子見寄りの判定です。";
}

function buildBuyComment(score: number, riskScoreValue: number) {
  if (score >= 80 && riskScoreValue >= 70) {
    return "買いラインに近い一方で危険度も高く、損切りライン管理が必要です。";
  }
  if (score >= 80) return "買いラインに到達または接近しており、買い候補として監視できます。";
  if (score >= 60) return "買いラインに近づいていますが、短期過熱感やリスクも確認したい状態です。";
  return "買い候補としてはまだ条件が揃っていません。";
}

function buildSellComment(score: number) {
  if (score >= 85) return "強め利確ラインや過熱条件に近く、見直し候補です。";
  if (score >= 70) return "利確ラインに到達し、短期上昇率も高いため一部利確候補です。";
  return "利確よりも継続監視寄りの判定です。";
}

function buildRiskComment(score: number, positives: string[]) {
  if (score >= 75) return "損切りラインに接近しており、危険度が上がっています。";
  if (positives.some((reason) => reason.includes("75日線"))) return "中期トレンドの崩れに注意しながら監視する状態です。";
  return "通常の監視範囲ですが、価格取得データとアラートラインは継続確認してください。";
}
