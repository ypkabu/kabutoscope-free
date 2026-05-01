"use client";

import Link from "next/link";
import { useState } from "react";
import { stockPresets } from "@/data/stockPresets";
import type { ImportResult } from "@/lib/importStocks";

export function PresetsClient() {
  const [mode, setMode] = useState<"update" | "skip">("update");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [message, setMessage] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function registerPreset(presetId: string, setup130k = false) {
    setLoadingId(presetId);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/import/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presetId, mode, setup130k })
      });
      const json = await response.json();
      setResult(json.result ?? null);
      setMessage(response.ok ? "プリセット登録が完了しました。" : json.message ?? "登録に失敗しました。");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>登録方法</h2>
        <div className="formRow">
          <label><input type="radio" checked={mode === "update"} onChange={() => setMode("update")} /> 既存銘柄を更新する</label>
          <label><input type="radio" checked={mode === "skip"} onChange={() => setMode("skip")} /> 既存銘柄はスキップする</label>
        </div>
        <button onClick={() => registerPreset("initial-130k", true)} disabled={loadingId !== null}>13万円プランをセットアップ</button>
        {message ? <p className="notice">{message}</p> : null}
      </section>

      <section className="grid dashboardGrid">
        {stockPresets.map((preset) => (
          <article className="card" key={preset.id}>
            <h2>{preset.name}</h2>
            <p className="muted">{preset.description}</p>
            <p>{preset.stocks.length}銘柄</p>
            <button onClick={() => registerPreset(preset.id, preset.id === "initial-130k")} disabled={loadingId !== null}>
              {loadingId === preset.id ? "登録中..." : "このプリセットを登録"}
            </button>
          </article>
        ))}
      </section>

      {result ? (
        <section className="card">
          <h2>登録結果</h2>
          <p>登録成功: {result.successCount}件 / 更新: {result.updatedCount}件 / スキップ: {result.skippedCount}件 / エラー: {result.errorCount}件</p>
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
