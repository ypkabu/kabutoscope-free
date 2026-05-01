import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getPortfolioSettings, getTargetPortfolio } from "@/lib/portfolio";
import { getStockOverviews } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function Initial130kPlanPage() {
  const [settings, targets, overviews] = await Promise.all([getPortfolioSettings(), getTargetPortfolio(), getStockOverviews()]);
  const bySymbol = new Map(overviews.map((row) => [row.stock.symbol, row]));
  const nisa = targets.filter((target) => target.targetAccountType === "NISA");
  const tokutei = targets.filter((target) => target.targetAccountType === "TOKUTEI");
  const cash = targets.find((target) => target.targetAccountType === "CASH");

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>13万円プラン</h1>
          <p className="muted">現在の総資金 {formatPrice(settings.totalBudget, "JPY")} を前提に、買い候補・待ち・監視のみを整理します。</p>
        </div>
        <Link href="/portfolio/settings">資金設定を変更</Link>
      </div>
      <PlanSection title="楽天NISAで買う予定" targets={nisa} bySymbol={bySymbol} />
      <PlanSection title="SBI特定で買う予定" targets={tokutei} bySymbol={bySymbol} />
      <section className="card" style={{ marginTop: 16 }}>
        <h2>現金</h2>
        <p>{formatPrice(cash?.targetAmount ?? 10000, "JPY")}以上を目標に監視します。現在: {formatPrice(settings.cashAmount, "JPY")}</p>
      </section>
    </>
  );
}

function PlanSection({ title, targets, bySymbol }: { title: string; targets: Awaited<ReturnType<typeof getTargetPortfolio>>; bySymbol: Map<string, Awaited<ReturnType<typeof getStockOverviews>>[number]> }) {
  return (
    <section className="card" style={{ marginTop: 16 }}>
      <h2>{title}</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>銘柄</th>
              <th>現在価格</th>
              <th>必要金額</th>
              <th>買いライン</th>
              <th>現在の判定</th>
              <th>目標との差分</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((target) => {
              const row = bySymbol.get(target.symbol);
              const price = row?.latestSnapshot?.currentPrice ?? row?.holding?.averagePrice ?? null;
              const required = target.targetAmount ?? (price && target.targetQuantity ? price * target.targetQuantity : null);
              const diff = target.targetQuantity ? (row?.holding?.quantity ?? 0) - target.targetQuantity : 0;
              return (
                <tr key={target.id}>
                  <td>{target.symbol}<span className="muted block">{target.name}</span></td>
                  <td>{formatPrice(price, row?.latestSnapshot?.currency)}</td>
                  <td>{formatPrice(required, "JPY")}</td>
                  <td>{formatPrice(row?.alertSetting?.buyBelow, row?.latestSnapshot?.currency)}</td>
                  <td>{row?.scoring?.overallLabel ?? "監視のみ"}</td>
                  <td>{target.targetQuantity ? diff : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
