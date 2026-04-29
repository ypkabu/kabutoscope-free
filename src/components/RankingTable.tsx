import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getRankingScore } from "@/lib/repositories";
import type { StockOverview } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";

type RankingTableProps = {
  type: string;
  rows: StockOverview[];
};

export function RankingTable({ type, rows }: RankingTableProps) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            <th>順位</th>
            <th>銘柄</th>
            <th>現在値</th>
            <th>スコア</th>
            <th>口座</th>
            <th>通知</th>
            <th>コメント</th>
            <th>詳細</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const score = getRankingScore(row, type);
            const block = scoreBlock(row, type);
            return (
              <tr key={row.stock.id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{row.stock.symbol}</strong>
                  <span className="muted block">{row.stock.name}</span>
                </td>
                <td>{formatPrice(row.latestSnapshot?.currentPrice, row.latestSnapshot?.currency)}</td>
                <td>
                  <ScoreBadge label={block?.label ?? "データ不足"} score={score} />
                </td>
                <td>{row.holding?.accountType ?? "WATCH_ONLY"}</td>
                <td>{row.alertSetting?.notifyEnabled ? "有効" : "無効"}</td>
                <td className="commentCell">{block?.comment ?? "データ不足のため判定信頼度は低めです。"}</td>
                <td>
                  <Link href={`/stocks/${encodeURIComponent(row.stock.symbol)}`}>表示</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function scoreBlock(row: StockOverview, type: string) {
  if (!row.scoring) return null;
  if (type === "nisa") return row.scoring.nisaScore;
  if (type === "tokutei") return row.scoring.tokuteiScore;
  if (type === "buy") return row.scoring.buyScore;
  if (type === "sell") return row.scoring.sellScore;
  if (type === "risk") return row.scoring.riskScore;
  return row.scoring.confidenceScore;
}
