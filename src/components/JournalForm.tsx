"use client";

import { useState } from "react";
import { addJournalAction } from "@/lib/actions";
import { accountTypeLabels, actionTypeLabels, emotionTagLabels, getJournalTemplate } from "@/lib/journalLabels";
import type { AccountType, EmotionTag, InvestmentHorizon, PositionPurpose, TradeActionType } from "@/lib/types";

type JournalFormProps = {
  stockId?: string;
  symbol?: string;
  accountType?: AccountType;
  investmentHorizon?: InvestmentHorizon;
  positionPurpose?: PositionPurpose;
  currentPrice?: number | null;
  buyBelow?: number | null;
  takeProfit?: number | null;
  strongTakeProfit?: number | null;
  stopLoss?: number | null;
};

type JournalValues = {
  symbol: string;
  actionType: TradeActionType;
  accountType: AccountType;
  price: string;
  quantity: string;
  reason: string;
  expectedScenario: string;
  exitCondition: string;
  takeProfitCondition: string;
  stopLossCondition: string;
  emotionTag: EmotionTag;
};

export function JournalForm({
  stockId,
  symbol = "",
  accountType = "WATCH_ONLY",
  investmentHorizon = "MEDIUM",
  positionPurpose = "WATCH",
  currentPrice,
  buyBelow,
  takeProfit,
  strongTakeProfit,
  stopLoss
}: JournalFormProps) {
  const [values, setValues] = useState<JournalValues>({
    symbol,
    actionType: "BUY_PLAN",
    accountType,
    price: currentPrice === null || currentPrice === undefined ? "" : String(currentPrice),
    quantity: "",
    reason: "",
    expectedScenario: "",
    exitCondition: "",
    takeProfitCondition: "",
    stopLossCondition: "",
    emotionTag: "planned"
  });

  const quantityWarning =
    (values.actionType === "BUY" || values.actionType === "SELL") && values.quantity.trim() === ""
      ? "実際の売買記録では数量を入れると後で振り返りやすくなります。"
      : "";
  const priceText = values.price.trim() === "" ? "価格未入力" : `価格: ${Number(values.price).toLocaleString("ja-JP")}円`;

  function update<K extends keyof JournalValues>(key: K, value: JournalValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function applyTemplate() {
    const template = getJournalTemplate(values.symbol, values.actionType, values.accountType, investmentHorizon, positionPurpose);
    if (!template) {
      update("reason", "この銘柄の専用テンプレートはまだありません。買う理由、見直し条件、利確条件、損切り条件を自分の言葉で記録してください。");
      return;
    }
    setValues((current) => ({ ...current, ...template }));
  }

  function clearText() {
    setValues((current) => ({
      ...current,
      quantity: "",
      reason: "",
      expectedScenario: "",
      exitCondition: "",
      takeProfitCondition: "",
      stopLossCondition: "",
      emotionTag: "planned"
    }));
  }

  return (
    <form className="formGrid" action={addJournalAction}>
      <input type="hidden" name="returnTo" value={symbol ? `/stocks/${encodeURIComponent(symbol)}` : "/journal"} />
      {stockId ? <input type="hidden" name="stockId" value={stockId} /> : null}
      <label>
        銘柄
        <input name="symbol" value={values.symbol} onChange={(event) => update("symbol", event.target.value)} placeholder="例：6526.T" required />
      </label>
      <label>
        種類
        <select name="actionType" value={values.actionType} onChange={(event) => update("actionType", event.target.value as TradeActionType)}>
          {Object.entries(actionTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        口座区分
        <select name="accountType" value={values.accountType} onChange={(event) => update("accountType", event.target.value as AccountType)}>
          {Object.entries(accountTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        価格
        <input name="price" type="number" min="0" step="0.01" value={values.price} onChange={(event) => update("price", event.target.value)} placeholder="価格未入力でも保存できます" />
        <span className="muted">{priceText}</span>
      </label>
      <label>
        数量
        <input name="quantity" type="number" min="0" step="0.01" value={values.quantity} onChange={(event) => update("quantity", event.target.value)} placeholder="未定なら空欄でOK" />
        {quantityWarning ? <span className="notice">{quantityWarning}</span> : null}
      </label>
      <label>
        なぜこの銘柄を買う/見直すのか
        <textarea
          name="reason"
          value={values.reason}
          onChange={(event) => update("reason", event.target.value)}
          placeholder="例：決算後に大きく下落し、買いラインに近づいたため。ただし業績ブレが大きいため少額で監視したい。"
        />
      </label>
      <label>
        期待シナリオ
        <textarea
          name="expectedScenario"
          value={values.expectedScenario}
          onChange={(event) => update("expectedScenario", event.target.value)}
          placeholder="例：半導体テーマが継続し、数週間〜数ヶ月で2,400円付近まで反発する。出来高が戻れば上昇継続を期待。"
        />
      </label>
      <label>
        見直し条件
        <textarea
          name="exitCondition"
          value={values.exitCondition}
          onChange={(event) => update("exitCondition", event.target.value)}
          placeholder="例：1,700円を割る、追加の悪材料が出る、次の決算で成長鈍化が確認される、半導体全体の地合いが崩れる。"
        />
      </label>
      <label>
        利確条件
        <textarea
          name="takeProfitCondition"
          value={values.takeProfitCondition}
          onChange={(event) => update("takeProfitCondition", event.target.value)}
          placeholder="例：2,400円で一部利確を検討。2,700円以上なら強めに利確を検討。"
        />
      </label>
      <label>
        損切り条件
        <textarea
          name="stopLossCondition"
          value={values.stopLossCondition}
          onChange={(event) => update("stopLossCondition", event.target.value)}
          placeholder="例：1,700円割れで見直し。1,650円割れかつ悪材料ありなら損切り検討。"
        />
      </label>
      <label>
        感情タグ
        <select name="emotionTag" value={values.emotionTag} onChange={(event) => update("emotionTag", event.target.value as EmotionTag)}>
          {Object.entries(emotionTagLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>

      <div className="buttonRow">
        <button type="button" onClick={applyTemplate}>テンプレートを入れる</button>
        <button type="button" onClick={() => update("price", currentPrice === null || currentPrice === undefined ? "" : String(currentPrice))}>現在値を価格に入れる</button>
        <button type="button" onClick={() => update("exitCondition", buyBelow ? `買いライン${buyBelow.toLocaleString("ja-JP")}円付近で、出来高や地合いを確認して見直す。` : values.exitCondition)}>買いラインを見直し条件に入れる</button>
        <button type="button" onClick={() => update("takeProfitCondition", takeProfit ? `${takeProfit.toLocaleString("ja-JP")}円で一部利確を検討。${strongTakeProfit ? `${strongTakeProfit.toLocaleString("ja-JP")}円以上なら強めに利確を検討。` : ""}` : values.takeProfitCondition)}>利確ラインを利確条件に入れる</button>
        <button type="button" onClick={() => update("stopLossCondition", stopLoss ? `${stopLoss.toLocaleString("ja-JP")}円割れで見直し。悪材料を伴う場合は損切り検討。` : values.stopLossCondition)}>損切りラインを損切り条件に入れる</button>
        <button type="button" onClick={clearText}>内容をクリア</button>
      </div>

      <button type="submit">判断メモを保存</button>
    </form>
  );
}
