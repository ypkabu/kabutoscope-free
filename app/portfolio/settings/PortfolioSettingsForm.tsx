"use client";

import { useState } from "react";
import { savePortfolioSettingsAction } from "@/lib/actions";
import type { PortfolioSettings } from "@/lib/types";

export function PortfolioSettingsForm({ settings }: { settings: PortfolioSettings }) {
  const [values, setValues] = useState(settings);

  function setMoney(key: "totalBudget" | "cashAmount" | "rakutenNisaBudget" | "sbiTokuteiBudget", delta: number) {
    setValues((current) => ({ ...current, [key]: Math.max(0, current[key] + delta) }));
  }

  function updateNumber(key: keyof PortfolioSettings, value: string) {
    setValues((current) => ({ ...current, [key]: Number(value) }));
  }

  return (
    <form className="card formGrid" action={savePortfolioSettingsAction}>
      <MoneyInput name="totalBudget" label="総資金" value={values.totalBudget} onChange={(value) => updateNumber("totalBudget", value)} onStep={(delta) => setMoney("totalBudget", delta)} />
      <MoneyInput name="cashAmount" label="現金" value={values.cashAmount} onChange={(value) => updateNumber("cashAmount", value)} onStep={(delta) => setMoney("cashAmount", delta)} />
      <MoneyInput name="rakutenNisaBudget" label="楽天NISA予定額" value={values.rakutenNisaBudget} onChange={(value) => updateNumber("rakutenNisaBudget", value)} onStep={(delta) => setMoney("rakutenNisaBudget", delta)} />
      <MoneyInput name="sbiTokuteiBudget" label="SBI特定口座予定額" value={values.sbiTokuteiBudget} onChange={(value) => updateNumber("sbiTokuteiBudget", value)} onStep={(delta) => setMoney("sbiTokuteiBudget", delta)} />
      <label>
        最低現金比率
        <input name="minimumCashRatio" type="number" step="0.01" min="0" max="1" value={values.minimumCashRatio} onChange={(event) => updateNumber("minimumCashRatio", event.target.value)} />
      </label>
      <label>
        警告現金比率
        <input name="warningCashRatio" type="number" step="0.01" min="0" max="1" value={values.warningCashRatio} onChange={(event) => updateNumber("warningCashRatio", event.target.value)} />
      </label>
      <button type="submit">保存</button>
    </form>
  );
}

function MoneyInput({ name, label, value, onChange, onStep }: { name: string; label: string; value: number; onChange: (value: string) => void; onStep: (delta: number) => void }) {
  return (
    <label>
      {label}
      <input name={name} type="number" min="0" step="1000" value={value} onChange={(event) => onChange(event.target.value)} />
      <span className="buttonRow">
        <button type="button" onClick={() => onStep(10000)}>+1万円</button>
        <button type="button" onClick={() => onStep(-10000)}>-1万円</button>
      </span>
    </label>
  );
}
