import { resetPortfolioSettingsAction } from "@/lib/actions";
import { calculateCashStatus, getPortfolioSettings } from "@/lib/portfolio";
import { formatPrice, formatPercent } from "@/lib/format";
import { PortfolioSettingsForm } from "./PortfolioSettingsForm";

export const dynamic = "force-dynamic";

export default async function PortfolioSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  const settings = await getPortfolioSettings();
  const status = calculateCashStatus(settings);

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>資金設定</h1>
          <p className="muted">総資金、現金、楽天NISA予定額、SBI特定口座予定額を画面から変更します。</p>
        </div>
      </div>

      {params.saved ? <p className="notice">資金設定を保存しました。</p> : null}
      {params.error ? <p className="notice">{params.error}</p> : null}

      <section className="grid twoCol">
        <PortfolioSettingsForm settings={settings} />

        <section className="card">
          <h2>自動計算</h2>
          <p>現金比率: {formatPercent(status.cashRatio * 100)} / {status.status}</p>
          <p>投資済み金額: {formatPrice(status.investedAmount, "JPY")}</p>
          <p>楽天NISA予定比率: {formatPercent(status.rakutenNisaRatio * 100)}</p>
          <p>SBI特定予定比率: {formatPercent(status.sbiTokuteiRatio * 100)}</p>
          {settings.cashAmount > settings.totalBudget ? <p className="notice">現金が総資金を超えています。入力意図を確認してください。</p> : null}
          {settings.rakutenNisaBudget + settings.sbiTokuteiBudget > settings.totalBudget ? <p className="notice">楽天NISA予定額とSBI特定予定額の合計が総資金を超えています。</p> : null}
          <form action={resetPortfolioSettingsAction}>
            <button type="submit">13万円プランに戻す</button>
          </form>
        </section>
      </section>
    </>
  );
}
