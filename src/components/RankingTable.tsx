import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getRankingScore } from "@/lib/repositories";
import { investmentHorizonLabels, positionPurposeLabels } from "@/lib/strategy";
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
            <th>総合判定</th>
            <th>スコア</th>
            <th>買わない理由</th>
            <th>FOMO</th>
            <th>適合度</th>
            <th>口座</th>
            <th>投資期間</th>
            <th>目的</th>
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
                <td>{row.scoring?.finalDecision ?? row.scoring?.overallLabel ?? "データ不足"}</td>
                <td>
                  <ScoreBadge label={block?.label ?? "データ不足"} score={score} />
                </td>
                <td>{row.scoring?.doNotBuyScore?.score ?? 0}</td>
                <td>{row.scoring?.fomoRiskScore?.score ?? 0}</td>
                <td>{row.scoring?.portfolioFitScore?.score ?? 0}</td>
                <td>{row.holding?.accountType ?? "WATCH_ONLY"}</td>
                <td>{investmentHorizonLabels[row.holding?.investmentHorizon ?? "MEDIUM"]}</td>
                <td>{positionPurposeLabels[row.holding?.positionPurpose ?? "WATCH"]}</td>
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
  if (type === "smart") return row.scoring.decisionConfidenceScore;
  if (type === "do-not-buy") return row.scoring.doNotBuyScore;
  if (type === "fomo-risk") return row.scoring.fomoRiskScore;
  if (type === "averaging-down-risk") return row.scoring.averagingDownRiskScore;
  if (type === "portfolio-fit") return row.scoring.portfolioFitScore;
  if (type === "short-term-sell") return row.scoring.sellScore;
  if (type === "long-term-review") return row.scoring.riskScore.score > row.scoring.sellScore.score ? row.scoring.riskScore : row.scoring.sellScore;
  return row.scoring.confidenceScore;
}
