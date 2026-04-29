import type { AlertSetting, Holding, Stock } from "./types";

const now = "2026-04-30T00:00:00.000Z";

export const seedStocks: Stock[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    symbol: "9434.T",
    name: "ソフトバンク",
    market: "TSE",
    country: "JP",
    sector: "通信",
    tags: ["dividend", "shareholder_benefit", "telecom", "defensive", "long_term"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    symbol: "9432.T",
    name: "NTT",
    market: "TSE",
    country: "JP",
    sector: "通信",
    tags: ["dividend", "telecom", "infrastructure", "defensive", "long_term"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    symbol: "7974.T",
    name: "任天堂",
    market: "TSE",
    country: "JP",
    sector: "ゲーム",
    tags: ["game", "ip", "growth", "long_term"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    symbol: "SP500_FUND",
    name: "eMAXIS Slim 米国株式 S&P500",
    market: "FUND",
    country: "JP",
    sector: "投資信託",
    tags: ["sp500", "index", "long_term", "nisa", "diversified"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    symbol: "6526.T",
    name: "ソシオネクスト",
    market: "TSE",
    country: "JP",
    sector: "半導体",
    tags: ["semiconductor", "ai", "high_volatility", "growth", "tokutei"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    symbol: "6857.T",
    name: "アドバンテスト",
    market: "TSE",
    country: "JP",
    sector: "半導体",
    tags: ["semiconductor", "ai", "high_volatility", "growth", "tokutei"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000007",
    symbol: "9697.T",
    name: "カプコン",
    market: "TSE",
    country: "JP",
    sector: "ゲーム",
    tags: ["game", "growth", "long_term"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000008",
    symbol: "5803.T",
    name: "フジクラ",
    market: "TSE",
    country: "JP",
    sector: "電線",
    tags: ["ai", "datacenter", "optical_fiber", "high_volatility", "tokutei"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000009",
    symbol: "6146.T",
    name: "ディスコ",
    market: "TSE",
    country: "JP",
    sector: "半導体製造装置",
    tags: ["semiconductor", "high_quality", "high_price", "high_volatility"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000010",
    symbol: "NVDA",
    name: "NVIDIA",
    market: "NASDAQ",
    country: "US",
    sector: "Semiconductor",
    tags: ["ai", "semiconductor", "mega_cap", "growth", "high_volatility"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000011",
    symbol: "AMD",
    name: "Advanced Micro Devices",
    market: "NASDAQ",
    country: "US",
    sector: "Semiconductor",
    tags: ["ai", "semiconductor", "growth", "high_volatility"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000012",
    symbol: "PLTR",
    name: "Palantir",
    market: "NYSE",
    country: "US",
    sector: "Software",
    tags: ["ai", "software", "growth", "high_volatility"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000013",
    symbol: "MSFT",
    name: "Microsoft",
    market: "NASDAQ",
    country: "US",
    sector: "Software",
    tags: ["ai", "software", "mega_cap", "long_term"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000014",
    symbol: "AAPL",
    name: "Apple",
    market: "NASDAQ",
    country: "US",
    sector: "Consumer Technology",
    tags: ["mega_cap", "long_term"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000015",
    symbol: "ASML",
    name: "ASML",
    market: "NASDAQ",
    country: "NL",
    sector: "Semiconductor Equipment",
    tags: ["semiconductor", "equipment", "long_term"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: "00000000-0000-0000-0000-000000000016",
    symbol: "TSM",
    name: "Taiwan Semiconductor",
    market: "NYSE",
    country: "TW",
    sector: "Foundry",
    tags: ["semiconductor", "foundry", "long_term"],
    enabled: true,
    createdAt: now,
    updatedAt: now
  }
];

const idFor = (symbol: string) => seedStocks.find((stock) => stock.symbol === symbol)?.id ?? "";

export const seedHoldings: Holding[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    stockId: idFor("9434.T"),
    accountType: "NISA",
    quantity: 0,
    averagePrice: null,
    memo: "配当・優待・長期安定性を重視する監視候補",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    stockId: idFor("9432.T"),
    accountType: "NISA",
    quantity: 0,
    averagePrice: null,
    memo: "通信インフラの長期監視候補",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    stockId: idFor("7974.T"),
    accountType: "NISA",
    quantity: 0,
    averagePrice: null,
    memo: "IPとゲーム事業の長期成長を監視",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    stockId: idFor("SP500_FUND"),
    accountType: "NISA",
    quantity: 0,
    averagePrice: null,
    memo: "初版では手動監視の投資信託枠",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    stockId: idFor("6526.T"),
    accountType: "TOKUTEI",
    quantity: 0,
    averagePrice: null,
    memo: "短中期の値動きとテーマ性を監視",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    stockId: idFor("6857.T"),
    accountType: "TOKUTEI",
    quantity: 0,
    averagePrice: null,
    memo: "半導体テーマの短中期候補",
    createdAt: now,
    updatedAt: now
  },
  ...seedStocks
    .filter((stock) => !["9434.T", "9432.T", "7974.T", "SP500_FUND", "6526.T", "6857.T"].includes(stock.symbol))
    .map((stock, index) => ({
      id: `10000000-0000-0000-0000-${String(index + 7).padStart(12, "0")}`,
      stockId: stock.id,
      accountType: "WATCH_ONLY" as const,
      quantity: 0,
      averagePrice: null,
      memo: "追加監視候補",
      createdAt: now,
      updatedAt: now
    }))
];

const alertRows: Array<[string, number, number, number, number]> = [
  ["9434.T", 215, 240, 260, 200],
  ["9432.T", 150, 170, 180, 140],
  ["7974.T", 7500, 9000, 10000, 7000],
  ["6526.T", 1900, 2400, 2700, 1700],
  ["6857.T", 28000, 35000, 40000, 25000],
  ["9697.T", 3300, 4000, 4500, 3000],
  ["5803.T", 5500, 6800, 7200, 5000],
  ["6146.T", 65000, 80000, 90000, 60000]
];

export const seedAlertSettings: AlertSetting[] = seedStocks.map((stock, index) => {
  const alert = alertRows.find(([symbol]) => symbol === stock.symbol);
  return {
    id: `20000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
    stockId: stock.id,
    buyBelow: alert?.[1] ?? null,
    takeProfit: alert?.[2] ?? null,
    strongTakeProfit: alert?.[3] ?? null,
    stopLoss: alert?.[4] ?? null,
    notifyEnabled: true,
    createdAt: now,
    updatedAt: now
  };
});
