export const scoreThresholds = {
  strongBuy: 85,
  smallBuy: 75,
  reboundWaitRisk: 70,
  doNotBuy: 75,
  doNotBuyStrong: 85,
  highRisk: 85,
  sellPriority: 80,
  partialProfit: 65,
  portfolioFitGood: 80,
  portfolioFitSmall: 60,
  portfolioFitCaution: 40,
  fomoCaution: 60,
  fomoDanger: 80,
  averagingDownCaution: 60,
  averagingDownDanger: 80
};

export const horizonWeights = {
  SHORT: {
    buyLine: 25,
    nearBuyLine: 15,
    rebound: 15,
    volume: 10,
    riskOk: 10,
    earningsSoonPenalty: 15,
    highRiskPenalty: 20,
    profit10: 10,
    profit20: 15,
    lossWarning: 10,
    lossReview: 15
  },
  MEDIUM: {
    buyLine: 20,
    movingAverage: 15,
    theme: 10,
    trend: 15,
    riskOk: 10,
    earningsSoonPenalty: 10,
    profit20: 10,
    profit35: 15,
    lossWarning: 8,
    lossReview: 12
  },
  LONG: {
    buyLine: 15,
    longAverage: 15,
    stableTags: 15,
    trend: 10,
    riskOk: 10,
    temporaryDrop: 10,
    profit50: 15,
    profit100: 20,
    shortMoveSellPenalty: 12,
    lossWarning: 8,
    lossReview: 12
  }
} as const;

export const typeAdjustments = {
  semiconductor: {
    marketSensitivity: 12,
    fomoAfterRally: 12,
    earningsRisk: 10,
    highRiskBuyPenalty: 10
  },
  ai: {
    marketSensitivity: 10,
    fomoAfterRally: 10
  },
  dividend: {
    sellSuppression: 8,
    stabilityBuy: 8
  },
  shareholder_benefit: {
    sellSuppression: 8,
    stabilityBuy: 8
  },
  game: {
    storyCheckCaution: 7,
    fanBiasCaution: 6
  },
  defense: {
    themeMomentum: 8,
    fomoAfterRally: 10
  },
  bank: {
    eventRiskPenalty: 12,
    riskCaution: 8
  },
  index: {
    sellSuppression: 12,
    longCoreBonus: 12
  }
} as const;

export const marketSymbols = {
  jp: ["^N225", "1321.T", "1306.T"],
  us: ["^GSPC", "^IXIC", "QQQ", "SMH", "SOXX"]
};
