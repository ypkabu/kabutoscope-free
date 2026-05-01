"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeInvestmentHorizon, normalizePositionPurpose } from "./strategy";
import { savePortfolioSettings } from "./portfolio";
import { createServiceSupabaseClient } from "./supabase";
import type { AccountType, InvestmentHorizon, PortfolioSettings, PositionPurpose } from "./types";

export async function savePortfolioSettingsAction(formData: FormData) {
  const settings: PortfolioSettings = {
    totalBudget: numberFromForm(formData, "totalBudget"),
    cashAmount: numberFromForm(formData, "cashAmount"),
    rakutenNisaBudget: numberFromForm(formData, "rakutenNisaBudget"),
    sbiTokuteiBudget: numberFromForm(formData, "sbiTokuteiBudget"),
    minimumCashRatio: numberFromForm(formData, "minimumCashRatio"),
    warningCashRatio: numberFromForm(formData, "warningCashRatio")
  };

  const errors = validatePortfolioSettings(settings);
  if (errors.length > 0) {
    redirect(`/portfolio/settings?error=${encodeURIComponent(errors.join(" / "))}`);
  }

  await savePortfolioSettings(settings);
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/portfolio/settings");
  revalidatePath("/portfolio/target");
  revalidatePath("/plan/initial-130k");
  redirect("/portfolio/settings?saved=1");
}

export async function resetPortfolioSettingsAction() {
  await savePortfolioSettings({
    totalBudget: 130000,
    cashAmount: 130000,
    rakutenNisaBudget: 65000,
    sbiTokuteiBudget: 50000,
    minimumCashRatio: 0.1,
    warningCashRatio: 0.2
  }, "13万円プランに戻しました");
  revalidatePath("/");
  revalidatePath("/portfolio/settings");
  redirect("/portfolio/settings?saved=1");
}

export async function saveStockStrategyAction(formData: FormData) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) throw new Error("Supabaseのサービスロール設定がありません。");
  const stockId = String(formData.get("stockId") ?? "");
  const symbol = String(formData.get("symbol") ?? "");
  const accountType = String(formData.get("accountType") ?? "WATCH_ONLY") as AccountType;
  const previousInvestmentHorizon = String(formData.get("previousInvestmentHorizon") ?? "") as InvestmentHorizon;
  const previousPositionPurpose = String(formData.get("previousPositionPurpose") ?? "") as PositionPurpose;
  const investmentHorizon = String(formData.get("investmentHorizon") ?? "MEDIUM") as InvestmentHorizon;
  const positionPurpose = String(formData.get("positionPurpose") ?? "WATCH") as PositionPurpose;
  const reason = String(formData.get("reason") ?? "");

  const { error } = await supabase
    .from("holdings")
    .upsert(
      {
        stock_id: stockId,
        account_type: accountType,
        investment_horizon: investmentHorizon,
        position_purpose: positionPurpose
      },
      { onConflict: "stock_id" }
    );
  if (error) throw error;

  if (previousInvestmentHorizon !== investmentHorizon || previousPositionPurpose !== positionPurpose) {
    const { error: historyError } = await supabase.from("holding_strategy_history").insert({
      stock_id: stockId,
      symbol,
      previous_investment_horizon: previousInvestmentHorizon || null,
      new_investment_horizon: investmentHorizon,
      previous_position_purpose: previousPositionPurpose || null,
      new_position_purpose: positionPurpose,
      reason: reason || null
    });
    if (historyError) throw historyError;
  }

  revalidatePath(`/stocks/${encodeURIComponent(symbol)}`);
  revalidatePath("/stocks");
  redirect(`/stocks/${encodeURIComponent(symbol)}?saved=1`);
}

