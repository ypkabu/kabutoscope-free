import { notFound } from "next/navigation";
import { saveStockStrategyAction } from "@/lib/actions";
import { getStockOverviewBySymbol } from "@/lib/repositories";
import { investmentHorizonDescriptions, investmentHorizonLabels, positionPurposeDescriptions, positionPurposeLabels } from "@/lib/strategy";

export const dynamic = "force-dynamic";

export default async function EditStockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol);
  const overview = await getStockOverviewBySymbol(symbol);
  if (!overview) notFound();
  const holding = overview.holding;

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>{overview.stock.name} の投資期間・目的を編集</h1>
          <p className="muted">短期・中期・長期を後から切り替え、スコアリングや通知判定へ反映します。</p>
        </div>
      </div>
      <form className="card formGrid" action={saveStockStrategyAction}>
        <input type="hidden" name="stockId" value={overview.stock.id} />
        <input type="hidden" name="symbol" value={overview.stock.symbol} />
        <input type="hidden" name="accountType" value={holding?.accountType ?? "WATCH_ONLY"} />
        <input type="hidden" name="previousInvestmentHorizon" value={holding?.investmentHorizon ?? "MEDIUM"} />
        <input type="hidden" name="previousPositionPurpose" value={holding?.positionPurpose ?? "WATCH"} />
        <label>
          投資期間
          <select name="investmentHorizon" defaultValue={holding?.investmentHorizon ?? "MEDIUM"}>
            {Object.entries(investmentHorizonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          保有目的
          <select name="positionPurpose" defaultValue={holding?.positionPurpose ?? "WATCH"}>
            {Object.entries(positionPurposeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          変更理由
          <textarea name="reason" placeholder="短期リバ狙いから中期保有に変更、など" />
        </label>
        <button type="submit">保存</button>
      </form>
      <section className="card" style={{ marginTop: 16 }}>
        <h2>説明</h2>
        <ul className="reasonList">
          {Object.entries(investmentHorizonDescriptions).map(([key, value]) => <li key={key}>{key}: {value}</li>)}
          {Object.entries(positionPurposeDescriptions).map(([key, value]) => <li key={key}>{key}: {value}</li>)}
        </ul>
      </section>
    </>
  );
}
