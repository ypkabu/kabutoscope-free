import { createServiceSupabaseClient } from "./supabase";
import { normalizeInvestmentHorizon, normalizePositionPurpose } from "./strategy";
import type { AccountType, InvestmentHorizon, PositionPurpose, TargetAccountType } from "./types";

export type ImportedStockInput = {
  symbol: string;
  name: string;
  market: string;
  country?: string;
  sector?: string;
  accountType: AccountType;
  investmentHorizon?: InvestmentHorizon;
  positionPurpose?: PositionPurpose;
  tags?: string[];
  buyBelow?: number | null;
  takeProfit?: number | null;
  strongTakeProfit?: number | null;
  stopLoss?: number | null;
  maxInvestmentAmount?: number | null;
  maxPortfolioWeight?: number | null;
  notifyEnabled?: boolean;
  memo?: string | null;
};

export type TargetPlanInput = {
  symbol: string;
  name: string;
  targetAccountType: TargetAccountType;
  targetQuantity?: number | null;
  targetAmount?: number | null;
  priority: number;
  memo?: string | null;
};

export type ImportValidationItem = {
  row: number;
  symbol?: string;
  errors: string[];
  warnings: string[];
};

export type NormalizedImportedStock = Required<Omit<ImportedStockInput, "buyBelow" | "takeProfit" | "strongTakeProfit" | "stopLoss" | "maxInvestmentAmount" | "maxPortfolioWeight" | "memo">> & {
  buyBelow: number | null;
  takeProfit: number | null;
  strongTakeProfit: number | null;
  stopLoss: number | null;
  maxInvestmentAmount: number | null;
  maxPortfolioWeight: number | null;
  memo: string | null;
};

export type ImportResult = {
  successCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
  registeredSymbols: string[];
  updatedSymbols: string[];
  skippedSymbols: string[];
};

const accountTypes = new Set(["NISA", "TOKUTEI", "WATCH_ONLY"]);
const markets = new Set(["TSE", "NASDAQ", "NYSE", "FUND", "OTHER", "JP_STOCK", "US_STOCK"]);

export function parseImportText(text: string): unknown[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) return JSON.parse(trimmed);
  return parseCsv(trimmed);
}

export function normalizeImportedStocks(rows: unknown[]): { stocks: NormalizedImportedStock[]; validation: ImportValidationItem[] } {
  const stocks: NormalizedImportedStock[] = [];
  const validation: ImportValidationItem[] = [];

  rows.forEach((raw, index) => {
    const row = raw as Record<string, unknown>;
    const errors: string[] = [];
    const warnings: string[] = [];
    const symbol = stringValue(row.symbol).trim();
    const name = stringValue(row.name).trim();
    const market = stringValue(row.market).trim();
    const accountType = stringValue(row.accountType || row.account_type).trim() as AccountType;
    const tags = normalizeTags(row.tags);

    if (!symbol) errors.push("symbol は必須です。");
    if (!name) errors.push("name は必須です。");
    if (!market) errors.push("market は必須です。");
    if (!accountTypes.has(accountType)) errors.push("accountType が不正です。NISA / TOKUTEI / WATCH_ONLY を指定してください。");
    if (!markets.has(market)) errors.push("market が不正です。JP_STOCK / US_STOCK / FUND などを指定してください。");
    if (tags.length === 0) warnings.push("tags が空です。スコアリングの判定材料が少なくなります。");

    const buyBelow = numberOrNull(row.buyBelow);
    const takeProfit = numberOrNull(row.takeProfit);
    const strongTakeProfit = numberOrNull(row.strongTakeProfit);
    const stopLoss = numberOrNull(row.stopLoss);
    const maxInvestmentAmount = numberOrNull(row.maxInvestmentAmount);
    const maxPortfolioWeight = numberOrNull(row.maxPortfolioWeight);
    const numericChecks = [
      ["buyBelow", buyBelow],
      ["takeProfit", takeProfit],
      ["strongTakeProfit", strongTakeProfit],
      ["stopLoss", stopLoss],
      ["maxInvestmentAmount", maxInvestmentAmount]
    ] as const;
    for (const [label, value] of numericChecks) {
      if (value !== null && value < 0) errors.push(`${label} は0以上にしてください。`);
    }
    if (maxPortfolioWeight !== null && (maxPortfolioWeight < 0 || maxPortfolioWeight > 1)) {
      errors.push("maxPortfolioWeight は0〜1で指定してください。");
    }
    if (strongTakeProfit !== null && takeProfit !== null && strongTakeProfit < takeProfit) {
      warnings.push("strongTakeProfit が takeProfit より低くなっています。");
    }
    if (stopLoss !== null && buyBelow !== null && stopLoss > buyBelow) {
      warnings.push("stopLoss が buyBelow より高くなっています。設定意図を確認してください。");
    }

    const safeAccountType = accountTypes.has(accountType) ? accountType : "WATCH_ONLY";
    const investmentHorizon = normalizeInvestmentHorizon(row.investmentHorizon, safeAccountType, tags);
    const positionPurpose = normalizePositionPurpose(row.positionPurpose, safeAccountType, tags);

    validation.push({ row: index + 1, symbol, errors, warnings });
    if (errors.length === 0) {
      stocks.push({
        symbol,
        name,
        market,
        country: stringValue(row.country || "JP"),
        sector: stringValue(row.sector || "other"),
        accountType: safeAccountType,
        investmentHorizon,
        positionPurpose,
        tags,
        buyBelow,
        takeProfit,
        strongTakeProfit,
        stopLoss,
        maxInvestmentAmount,
        maxPortfolioWeight,
        notifyEnabled: booleanValue(row.notifyEnabled, true),
        memo: stringValue(row.memo || "") || null
      });
    }
  });

  return { stocks, validation };
}

