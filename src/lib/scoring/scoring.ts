import { calculateIndicators } from "./indicators";
import { scoreThresholds, typeAdjustments } from "@/config/scoringWeights";
import type {
  AlertSetting,
  HistoricalPrice,
  Holding,
  MarketContext,
  PortfolioSettings,
  QuoteResult,
  RiskLimit,
  ScoreBlock,
  ScoringResult,
  Stock,
  TechnicalIndicators
} from "../types";

type ScoreInput = {
  stock: Stock;
  holding: Holding | null;
  alertSetting: AlertSetting | null;
  riskLimit?: RiskLimit | null;
  marketContext?: MarketContext | null;
  portfolioSettings?: PortfolioSettings | null;
  recentBuyJournalCount?: number;
  quote: QuoteResult | null;
  historicalPrices: HistoricalPrice[];
};

type ScoreDraft = {
  score: number;
  positiveFactors: string[];
  negativeFactors: string[];
  cautionFactors: string[];
  reasons: string[];
};

export function calculateStockScore(input: ScoreInput): ScoringResult {
  const indicators = calculateIndicators(input.quote, input.historicalPrices, input.alertSetting);
  const positionProfitPercent = calculatePositionProfitPercent(input.holding, input.quote);
  const riskDraft = riskScore(input.stock, input.holding, indicators, input.quote, input.alertSetting, positionProfitPercent);

  const nisaDraft = nisaScore(input.stock, input.holding, indicators, input.alertSetting, riskDraft.score);
  const tokuteiDraft = tokuteiScore(input.stock, input.holding, indicators, input.alertSetting, riskDraft.score);
  const buyDraft = buyScore(input.stock, input.holding, indicators, input.quote, input.alertSetting, riskDraft.score);
  const sellDraft = sellScore(input.stock, input.holding, indicators, input.quote, input.alertSetting, positionProfitPercent);
  const confidenceDraft = confidenceScore(input.quote, input.historicalPrices, input.alertSetting, input.holding, indicators);
  const marketDraft = marketScore(input.stock, input.marketContext);
  applyMarketAdjustment(input.stock, buyDraft, riskDraft, input.marketContext);
  const timingDraft = timingScore(input.stock, input.holding, indicators, input.alertSetting, buyDraft.score, riskDraft.score);
  const fomoDraft = fomoRiskScore(input.stock, indicators, input.alertSetting, input.quote);
  const averagingDownDraft = averagingDownRiskScore(input.holding, indicators, positionProfitPercent, riskDraft.score, input.riskLimit, input.recentBuyJournalCount ?? 0);
  const portfolioFitDraft = portfolioFitScore(input.stock, input.holding, indicators, input.riskLimit, input.portfolioSettings);
  const doNotBuyReasons = buildDoNotBuyReasons(
    input.stock,
    input.holding,
    indicators,
    input.alertSetting,
    riskDraft.score,
    input.riskLimit,
    fomoDraft.score,
    averagingDownDraft.score,
    portfolioFitDraft.score,
    input.marketContext,
    input.portfolioSettings
  );
  const doNotBuyDraft = doNotBuyScore(doNotBuyReasons, riskDraft.score, fomoDraft.score, averagingDownDraft.score, portfolioFitDraft.score);
  const decisionConfidenceDraft = decisionConfidenceScore(confidenceDraft.score, marketDraft.score, doNotBuyReasons.length, input.marketContext);
  const finalDecision = decideFinalDecision(
    buyDraft.score,
    sellDraft.score,
    riskDraft.score,
    doNotBuyDraft.score,
    portfolioFitDraft.score,
    input.holding,
    indicators
  );
  const scenarios = buildScenarios(input.stock, input.alertSetting, input.holding, indicators);

  return {
    nisaScore: toBlock(nisaDraft, labelNisa(nisaDraft.score), buildNisaComment(nisaDraft.score, input.stock.tags)),
    tokuteiScore: toBlock(
      tokuteiDraft,
      labelTokutei(tokuteiDraft.score),
      buildTokuteiComment(tokuteiDraft.score, input.stock.tags)
    ),
    buyScore: toBlock(buyDraft, labelBuy(buyDraft.score), buildBuyComment(buyDraft.score, riskDraft.score)),
    sellScore: toBlock(sellDraft, labelSell(sellDraft.score), buildSellComment(sellDraft.score)),
    riskScore: toBlock(riskDraft, labelRisk(riskDraft.score), buildRiskComment(riskDraft.score, riskDraft.positiveFactors)),
    confidenceScore: toBlock(
      confidenceDraft,
      confidenceDraft.score >= 75 ? "判定信頼度高め" : confidenceDraft.score >= 50 ? "判定信頼度ふつう" : "データ不足",
      confidenceDraft.score < 60 ? "データ不足のため判定信頼度は低めです。" : "主要データが揃っており、ルール判定の材料は比較的十分です。"
    ),
    marketScore: toBlock(marketDraft, labelMarket(marketDraft.score), buildMarketComment(marketDraft, input.stock)),
    timingScore: toBlock(timingDraft, labelTiming(timingDraft.score), buildTimingComment(timingDraft.score, riskDraft.score)),
    fomoRiskScore: toBlock(fomoDraft, labelFomo(fomoDraft.score), buildFomoComment(fomoDraft.score)),
    averagingDownRiskScore: toBlock(averagingDownDraft, labelAveragingDown(averagingDownDraft.score), buildAveragingDownComment(averagingDownDraft.score)),
    portfolioFitScore: toBlock(portfolioFitDraft, labelPortfolioFit(portfolioFitDraft.score), buildPortfolioFitComment(portfolioFitDraft.score)),
    decisionConfidenceScore: toBlock(
      decisionConfidenceDraft,
      decisionConfidenceDraft.score >= 75 ? "総合判定の信頼度高め" : decisionConfidenceDraft.score >= 50 ? "総合判定の信頼度ふつう" : "総合判定はデータ不足",
      decisionConfidenceDraft.score < 60 ? "一部データが不足しているため、手動確認を優先してください。" : "複数材料が揃っており、候補整理に使いやすい状態です。"
    ),
    doNotBuyScore: toBlock(doNotBuyDraft, labelDoNotBuy(doNotBuyDraft.score), buildDoNotBuyComment(doNotBuyDraft.score, doNotBuyReasons)),
    doNotBuyReasons,
    overallLabel: finalDecision,
    finalDecision,
    scenarios,
    positionProfitPercent,
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
  holding: Holding | null,
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

  const horizon = holding?.investmentHorizon ?? "MEDIUM";
  const purpose = holding?.positionPurpose ?? "WATCH";
  if (horizon === "SHORT") {
    if (indicators.volumeRatio !== null && indicators.volumeRatio >= 1.2) addPositive(draft, 4, "短期枠では出来高増加を重視");
    if (riskScoreValue >= 80) addNegative(draft, 10, "短期枠では危険度80以上を強く警戒");
  }
  if (horizon === "MEDIUM") {
    if (aboveMa(indicators, "ma75")) addPositive(draft, 5, "中期枠では75日線維持を評価");
    if (stock.tags.some((tag) => ["semiconductor", "ai", "defense", "datacenter", "game"].includes(tag))) addPositive(draft, 4, "中期テーマ継続を監視");
  }
  if (horizon === "LONG") {
    if (stock.tags.some((tag) => ["dividend", "shareholder_benefit", "defensive", "long_term", "sp500", "index"].includes(tag))) addPositive(draft, 8, "長期枠では安定・配当・土台タグを評価");
    if (riskScoreValue < 60) addPositive(draft, 5, "長期枠では一時的な値動きを過度に重く見ない");
  }
  if (purpose === "CORE" || purpose === "INCOME") addPositive(draft, 3, "目的に沿った長期監視枠");
  if (purpose === "WATCH") addNegative(draft, 5, "監視のみのため買い判定は控えめ");

  return finish(draft);
}

function sellScore(
  stock: Stock,
  holding: Holding | null,
  indicators: TechnicalIndicators,
  quote: QuoteResult | null,
  alertSetting: AlertSetting | null,
  positionProfitPercent: number | null
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

  const horizon = holding?.investmentHorizon ?? "MEDIUM";
  const purpose = holding?.positionPurpose ?? "WATCH";
  if (!hasHolding) {
    addNegative(draft, 15, "未保有または監視のみのため売り判定は低め");
  }
  if (horizon === "SHORT") {
    if (positionProfitPercent !== null && positionProfitPercent >= 10) addPositive(draft, 10, "短期枠で含み益10%以上");
    if (positionProfitPercent !== null && positionProfitPercent >= 20) addPositive(draft, 15, "短期枠で含み益20%以上");
    if (indicators.return5d !== null && indicators.return5d >= 10) addPositive(draft, 8, "短期で大きく上昇");
  }
  if (horizon === "MEDIUM") {
    if (positionProfitPercent !== null && positionProfitPercent >= 20) addPositive(draft, 10, "中期枠で含み益20%以上");
    if (positionProfitPercent !== null && positionProfitPercent >= 35) addPositive(draft, 15, "中期枠で含み益35%以上");
    if (indicators.return20d !== null && indicators.return20d >= 20) addPositive(draft, 8, "中期で上昇率が高い");
  }
  if (horizon === "LONG") {
    addNegative(draft, 12, "長期枠のため短期上昇だけでは売り判定を抑制");
    if (positionProfitPercent !== null && positionProfitPercent >= 50) addPositive(draft, 15, "長期枠で含み益50%以上、比率調整候補");
    if (positionProfitPercent !== null && positionProfitPercent >= 100) addPositive(draft, 20, "長期枠で含み益100%以上、元本回収や比率調整を検討");
  }
  if (purpose === "CORE" || purpose === "INCOME") addNegative(draft, 6, "コア・配当目的のため短期利確は控えめ");
  if (purpose === "THEME" || purpose === "REBOUND") addPositive(draft, 5, "テーマ・反発枠のため利益確定を早めに監視");

  return finish(draft);
}

function riskScore(stock: Stock, holding: Holding | null, indicators: TechnicalIndicators, quote: QuoteResult | null, alertSetting: AlertSetting | null, positionProfitPercent: number | null): ScoreDraft {
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

  const horizon = holding?.investmentHorizon ?? "MEDIUM";
  const purpose = holding?.positionPurpose ?? "WATCH";
  if (horizon === "SHORT") {
    if (positionProfitPercent !== null && positionProfitPercent <= -7) addPositive(draft, 10, "短期枠で含み損7%以上");
    if (positionProfitPercent !== null && positionProfitPercent <= -10) addPositive(draft, 15, "短期枠で損切り候補水準");
  }
  if (horizon === "MEDIUM") {
    if (positionProfitPercent !== null && positionProfitPercent <= -12) addPositive(draft, 8, "中期枠で含み損12%以上");
    if (positionProfitPercent !== null && positionProfitPercent <= -18) addPositive(draft, 12, "中期枠で見直し候補水準");
  }
  if (horizon === "LONG") {
    addNegative(draft, 8, "長期枠のため短期下落だけでは危険度を上げすぎない");
    if (positionProfitPercent !== null && positionProfitPercent <= -20) addPositive(draft, 8, "長期枠でも含み損20%以上は注意");
    if (positionProfitPercent !== null && positionProfitPercent <= -30 && belowMa(indicators, "ma75")) addPositive(draft, 12, "長期枠で大きな下落と長期線割れ");
  }
  if (purpose === "CORE" || purpose === "INCOME") addNegative(draft, 5, "コア・配当目的は短期変動を控えめに評価");
  if (purpose === "THEME" || purpose === "REBOUND") addPositive(draft, 5, "テーマ・反発枠は変動リスクを強めに監視");

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

function marketScore(stock: Stock, marketContext?: MarketContext | null): ScoreDraft {
  const draft = baseDraft(marketContext?.score ?? 55);
  if (!marketContext) {
    addCaution(draft, 0, "相場指数データは未取得のため中立扱い");
    return finish(draft);
  }

  for (const reason of marketContext.positiveFactors) addPositive(draft, 0, reason);
  for (const reason of marketContext.negativeFactors) addNegative(draft, 0, reason);
  for (const reason of marketContext.cautionFactors) addCaution(draft, 0, reason);

  if ((stock.tags.includes("semiconductor") || stock.tags.includes("ai")) && marketContext.semiconductorWeak) {
    addNegative(draft, typeAdjustments.semiconductor.marketSensitivity, "半導体指数が弱く、半導体・AI銘柄は慎重");
  }
  if (stock.country === "JP" && marketContext.jpWeak) addNegative(draft, 8, "日本株指数が弱い");
  if (stock.country === "US" && marketContext.usWeak) addNegative(draft, 8, "米国株指数が弱い");

  return finish(draft);
}

function applyMarketAdjustment(stock: Stock, buyDraft: ScoreDraft, riskDraft: ScoreDraft, marketContext?: MarketContext | null) {
  if (!marketContext) return;
  if ((stock.tags.includes("semiconductor") || stock.tags.includes("ai")) && marketContext.semiconductorWeak) {
    addNegative(buyDraft, 8, "半導体地合いが弱いため買い判定を控えめに調整");
    addCaution(riskDraft, 6, "半導体地合い悪化による変動リスク");
  }
  if (stock.country === "JP" && marketContext.jpWeak) addNegative(buyDraft, 4, "日本株全体の地合いが弱い");
  if (stock.country === "US" && marketContext.usWeak) addNegative(buyDraft, 4, "米国株全体の地合いが弱い");
}

function timingScore(
  stock: Stock,
  holding: Holding | null,
  indicators: TechnicalIndicators,
  alertSetting: AlertSetting | null,
  buyScoreValue: number,
  riskScoreValue: number
): ScoreDraft {
  const draft = baseDraft(45);
  if (buyScoreValue >= 75) addPositive(draft, 18, "買い候補スコアが高い");
  if (indicators.distanceToBuyBelow !== null && Math.abs(indicators.distanceToBuyBelow) <= 5) addPositive(draft, 15, "買いライン付近");
  if (indicators.return5d !== null && indicators.return5d < 0 && indicators.return5d > -8) addPositive(draft, 8, "短期下落後で反発確認候補");
  if (indicators.volumeRatio !== null && indicators.volumeRatio >= 1.2) addPositive(draft, 7, "出来高が増えている");
  if (riskScoreValue >= 75) addNegative(draft, 18, "危険度が高くタイミングは慎重");
  if (indicators.return20d !== null && indicators.return20d >= 20) addNegative(draft, 15, "20日で上がりすぎ");
  if (alertSetting?.buyBelow && indicators.currentPrice !== null && indicators.currentPrice > alertSetting.buyBelow * 1.2) {
    addNegative(draft, 15, "買いラインよりかなり上");
  }
  if (holding?.positionPurpose === "WATCH") addNegative(draft, 5, "監視のみ設定のため実行タイミングは控えめ");
  if (stock.tags.includes("game")) addCaution(draft, 3, "ゲーム株はタイトル・IP材料の確認が必要");
  return finish(draft);
}

function fomoRiskScore(stock: Stock, indicators: TechnicalIndicators, alertSetting: AlertSetting | null, quote: QuoteResult | null): ScoreDraft {
  const draft = baseDraft(20);
  const currentPrice = quote?.currentPrice ?? indicators.currentPrice;
  if (indicators.return5d !== null && indicators.return5d >= 10) addCaution(draft, 18, "5日で大きく上昇");
  if (indicators.return20d !== null && indicators.return20d >= 20) addCaution(draft, 18, "20日で大きく上昇");
  if (alertSetting?.buyBelow && currentPrice !== null && currentPrice > alertSetting.buyBelow * 1.2) addCaution(draft, 15, "買いラインより大きく上");
  if (indicators.ma25 !== null && currentPrice !== null && currentPrice > indicators.ma25 * 1.12) addCaution(draft, 12, "25日線より大きく上");
  if (indicators.volumeRatio !== null && indicators.volumeRatio > 1.8 && indicators.return5d !== null && indicators.return5d > 4) addCaution(draft, 12, "出来高急増後に上昇");
  if (alertSetting?.strongTakeProfit && currentPrice !== null && currentPrice >= alertSetting.strongTakeProfit * 0.95) addCaution(draft, 12, "強め利確ラインに近い");
  if (stock.tags.includes("high_volatility")) addCaution(draft, 6, "値動きが荒い銘柄");
  if (stock.tags.includes("defense")) addCaution(draft, typeAdjustments.defense.fomoAfterRally, "防衛・重工テーマは急騰後の追いかけに注意");
  if (stock.tags.includes("semiconductor") || stock.tags.includes("ai")) addCaution(draft, 6, "半導体・AIテーマは人気化後の高値追いに注意");
  return finish(draft);
}

function averagingDownRiskScore(
  holding: Holding | null,
  indicators: TechnicalIndicators,
  positionProfitPercent: number | null,
  riskScoreValue: number,
  riskLimit?: RiskLimit | null,
  recentBuyJournalCount = 0
): ScoreDraft {
  const draft = baseDraft(15);
  const quantity = holding?.quantity ?? 0;
  const investedAmount = quantity * (indicators.currentPrice ?? holding?.averagePrice ?? 0);
  if (quantity > 0) addCaution(draft, 10, "すでに同銘柄を保有");
  if (positionProfitPercent !== null && positionProfitPercent < 0) addCaution(draft, 15, "含み損がある");
  if (riskLimit?.maxInvestmentAmount && investedAmount >= riskLimit.maxInvestmentAmount * 0.8) addCaution(draft, 15, "最大投資額の80%以上");
  if (riskScoreValue >= 75) addCaution(draft, 18, "危険度が高い");
  if (belowMa(indicators, "ma25") && belowMa(indicators, "ma75")) addCaution(draft, 14, "下落トレンド中");
  if (recentBuyJournalCount >= 2) addCaution(draft, 12, "直近で同銘柄の買い計画メモが複数ある");
  if (holding?.investmentHorizon === "LONG" && holding.positionPurpose === "CORE") addNegative(draft, 8, "コア長期枠は短期ナンピンとは別管理");
  return finish(draft);
}

function portfolioFitScore(
  stock: Stock,
  holding: Holding | null,
  indicators: TechnicalIndicators,
  riskLimit?: RiskLimit | null,
  portfolioSettings?: PortfolioSettings | null
): ScoreDraft {
  const draft = baseDraft(60);
  const quantity = holding?.quantity ?? 0;
  const investedAmount = quantity * (indicators.currentPrice ?? holding?.averagePrice ?? 0);
  const cashRatio = portfolioSettings && portfolioSettings.totalBudget > 0 ? portfolioSettings.cashAmount / portfolioSettings.totalBudget : null;

  if (holding?.accountType === "NISA" && holding.investmentHorizon === "LONG") addPositive(draft, 10, "NISAと長期設定が合っている");
  if (holding?.accountType === "TOKUTEI" && holding.investmentHorizon === "SHORT") addPositive(draft, 8, "特定口座と短期設定が合っている");
  if (holding?.positionPurpose === "CORE" || holding?.positionPurpose === "INCOME") addPositive(draft, 8, "ポートフォリオの土台・安定枠");
  if (stock.tags.includes("sp500") || stock.tags.includes("index")) addPositive(draft, typeAdjustments.index.longCoreBonus, "インデックス土台として使いやすい");
  if (cashRatio !== null && cashRatio >= 0.2) addPositive(draft, 10, "現金比率に余裕がある");
  if (cashRatio !== null && cashRatio < 0.1) addNegative(draft, 20, "現金比率が低い");
  if (riskLimit?.maxInvestmentAmount && investedAmount >= riskLimit.maxInvestmentAmount) addNegative(draft, 20, "最大投資額を超えている");
  else if (riskLimit?.maxInvestmentAmount && investedAmount >= riskLimit.maxInvestmentAmount * 0.8) addNegative(draft, 10, "最大投資額に近い");
  if (portfolioSettings?.totalBudget && riskLimit?.maxPortfolioWeight && investedAmount / portfolioSettings.totalBudget > riskLimit.maxPortfolioWeight) {
    addNegative(draft, 18, "最大ポートフォリオ比率を超えている");
  }
  if (stock.tags.includes("high_volatility") && holding?.positionPurpose === "CORE") addNegative(draft, 12, "高ボラ銘柄をコアにするには注意");
  if (holding?.positionPurpose === "WATCH") addNegative(draft, 8, "監視のみ設定");
  return finish(draft);
}

function doNotBuyScore(
  reasons: string[],
  riskScoreValue: number,
  fomoRiskScoreValue: number,
  averagingDownRiskScoreValue: number,
  portfolioFitScoreValue: number
): ScoreDraft {
  const draft = baseDraft(reasons.length * 8);
  for (const reason of reasons) addCaution(draft, 0, reason);
  if (riskScoreValue >= 75) addCaution(draft, 16, "riskScore が高い");
  if (fomoRiskScoreValue >= 60) addCaution(draft, 14, "fomoRiskScore が高い");
  if (averagingDownRiskScoreValue >= 60) addCaution(draft, 14, "averagingDownRiskScore が高い");
  if (portfolioFitScoreValue < 40) addCaution(draft, 16, "portfolioFitScore が低い");
  return finish(draft);
}

function decisionConfidenceScore(confidenceScoreValue: number, marketScoreValue: number, doNotBuyReasonCount: number, marketContext?: MarketContext | null): ScoreDraft {
  const draft = baseDraft(confidenceScoreValue);
  if (marketContext) addPositive(draft, 8, "相場環境データあり");
  else addNegative(draft, 8, "相場環境データなし");
  if (marketScoreValue < 35 || marketScoreValue > 75) addPositive(draft, 4, "相場環境の方向感が判定材料になる");
  if (doNotBuyReasonCount >= 3) addPositive(draft, 4, "買わない理由が複数あり注意点が明確");
  return finish(draft);
}

function baseDraft(score: number): ScoreDraft {
  return { score, positiveFactors: [], negativeFactors: [], cautionFactors: [], reasons: [] };
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

function addCaution(draft: ScoreDraft, points: number, reason: string) {
  draft.score += points;
  draft.cautionFactors.push(reason);
  draft.reasons.push(`+${points}: ${reason}`);
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
    cautionFactors: draft.cautionFactors,
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
  if (score >= 85) return "強い買い候補";
  if (score >= 80) return "買い候補";
  if (score >= 75) return "少額なら買い候補";
  if (score >= 70) return "買いライン接近";
  if (score >= 60) return "監視候補";
  return "様子見";
}

function labelSell(score: number) {
  if (score >= 85) return "強め利確候補";
  if (score >= 80) return "利確優先";
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
  if (score >= 85) return "強め利確ラインや過熱条件に近く、利確優先候補です。";
  if (score >= 70) return "利確ラインに到達し、短期上昇率も高いため一部利確候補です。";
  return "利確よりも継続監視寄りの判定です。";
}

function calculatePositionProfitPercent(holding: Holding | null, quote: QuoteResult | null) {
  if (!holding || !holding.quantity || !holding.averagePrice || holding.averagePrice <= 0 || quote?.currentPrice === null || quote?.currentPrice === undefined) {
    return null;
  }

  return ((quote.currentPrice - holding.averagePrice) / holding.averagePrice) * 100;
}

function buildDoNotBuyReasons(
  stock: Stock,
  holding: Holding | null,
  indicators: TechnicalIndicators,
  alertSetting: AlertSetting | null,
  riskScoreValue: number,
  riskLimit?: RiskLimit | null,
  fomoRiskScoreValue = 0,
  averagingDownRiskScoreValue = 0,
  portfolioFitScoreValue = 100,
  marketContext?: MarketContext | null,
  portfolioSettings?: PortfolioSettings | null
) {
  const reasons: string[] = [];
  if (indicators.return20d !== null && indicators.return20d > 18) reasons.push("短期で上がりすぎ");
  if (belowMa(indicators, "ma75") && indicators.return5d !== null && indicators.return5d < -8) reasons.push("75日線を大きく下回っている");
  if (indicators.volumeRatio !== null && indicators.volumeRatio > 1.8 && indicators.return5d !== null && indicators.return5d < 0) reasons.push("出来高を伴って下落");
  if (riskScoreValue >= 75) reasons.push("riskScore が高すぎる");
  if (fomoRiskScoreValue >= 60) reasons.push("fomoRiskScore が高い");
  if (averagingDownRiskScoreValue >= 60) reasons.push("averagingDownRiskScore が高い");
  if (portfolioFitScoreValue < 40) reasons.push("ポートフォリオ適合度が低い");
  if (indicators.distanceToBuyBelow !== null && indicators.distanceToBuyBelow > 20) reasons.push("買いラインよりかなり上");
  if (stock.tags.includes("high_volatility") && holding?.investmentHorizon === "LONG") reasons.push("長期枠としては値動きが荒い");
  const investedAmount = (holding?.quantity ?? 0) * (indicators.currentPrice ?? holding?.averagePrice ?? 0);
  if (riskLimit?.maxInvestmentAmount && investedAmount >= riskLimit.maxInvestmentAmount * 0.8) reasons.push("最大投資額に近い");
  const cashRatio = portfolioSettings && portfolioSettings.totalBudget > 0 ? portfolioSettings.cashAmount / portfolioSettings.totalBudget : null;
  if (cashRatio !== null && cashRatio < 0.1) reasons.push("現金比率が低い");
  if ((stock.tags.includes("semiconductor") || stock.tags.includes("ai")) && marketContext?.semiconductorWeak) reasons.push("半導体地合いが悪い");
  if (stock.tags.includes("event_risk")) reasons.push("追加悪材料やイベントリスクを確認したい");
  if (stock.tags.includes("bank") && stock.tags.includes("event_risk")) reasons.push("不祥事下落のため慎重");
  if (alertSetting?.buyBelow === null || alertSetting?.buyBelow === undefined) reasons.push("買いライン未設定");
  return Array.from(new Set(reasons));
}

function decideFinalDecision(
  buyScoreValue: number,
  sellScoreValue: number,
  riskScoreValue: number,
  doNotBuyScoreValue: number,
  portfolioFitScoreValue: number,
  holding: Holding | null,
  indicators: TechnicalIndicators
) {
  if (riskScoreValue >= scoreThresholds.highRisk) return "損切り検討";
  if (sellScoreValue >= scoreThresholds.sellPriority && holding?.investmentHorizon !== "LONG") return "利確優先";
  if (sellScoreValue >= scoreThresholds.partialProfit) return "一部利確候補";
  if (doNotBuyScoreValue >= scoreThresholds.doNotBuy) return "買わない理由あり";
  if (portfolioFitScoreValue < scoreThresholds.portfolioFitCaution) return "計画外購入注意";
  if (buyScoreValue >= scoreThresholds.strongBuy && riskScoreValue < 55 && doNotBuyScoreValue < 50 && portfolioFitScoreValue >= 60) return "強い買い候補";
  if (buyScoreValue >= scoreThresholds.smallBuy && riskScoreValue < 70) return "少額なら買い候補";
  if (buyScoreValue >= 70 && riskScoreValue >= 70) return "反発確認待ち";
  if (indicators.distanceToBuyBelow !== null && indicators.distanceToBuyBelow > 20) return "高値追い注意";
  if (holding?.positionPurpose === "WATCH") return "監視のみ";
  if (buyScoreValue >= 65) return "買いライン接近";
  if (riskScoreValue >= 65) return "反発確認待ち";
  if (holding && holding.quantity > 0) return "継続保有";
  return "監視のみ";
}

function buildRiskComment(score: number, positives: string[]) {
  if (score >= 75) return "損切りラインに接近しており、危険度が上がっています。";
  if (positives.some((reason) => reason.includes("75日線"))) return "中期トレンドの崩れに注意しながら監視する状態です。";
  return "通常の監視範囲ですが、価格取得データとアラートラインは継続確認してください。";
}

function labelMarket(score: number) {
  if (score >= 70) return "相場環境良好";
  if (score >= 45) return "相場環境ふつう";
  return "地合い悪化注意";
}

function labelTiming(score: number) {
  if (score >= 80) return "タイミング良好";
  if (score >= 60) return "少額ならタイミング候補";
  if (score >= 40) return "待ち";
  return "タイミング慎重";
}

function labelFomo(score: number) {
  if (score >= 80) return "高値追い危険";
  if (score >= 60) return "FOMO注意";
  if (score >= 40) return "やや高値追い注意";
  return "通常";
}

function labelAveragingDown(score: number) {
  if (score >= 80) return "追加購入は危険寄り";
  if (score >= 60) return "ナンピン注意";
  if (score >= 40) return "買い増し慎重";
  return "通常";
}

function labelPortfolioFit(score: number) {
  if (score >= 80) return "ポートフォリオに合う";
  if (score >= 60) return "少額なら合う";
  if (score >= 40) return "やや計画外";
  return "計画外・慎重";
}

function labelDoNotBuy(score: number) {
  if (score >= 85) return "待ち";
  if (score >= 70) return "買わない理由あり";
  if (score >= 45) return "注意点あり";
  return "大きな買わない理由は少なめ";
}

function buildMarketComment(draft: ScoreDraft, stock: Stock) {
  if (draft.score < 45 && (stock.tags.includes("semiconductor") || stock.tags.includes("ai"))) {
    return "半導体指数が弱いため、半導体・AI銘柄の買い判定を慎重にしています。";
  }
  if (draft.score < 45) return "相場全体の地合いが弱く、無理な新規購入は待ち寄りで監視します。";
  if (draft.score >= 70) return "主要指数の状態は比較的良く、相場環境は候補整理の追い風です。";
  return "相場環境は中立です。銘柄単体のラインとリスクを優先して確認します。";
}

function buildTimingComment(score: number, riskScoreValue: number) {
  if (score >= 75 && riskScoreValue < 70) return "買いラインや出来高など、タイミング面の材料は比較的揃っています。";
  if (riskScoreValue >= 75) return "買いラインに近くても危険度が高いため、反発確認待ちの判定です。";
  return "タイミング面ではまだ待ちの材料が残っています。";
}

function buildFomoComment(score: number) {
  if (score >= 80) return "短期で大きく上昇しており、今から追うと高値掴みになる可能性があります。";
  if (score >= 60) return "上昇後の焦り買いに注意したい状態です。";
  return "高値追いリスクは通常範囲です。";
}

function buildAveragingDownComment(score: number) {
  if (score >= 80) return "すでに含み損や下落トレンドがあり、買い増しより見直しを優先したい状態です。";
  if (score >= 60) return "買い増しは慎重に検討し、当初の買い理由が残っているか確認してください。";
  return "ナンピン危険度は通常範囲です。";
}

function buildPortfolioFitComment(score: number) {
  if (score >= 80) return "現在の資金計画や保有目的に合いやすい候補です。";
  if (score >= 60) return "少額ならポートフォリオに入れやすい候補です。";
  if (score >= 40) return "やや計画外のため、資金配分とテーマ偏りを確認してください。";
  return "計画外購入になりやすく、ポートフォリオ上は慎重に見たい候補です。";
}

function buildDoNotBuyComment(score: number, reasons: string[]) {
  if (score >= 85) return "買いラインに近くても、買わない理由が強いため待ち寄りです。";
  if (score >= 70) return `買わない理由があります。${reasons.slice(0, 2).join("、")} を確認してください。`;
  if (score >= 45) return "注意点はありますが、他のスコアと合わせて候補整理できます。";
  return "大きな買わない理由は少なめですが、最終判断は自分で確認してください。";
}

function buildScenarios(stock: Stock, alertSetting: AlertSetting | null, holding: Holding | null, indicators: TechnicalIndicators) {
  const buy = alertSetting?.buyBelow;
  const take = alertSetting?.takeProfit;
  const stop = alertSetting?.stopLoss;
  const isSemiconductor = stock.tags.includes("semiconductor") || stock.tags.includes("ai");
  const isTelecomIncome = stock.tags.includes("telecom") || stock.tags.includes("dividend") || stock.tags.includes("shareholder_benefit");
  const isGame = stock.tags.includes("game") || stock.tags.includes("ip");
  const isIndex = stock.tags.includes("sp500") || stock.tags.includes("index") || holding?.positionPurpose === "CORE";

  if (isIndex) {
    return {
      bullish: "コア資産として、短期売買ではなく長期積立・資産形成の土台として機能するシナリオです。",
      neutral: "短期的には上下しても、毎回の値動きより資金配分と現金余力を確認する状態です。",
      bearish: "相場全体の下落が続く場合でも、損切りより積立方針や生活資金とのバランスを見直します。"
    };
  }
  if (isSemiconductor) {
    return {
      bullish: `半導体テーマが継続し、売りが一巡すれば${take ? `${take.toLocaleString("ja-JP")}円付近` : "利確ライン付近"}まで反発する可能性を監視します。`,
      neutral: "短期的には上下しながら方向感を探る展開を想定し、出来高と25日線の回復を確認します。",
      bearish: `決算失望や半導体地合い悪化が続く場合、${stop ? `${stop.toLocaleString("ja-JP")}円割れ` : "損切りライン割れ"}までの下落に注意します。`
    };
  }
  if (isTelecomIncome) {
    return {
      bullish: "配当・優待目的の買いが入り、安定した値動きで緩やかな上昇を監視できるシナリオです。",
      neutral: "大きな値上がりは狙いにくいものの、配当・優待目的で保有継続しやすい状態です。",
      bearish: "減配や優待改悪、通信事業の成長鈍化が意識される場合は見直しが必要です。"
    };
  }
  if (isGame) {
    return {
      bullish: "タイトルラインナップやIP展開が評価され、中長期の成長枠として見直されるシナリオです。",
      neutral: "短期の話題性だけでは判断せず、決算・新作・IP展開を確認しながら監視します。",
      bearish: "新作不振や決算失望が出た場合、好きな会社という理由だけで買い増ししないよう注意します。"
    };
  }
  return {
    bullish: `買いライン${buy ? ` ${buy.toLocaleString("ja-JP")}円` : ""}付近で反発材料が出れば、候補として監視しやすくなります。`,
    neutral: "大きな方向感が出るまでは、価格ライン・出来高・決算材料を確認する状態です。",
    bearish: `悪材料や地合い悪化が続く場合、${stop ? `${stop.toLocaleString("ja-JP")}円付近` : "損切りライン"}で見直しを検討します。`
  };
}
