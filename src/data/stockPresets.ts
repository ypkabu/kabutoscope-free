import { initial130kStocks } from "./initial130kPlan";
import type { ImportedStockInput } from "@/lib/importStocks";

export type StockPreset = {
  id: string;
  name: string;
  description: string;
  stocks: ImportedStockInput[];
};

const stock = (
  symbol: string,
  name: string,
  tags: string[],
  accountType: ImportedStockInput["accountType"],
  investmentHorizon: ImportedStockInput["investmentHorizon"],
  positionPurpose: ImportedStockInput["positionPurpose"],
  memo: string,
  market = symbol.endsWith(".T") ? "JP_STOCK" : "US_STOCK"
): ImportedStockInput => ({
  symbol,
  name,
  market,
  country: symbol.endsWith(".T") || symbol === "SP500_FUND" ? "JP" : "US",
  sector: tags[0] ?? "other",
  accountType,
  investmentHorizon,
  positionPurpose,
  tags,
  buyBelow: 0,
  takeProfit: 0,
  strongTakeProfit: 0,
  stopLoss: 0,
  notifyEnabled: false,
  memo
});

export const stockPresets: StockPreset[] = [
  {
    id: "initial-130k",
    name: "13万円初期プラン",
    description: "楽天NISA・SBI特定・現金を分けた初期プランです。",
    stocks: initial130kStocks
  },
  {
    id: "long-term-nisa",
    name: "長期NISA候補セット",
    description: "長期保有・配当・コア資産を重視する候補です。",
    stocks: [
      stock("SP500_FUND", "eMAXIS Slim 米国株式 S&P500", ["sp500", "index", "long_term", "nisa", "diversified"], "NISA", "LONG", "CORE", "長期の土台", "FUND"),
      stock("9434.T", "ソフトバンク", ["dividend", "shareholder_benefit", "telecom", "defensive", "long_term"], "NISA", "LONG", "INCOME", "配当・優待候補"),
      stock("9432.T", "NTT", ["dividend", "telecom", "infrastructure", "defensive", "long_term"], "NISA", "LONG", "INCOME", "通信インフラ候補"),
      stock("7974.T", "任天堂", ["game", "ip", "growth", "long_term"], "NISA", "LONG", "GROWTH", "ゲームIP長期候補"),
      stock("6758.T", "ソニーグループ", ["game", "entertainment", "growth", "long_term"], "NISA", "LONG", "GROWTH", "エンタメ・半導体含む長期候補"),
      stock("7203.T", "トヨタ自動車", ["mega_cap", "manufacturing", "long_term"], "NISA", "LONG", "CORE", "日本大型株候補"),
      stock("8058.T", "三菱商事", ["dividend", "trading_company", "long_term"], "NISA", "LONG", "INCOME", "総合商社候補"),
      stock("8001.T", "伊藤忠商事", ["dividend", "trading_company", "long_term"], "NISA", "LONG", "INCOME", "総合商社候補")
    ]
  },
  {
    id: "semiconductor-ai",
    name: "半導体・AI短期候補セット",
    description: "テーマ性と値動きを重視する監視候補です。",
    stocks: [
      stock("6526.T", "ソシオネクスト", ["semiconductor", "ai", "high_volatility", "growth", "tokutei"], "TOKUTEI", "SHORT", "THEME", "半導体短期候補"),
      stock("6857.T", "アドバンテスト", ["semiconductor", "ai", "high_volatility", "growth"], "WATCH_ONLY", "MEDIUM", "GROWTH", "AI半導体テスター候補"),
      stock("5803.T", "フジクラ", ["ai", "datacenter", "optical_fiber", "high_volatility"], "WATCH_ONLY", "SHORT", "THEME", "データセンター関連"),
      stock("5801.T", "古河電気工業", ["ai", "datacenter", "optical_fiber", "high_volatility"], "WATCH_ONLY", "SHORT", "THEME", "光ファイバー関連"),
      stock("6146.T", "ディスコ", ["semiconductor", "high_quality", "high_price", "high_volatility"], "WATCH_ONLY", "MEDIUM", "GROWTH", "半導体製造装置候補"),
      stock("NVDA", "NVIDIA", ["ai", "semiconductor", "mega_cap", "growth", "high_volatility"], "WATCH_ONLY", "LONG", "GROWTH", "米国AI半導体候補"),
      stock("AMD", "Advanced Micro Devices", ["ai", "semiconductor", "growth", "high_volatility"], "WATCH_ONLY", "MEDIUM", "THEME", "米国半導体候補"),
      stock("ASML", "ASML", ["semiconductor", "equipment", "long_term"], "WATCH_ONLY", "LONG", "GROWTH", "半導体装置候補"),
      stock("TSM", "Taiwan Semiconductor", ["semiconductor", "foundry", "long_term"], "WATCH_ONLY", "LONG", "GROWTH", "ファウンドリ候補"),
      stock("PLTR", "Palantir", ["ai", "software", "growth", "high_volatility"], "WATCH_ONLY", "MEDIUM", "THEME", "AIソフトウェア候補")
    ]
  },
  {
    id: "defense-heavy",
    name: "防衛・重工テーマ候補セット",
    description: "防衛・宇宙・重工のテーマ候補です。",
    stocks: [
      stock("7013.T", "IHI", ["defense", "space", "energy", "high_volatility"], "TOKUTEI", "SHORT", "THEME", "防衛・宇宙テーマ"),
      stock("7011.T", "三菱重工業", ["defense", "space", "infrastructure", "high_volatility"], "WATCH_ONLY", "MEDIUM", "THEME", "防衛・重工テーマ"),
      stock("7012.T", "川崎重工業", ["defense", "heavy_industry", "high_volatility"], "WATCH_ONLY", "MEDIUM", "THEME", "重工テーマ"),
      stock("6503.T", "三菱電機", ["infrastructure", "defense", "long_term"], "WATCH_ONLY", "MEDIUM", "THEME", "防衛・インフラ候補")
    ]
  },
  {
    id: "game-entertainment",
    name: "ゲーム・エンタメ候補セット",
    description: "ゲームIPとエンタメ成長を監視する候補です。",
    stocks: [
      stock("7974.T", "任天堂", ["game", "ip", "growth", "long_term"], "NISA", "LONG", "GROWTH", "ゲームIP長期候補"),
      stock("9697.T", "カプコン", ["game", "growth", "long_term"], "WATCH_ONLY", "MEDIUM", "GROWTH", "ゲーム成長候補"),
      stock("6758.T", "ソニーグループ", ["game", "entertainment", "growth", "long_term"], "NISA", "LONG", "GROWTH", "エンタメ大型候補"),
      stock("7832.T", "バンダイナムコホールディングス", ["game", "ip", "entertainment"], "WATCH_ONLY", "MEDIUM", "GROWTH", "IPエンタメ候補"),
      stock("9766.T", "コナミグループ", ["game", "entertainment", "growth"], "WATCH_ONLY", "MEDIUM", "GROWTH", "ゲーム候補")
    ]
  },
  {
    id: "dividend-benefit",
    name: "高配当・優待候補セット",
    description: "配当・優待・インカム目的の監視候補です。",
    stocks: [
      stock("9434.T", "ソフトバンク", ["dividend", "shareholder_benefit", "telecom", "defensive", "long_term"], "NISA", "LONG", "INCOME", "配当・優待候補"),
      stock("9432.T", "NTT", ["dividend", "telecom", "infrastructure", "defensive", "long_term"], "NISA", "LONG", "INCOME", "通信インフラ候補"),
      stock("8267.T", "イオン", ["shareholder_benefit", "retail", "defensive"], "WATCH_ONLY", "LONG", "INCOME", "優待候補"),
      stock("8593.T", "三菱HCキャピタル", ["dividend", "finance", "long_term"], "WATCH_ONLY", "LONG", "INCOME", "配当候補"),
      stock("8306.T", "三菱UFJフィナンシャル・グループ", ["bank", "dividend", "value"], "WATCH_ONLY", "MEDIUM", "INCOME", "銀行・配当候補")
    ]
  },
  {
    id: "us-ai-mega",
    name: "米国AI大型株候補セット",
    description: "米国AI・大型株の監視候補です。",
    stocks: [
      stock("NVDA", "NVIDIA", ["ai", "semiconductor", "mega_cap", "growth", "high_volatility"], "WATCH_ONLY", "LONG", "GROWTH", "AI半導体候補"),
      stock("MSFT", "Microsoft", ["ai", "software", "mega_cap", "long_term"], "WATCH_ONLY", "LONG", "CORE", "米国大型コア候補"),
      stock("AAPL", "Apple", ["mega_cap", "long_term"], "WATCH_ONLY", "LONG", "CORE", "米国大型候補"),
      stock("AMD", "Advanced Micro Devices", ["ai", "semiconductor", "growth", "high_volatility"], "WATCH_ONLY", "MEDIUM", "THEME", "AI半導体候補"),
      stock("PLTR", "Palantir", ["ai", "software", "growth", "high_volatility"], "WATCH_ONLY", "MEDIUM", "THEME", "AIソフトウェア候補"),
      stock("AMZN", "Amazon", ["ai", "cloud", "mega_cap", "growth"], "WATCH_ONLY", "LONG", "GROWTH", "クラウド・AI候補"),
      stock("GOOGL", "Alphabet", ["ai", "software", "mega_cap", "long_term"], "WATCH_ONLY", "LONG", "CORE", "米国大型候補"),
      stock("META", "Meta Platforms", ["ai", "software", "mega_cap", "growth"], "WATCH_ONLY", "LONG", "GROWTH", "AI・広告候補")
    ]
  }
];
