import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { StockOverview } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";

type StockSummaryCardProps = {
  row: StockOverview;
  scoreType: "nisa" | "tokutei" | "buy" | "sell" | "risk";
};

export function StockSummaryCard({ row, scoreType }: StockSummaryCardProps) {
  const block = {
    nisa: row.scoring?.nisaScore,
    tokutei: row.scoring?.tokuteiScore,
    buy: row.scoring?.buyScore,
    sell: row.scoring?.sellScore,
    risk: row.scoring?.riskScore
  }[scoreType];

  return (
    <article className="card compactCard">
      <div className="split">
        <div>
          <h3>{row.stock.symbol}</h3>
          <p className="muted">{row.stock.name}</p>
        </div>
        <ScoreBadge label={block?.label ?? "データ不足"} score={block?.score ?? null} />
      </div>
      <p className="priceLine">{formatPrice(row.latestSnapshot?.currentPrice, row.latestSnapshot?.currency)}</p>
      <p>{block?.comment ?? "データ不足のため判定信頼度は低めです。"}</p>
      <Link href={`/stocks/${encodeURIComponent(row.stock.symbol)}`}>詳細を見る</Link>
    </article>
  );
}
