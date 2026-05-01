import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getPortfolioSettings, getTargetPortfolio } from "@/lib/portfolio";
import { getStockOverviews } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function TargetPortfolioPage() {
  const [targets, overviews, settings] = await Promise.all([getTargetPortfolio(), getStockOverviews(), getPortfolioSettings()]);
  const bySymbol = new Map(overviews.map((row) => [row.stock.symbol, row]));

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>目標ポートフォリオ</h1>
          <p className="muted">13万円プランなどの目標数量・金額と、現在の保有状況を比較します。</p>
        </div>
        <Link href="/portfolio/settings">資金設定</Link>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>優先</th>
              <th>銘柄</th>
              <th>口座</th>
              <th>目標</th>
              <th>現在数量</th>
              <th>差分</th>
              <th>達成率</th>
              <th>警告</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((target) => {
              const row = bySymbol.get(target.symbol);
              const currentQuantity = row?.holding?.quantity ?? 0;
              const targetQuantity = target.targetQuantity ?? 0;
              const diff = targetQuantity ? currentQuantity - targetQuantity : 0;
              const progress = target.targetAmount
                ? ((row?.latestSnapshot?.currentPrice ?? row?.holding?.averagePrice ?? 0) * currentQuantity) / target.targetAmount
                : targetQuantity > 0
                  ? currentQuantity / targetQuantity
                  : target.symbol === "CASH"
                    ? settings.cashAmount / (target.targetAmount ?? 10000)
                    : 0;
              return (
                <tr key={target.id}>
                  <td>{target.priority}</td>
                  <td>{target.symbol}<span className="muted block">{target.name}</span></td>
                  <td>{target.targetAccountType}</td>
                  <td>{target.targetQuantity ? `${target.targetQuantity}株` : formatPrice(target.targetAmount, "JPY")}</td>
                  <td>{target.symbol === "CASH" ? formatPrice(settings.cashAmount, "JPY") : currentQuantity}</td>
                  <td>{target.targetQuantity ? diff : "-"}</td>
                  <td>{Math.round(progress * 100)}%</td>
                  <td>{diff > 0 ? "目標より多く買いすぎています。計画外購入に注意してください。" : "監視中"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
