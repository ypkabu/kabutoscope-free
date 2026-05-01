"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ImportResult, ImportValidationItem, NormalizedImportedStock } from "@/lib/importStocks";

const sampleJson = `[
  {
    "symbol": "6526.T",
    "name": "ソシオネクスト",
    "market": "JP_STOCK",
    "country": "JP",
    "sector": "semiconductor",
    "accountType": "TOKUTEI",
    "investmentHorizon": "SHORT",
    "positionPurpose": "THEME",
    "tags": ["semiconductor", "ai", "high_volatility", "growth", "tokutei"],
    "buyBelow": 1900,
    "takeProfit": 2400,
    "strongTakeProfit": 2700,
    "stopLoss": 1700,
    "maxInvestmentAmount": 30000,
    "maxPortfolioWeight": 0.25,
    "notifyEnabled": true,
    "memo": "SBI特定口座の半導体短期・中期枠。買いすぎ注意。"
  }
]`;

export function ImportStocksClient() {
  const [text, setText] = useState(sampleJson);
  const [mode, setMode] = useState<"update" | "skip">("skip");
  const [stocks, setStocks] = useState<NormalizedImportedStock[]>([]);
  const [validation, setValidation] = useState<ImportValidationItem[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const hasErrors = useMemo(() => validation.some((item) => item.errors.length > 0), [validation]);

  async function validate() {
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const json = await response.json();
      setStocks(json.stocks ?? []);
      setValidation(json.validation ?? []);
      setMessage(response.ok ? "検証が完了しました。" : json.message ?? "検証に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/import/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode })
      });
      const json = await response.json();
      setValidation(json.validation ?? []);
      setResult(json.result ?? null);
      setMessage(response.ok ? "一括登録が完了しました。" : json.message ?? "一括登録に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>JSON / CSV 貼り付け</h2>
        <p className="muted">
          銘柄・アラート・タグ・口座分類・リスク上限・投資期間・保有目的をまとめて登録します。投資助言ではなく、自分用の情報整理です。
        </p>
        <textarea className="textarea" value={text} onChange={(event) => setText(event.target.value)} />
        <div className="formRow">
          <label>
            <input type="radio" checked={mode === "skip"} onChange={() => setMode("skip")} />
            既存銘柄はスキップする
          </label>
          <label>
            <input type="radio" checked={mode === "update"} onChange={() => setMode("update")} />
            既存銘柄を更新する
          </label>
        </div>
        <div className="buttonRow">
          <button onClick={validate} disabled={loading}>検証</button>
          <button onClick={submit} disabled={loading || hasErrors}>一括登録</button>
        </div>
        {message ? <p className="notice">{message}</p> : null}
      </section>

      <section className="card">
        <h2>登録前プレビュー</h2>
        {stocks.length === 0 ? (
          <p className="muted">検証すると登録予定の銘柄が表示されます。</p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>銘柄</th>
                  <th>口座</th>
                  <th>投資期間</th>
                  <th>目的</th>
                  <th>タグ</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr key={stock.symbol}>
                    <td>{stock.symbol}<span className="muted block">{stock.name}</span></td>
                    <td>{stock.accountType}</td>
                    <td>{stock.investmentHorizon}</td>
                    <td>{stock.positionPurpose}</td>
                    <td>{stock.tags.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <h2>検証結果</h2>
        {validation.length === 0 ? (
          <p className="muted">まだ検証していません。</p>
        ) : (
          <ul className="reasonList">
            {validation.map((item) => (
              <li key={item.row}>
                {item.row}行目 {item.symbol ?? ""}
                {item.errors.length > 0 ? ` / エラー: ${item.errors.join("、")}` : " / エラーなし"}
                {item.warnings.length > 0 ? ` / 警告: ${item.warnings.join("、")}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {result ? (
        <section className="card">
          <h2>登録結果</h2>
          <p>登録成功: {result.successCount}件 / 更新: {result.updatedCount}件 / スキップ: {result.skippedCount}件 / エラー: {result.errorCount}件</p>
          {result.errors.length > 0 ? <p className="notice">{result.errors.join(" / ")}</p> : null}
          <div className="tagList">
            {[...result.registeredSymbols, ...result.updatedSymbols].map((symbol) => (
              <Link key={symbol} className="tag" href={`/stocks/${encodeURIComponent(symbol)}`}>{symbol}</Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