export async function importStocks(stocks: NormalizedImportedStock[], mode: "update" | "skip"): Promise<ImportResult> {
  const supabase = createServiceSupabaseClient();
  if (!supabase) {
    throw new Error("Supabaseのサービスロール設定がありません。");
  }

  const result: ImportResult = {
    successCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    errors: [],
    registeredSymbols: [],
    updatedSymbols: [],
    skippedSymbols: []
  };

  for (const stock of stocks) {
    try {
      const { data: existing } = await supabase.from("stocks").select("id").eq("symbol", stock.symbol).maybeSingle();
      if (existing && mode === "skip") {
        result.skippedCount += 1;
        result.skippedSymbols.push(stock.symbol);
        continue;
      }

      const { data: upserted, error: stockError } = await supabase
        .from("stocks")
        .upsert(
          {
            symbol: stock.symbol,
            name: stock.name,
            market: stock.market,
            country: stock.country,
            sector: stock.sector,
            tags: stock.tags,
            enabled: stock.symbol !== "CASH"
          },
          { onConflict: "symbol" }
        )
        .select("id")
        .single();

      if (stockError) throw stockError;
      const stockId = upserted.id as string;

      await throwOnError(
        supabase.from("holdings").upsert(
          {
            stock_id: stockId,
            account_type: stock.accountType,
            investment_horizon: stock.investmentHorizon,
            position_purpose: stock.positionPurpose,
            quantity: 0,
            average_price: 0,
            memo: stock.memo
          },
          { onConflict: "stock_id" }
        )
      );

      await throwOnError(
        supabase.from("alert_settings").upsert(
          {
            stock_id: stockId,
            buy_below: stock.buyBelow,
            take_profit: stock.takeProfit,
            strong_take_profit: stock.strongTakeProfit,
            stop_loss: stock.stopLoss,
            notify_enabled: stock.notifyEnabled
          },
          { onConflict: "stock_id" }
        )
      );

      await throwOnError(
        supabase.from("risk_limits").upsert(
          {
            stock_id: stockId,
            max_investment_amount: stock.maxInvestmentAmount,
            max_portfolio_weight: stock.maxPortfolioWeight,
            warning_enabled: true
          },
          { onConflict: "stock_id" }
        )
      );

      if (existing) {
        result.updatedCount += 1;
        result.updatedSymbols.push(stock.symbol);
      } else {
        result.successCount += 1;
        result.registeredSymbols.push(stock.symbol);
      }
    } catch (error) {
      result.errorCount += 1;
      result.errors.push(`${stock.symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return result;
}

export async function setupTargetPlan(targets: TargetPlanInput[]) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) throw new Error("Supabaseのサービスロール設定がありません。");
  for (const target of targets) {
    await throwOnError(
      supabase.from("target_portfolio").upsert(
        {
          symbol: target.symbol,
          name: target.name,
          target_account_type: target.targetAccountType,
          target_quantity: target.targetQuantity ?? null,
          target_amount: target.targetAmount ?? null,
          priority: target.priority,
          memo: target.memo ?? null
        },
        { onConflict: "symbol" }
      )
    );
  }
  await throwOnError(
    supabase.from("portfolio_settings").upsert(
      {
        id: 1,
        total_budget: 130000,
        cash_amount: 130000,
        rakuten_nisa_budget: 65000,
        sbi_tokutei_budget: 50000,
        minimum_cash_ratio: 0.1,
        warning_cash_ratio: 0.2
      },
      { onConflict: "id" }
    )
  );
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normalizeTags(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (typeof value === "string") return value.split("|").map((tag) => tag.trim()).filter(Boolean);
  return [];
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function booleanValue(value: unknown, fallback: boolean) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return fallback;
}

function stringValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

async function throwOnError(promise: PromiseLike<{ error: unknown }>) {
  const { error } = await promise;
  if (error) throw error;
}
