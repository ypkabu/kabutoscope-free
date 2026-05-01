export type AccountType = "NISA" | "TOKUTEI" | "WATCH_ONLY";

export type MarketType = "TSE" | "NASDAQ" | "NYSE" | "FUND" | "OTHER" | "JP_STOCK" | "US_STOCK";

export type TargetAccountType = "NISA" | "TOKUTEI" | "CASH";

export type InvestmentHorizon = "SHORT" | "MEDIUM" | "LONG";

export type PositionPurpose = "CORE" | "INCOME" | "GROWTH" | "THEME" | "REBOUND" | "WATCH";

export type TradeActionType = "BUY_PLAN" | "BUY" | "SELL_PLAN" | "SELL" | "HOLD" | "REVIEW";

export type EmotionTag = "calm" | "fear_of_missing_out" | "panic" | "planned" | "revenge_trade" | "uncertain";

export type NotificationType =
  | "BUY_LINE"
  | "BUY_SCORE"
  | "TAKE_PROFIT"
  | "STRONG_TAKE_PROFIT"
  | "STOP_LOSS"
  | "HIGH_RISK"
  | "SELL_SCORE";

export type Stock = {
  id: string;
  symbol: string;
  name: string;
  market: MarketType;
  country: string;
  sector: string;
  tags: string[];
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Holding = {
  id: string;
  stockId: string;
  accountType: AccountType;
  investmentHorizon: InvestmentHorizon;
  positionPurpose: PositionPurpose;
  quantity: number;
  averagePrice: number | null;
  memo: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AlertSetting = {
  id: string;
  stockId: string;
  buyBelow: number | null;
  takeProfit: number | null;
  strongTakeProfit: number | null;
  stopLoss: number | null;
  notifyEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PriceSnapshot = {
  id?: string;
  stockId: string;
  symbol: string;
  currentPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  currency: string | null;
  marketTime: string | null;
  rawJson: unknown;
  createdAt?: string;
};

export type RiskLimit = {
  id: string;
  stockId: string;
  maxInvestmentAmount: number | null;
  maxPortfolioWeight: number | null;
  warningEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type TargetPortfolio = {
  id: string;
  symbol: string;
  name: string;
  targetAccountType: TargetAccountType;
  targetQuantity: number | null;
  targetAmount: number | null;
  priority: number;
  memo: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PortfolioSettings = {
  totalBudget: number;
  cashAmount: number;
  rakutenNisaBudget: number;
  sbiTokuteiBudget: number;
  minimumCashRatio: number;
  warningCashRatio: number;
};

export type TradeJournal = {
  id: string;
  stockId: string | null;
  symbol: string;
  actionType: TradeActionType;
  accountType: AccountType;
  price: number | null;
  quantity: number | null;
  reason: string | null;
  expectedScenario: string | null;
  exitCondition: string | null;
  takeProfitCondition: string | null;
  stopLossCondition: string | null;
  emotionTag: EmotionTag | null;
  createdAt: string;
  updatedAt?: string;
};

export type StockEvent = {
  id: string;
  stockId: string | null;
  symbol: string;
  eventType: "EARNINGS" | "DIVIDEND" | "SHAREHOLDER_BENEFIT" | "PRODUCT_EVENT" | "OTHER";
  eventDate: string;
  title: string;
  memo: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type HistoricalPrice = {
  date: Date;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
};

export type TechnicalIndicators = {
  currentPrice: number | null;
  ma5: number | null;
  ma25: number | null;
  ma75: number | null;
  return5d: number | null;
  return20d: number | null;
  drawdownFrom52WeekHigh: number | null;
  riseFrom52WeekLow: number | null;
  volumeRatio: number | null;
  volatility20d: number | null;
  distanceToBuyBelow: number | null;
  distanceToTakeProfit: number | null;
  distanceToStrongTakeProfit: number | null;
  distanceToStopLoss: number | null;
};

export type ScoreBlock = {
  score: number;
  label: string;
  reasons: string[];
  positiveFactors: string[];
  negativeFactors: string[];
  comment: string;
};

export type ScoringResult = {
  nisaScore: ScoreBlock;
  tokuteiScore: ScoreBlock;
  buyScore: ScoreBlock;
  sellScore: ScoreBlock;
  riskScore: ScoreBlock;
  confidenceScore: ScoreBlock;
  doNotBuyReasons: string[];
  overallLabel: string;
  positionProfitPercent: number | null;
  indicators: TechnicalIndicators;
  generatedAt: string;
};

export type NotificationLog = {
  id: string;
  stockId: string;
  symbol: string;
  notificationType: NotificationType;
  currentPrice: number | null;
  message: string;
  nisaScore: number | null;
  tokuteiScore: number | null;
  buyScore: number | null;
  sellScore: number | null;
  riskScore: number | null;
  createdAt: string;
};

export type StockOverview = {
  stock: Stock;
  holding: Holding | null;
  alertSetting: AlertSetting | null;
  riskLimit: RiskLimit | null;
  latestSnapshot: PriceSnapshot | null;
  scoring: ScoringResult | null;
  recentNotifications?: NotificationLog[];
};

export type QuoteResult = {
  symbol: string;
  currentPrice: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number | null;
  currency: string | null;
  marketTime: string | null;
  rawJson: unknown;
  error?: string;
};