export async function createStockAction(formData: FormData) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) throw new Error("Supabaseのサービスロール設定がありません。");
  const symbol = String(formData.get("symbol") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const market = String(formData.get("market") ?? "JP_STOCK").trim();
  const country = String(formData.get("country") ?? "JP").trim();
  const sector = String(formData.get("sector") ?? "other").trim();
  const accountType = String(formData.get("accountType") ?? "WATCH_ONLY") as AccountType;
  const tags = String(formData.get("tags") ?? "").split(/[,\|]/).map((tag) => tag.trim()).filter(Boolean);
  const investmentHorizon = normalizeInvestmentHorizon(formData.get("investmentHorizon"), accountType, tags);
  const positionPurpose = normalizePositionPurpose(formData.get("positionPurpose"), accountType, tags);

  if (!symbol || !name) redirect(`/stocks/new?error=${encodeURIComponent("symbol と name は必須です。")}`);

  const { data: stock, error } = await supabase
    .from("stocks")
    .upsert({ symbol, name, market, country, sector, tags, enabled: true }, { onConflict: "symbol" })
    .select("id")
    .single();
  if (error) throw error;
  const stockId = stock.id as string;
  await supabase.from("holdings").upsert(
    {
      stock_id: stockId,
      account_type: accountType,
      investment_horizon: investmentHorizon,
      position_purpose: positionPurpose,
      quantity: 0,
      average_price: 0,
      memo: String(formData.get("memo") ?? "") || null
    },
    { onConflict: "stock_id" }
  );
  await supabase.from("alert_settings").upsert(
    {
      stock_id: stockId,
      buy_below: numberOrNull(formData.get("buyBelow")),
      take_profit: numberOrNull(formData.get("takeProfit")),
      strong_take_profit: numberOrNull(formData.get("strongTakeProfit")),
      stop_loss: numberOrNull(formData.get("stopLoss")),
      notify_enabled: formData.get("notifyEnabled") === "on"
    },
    { onConflict: "stock_id" }
  );
  revalidatePath("/stocks");
  redirect(`/stocks/${encodeURIComponent(symbol)}`);
}

export async function addJournalAction(formData: FormData) {
  const supabase = createServiceSupabaseClient();
  if (!supabase) throw new Error("Supabaseのサービスロール設定がありません。");
  const symbol = String(formData.get("symbol") ?? "");
  const { error } = await supabase.from("trade_journal").insert({
    stock_id: String(formData.get("stockId") ?? "") || null,
    symbol,
    action_type: String(formData.get("actionType") ?? "REVIEW"),
    account_type: String(formData.get("accountType") ?? "TOKUTEI"),
    price: numberOrNull(formData.get("price")),
    quantity: numberOrNull(formData.get("quantity")),
    reason: String(formData.get("reason") ?? "") || null,
    expected_scenario: String(formData.get("expectedScenario") ?? "") || null,
    exit_condition: String(formData.get("exitCondition") ?? "") || null,
    take_profit_condition: String(formData.get("takeProfitCondition") ?? "") || null,
    stop_loss_condition: String(formData.get("stopLossCondition") ?? "") || null,
    emotion_tag: String(formData.get("emotionTag") ?? "") || null
  });
  if (error) throw error;
  revalidatePath("/journal");
  revalidatePath(`/stocks/${encodeURIComponent(symbol)}`);
  redirect(symbol ? `/stocks/${encodeURIComponent(symbol)}?journal=1` : "/journal?saved=1");
}

function validatePortfolioSettings(settings: PortfolioSettings) {
  const errors: string[] = [];
  if (settings.totalBudget < 0) errors.push("総資金は0以上にしてください。");
  if (settings.cashAmount < 0) errors.push("現金は0以上にしてください。");
  if (settings.rakutenNisaBudget < 0) errors.push("楽天NISA予定額は0以上にしてください。");
  if (settings.sbiTokuteiBudget < 0) errors.push("SBI特定口座予定額は0以上にしてください。");
  if (settings.minimumCashRatio < 0 || settings.minimumCashRatio > 1) errors.push("最低現金比率は0〜1で入力してください。");
  if (settings.warningCashRatio < 0 || settings.warningCashRatio > 1) errors.push("警告現金比率は0〜1で入力してください。");
  if (settings.minimumCashRatio > settings.warningCashRatio) errors.push("最低現金比率は警告現金比率以下にしてください。");
  return errors;
}

function numberFromForm(formData: FormData, key: string) {
  return Number(formData.get(key) ?? 0);
}

function numberOrNull(value: FormDataEntryValue | null) {
  if (value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
