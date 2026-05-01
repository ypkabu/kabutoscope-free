import type { AccountType, Holding, InvestmentHorizon, PositionPurpose, Stock } from "./types";

const longTags = ["long_term", "dividend", "shareholder_benefit", "defensive", "infrastructure", "sp500", "index"];
const themeTags = ["semiconductor", "ai", "high_volatility", "defense", "datacenter", "space"];

export const investmentHorizonLabels: Record<InvestmentHorizon, string> = {
  SHORT: "短期",
  MEDIUM: "中期",
  LONG: "長期"
};

export const positionPurposeLabels: Record<PositionPurpose, string> = {
  CORE: "コア資産",
  INCOME: "配当・優待",
  GROWTH: "成長",
  THEME: "テーマ",
  REBOUND: "反発狙い",
  WATCH: "監視のみ"
};

export const investmentHorizonDescriptions: Record<InvestmentHorizon, string> = {
  SHORT: "数日〜数週間の短期売買向け。利確・損切り判定が早めに出ます。",
  MEDIUM: "数ヶ月〜1年程度の中期保有向け。テーマ継続や決算を見ながら判断します。",
  LONG: "1年以上の長期保有向け。短期値動きより、事業・配当・長期トレンドを重視します。"
};

export const positionPurposeDescriptions: Record<PositionPurpose, string> = {
  CORE: "S&P500など資産の土台にする枠です。",
  INCOME: "配当・優待を目的に保有する枠です。",
  GROWTH: "長期成長を期待して保有する枠です。",
  THEME: "半導体・防衛などテーマ性を狙う枠です。",
  REBOUND: "下落後の反発を狙う枠です。",
  WATCH: "まだ買わずに監視する枠です。"
};

export function normalizeInvestmentHorizon(value: unknown, accountType: AccountType, tags: string[]): InvestmentHorizon {
  if (value === "SHORT" || value === "MEDIUM" || value === "LONG") {
    return value;
  }

  const tagSet = new Set(tags);
  if (longTags.some((tag) => tagSet.has(tag))) return "LONG";
  if (themeTags.some((tag) => tagSet.has(tag))) return accountType === "TOKUTEI" ? "SHORT" : "MEDIUM";
  if (accountType === "NISA") return "LONG";
  if (accountType === "TOKUTEI") return "SHORT";
  if (accountType === "WATCH_ONLY") return "MEDIUM";
  return "MEDIUM";
}

export function normalizePositionPurpose(value: unknown, accountType: AccountType, tags: string[]): PositionPurpose {
  if (value === "CORE" || value === "INCOME" || value === "GROWTH" || value === "THEME" || value === "REBOUND" || value === "WATCH") {
    return value;
  }

  const tagSet = new Set(tags);
  if (tagSet.has("sp500") || tagSet.has("index")) return "CORE";
  if (tagSet.has("dividend") || tagSet.has("shareholder_benefit")) return "INCOME";
  if (["semiconductor", "ai", "defense", "datacenter", "space"].some((tag) => tagSet.has(tag))) return "THEME";
  if (["game", "ip", "growth", "software"].some((tag) => tagSet.has(tag))) return "GROWTH";
  if (accountType === "WATCH_ONLY") return "WATCH";
  return "WATCH";
}

export function strategyDescription(stock: Stock, holding: Holding | null) {
  const horizon = holding?.investmentHorizon ?? "MEDIUM";
  const purpose = holding?.positionPurpose ?? "WATCH";
  const horizonLabel = investmentHorizonLabels[horizon];
  const purposeLabel = positionPurposeLabels[purpose];

  if (purpose === "CORE") {
    return "この銘柄はコア資産として設定されています。短期売買ではなく、長期積立・資産形成を重視します。";
  }

  if (horizon === "SHORT" && purpose === "THEME") {
    return `この銘柄は短期テーマ枠として設定されています。+10〜20%の利益では一部利確候補になりやすく、損切りラインも近めに判定されます。`;
  }

  if (horizon === "LONG" && purpose === "INCOME") {
    return "この銘柄は長期配当枠として設定されています。短期的な上昇だけでは売り判定を強く出さず、減配・長期トレンド崩れを重視します。";
  }

  if (horizon === "LONG") {
    return `この銘柄は${horizonLabel}${purposeLabel}枠です。短期値動きだけでなく、事業の継続性や長期トレンドを重視して監視します。`;
  }

  return `この銘柄は${horizonLabel}${purposeLabel}枠です。価格ライン、テーマ継続、出来高、リスクの変化を見ながら候補として監視します。`;
}
