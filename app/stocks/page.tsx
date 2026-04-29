import Link from "next/link";
import { ScoreBadge } from "@/components/ScoreBadge";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getStockOverviews } from "@/lib/repositories";

export default async function StocksPage() {
  const overviews = await getStockOverviews();

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>銘柄一覧</h1>
          <p className="muted">株式マスター、保有区分、アラート設定、直近スコアを確認します。</p>
        </div>
      </div>

      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>銘柄</th>
              <th>市場</th>
              <th>現在値</th>
              <th>口座区分</th>
              <th>NISA</th>
              <th>特定</th>
              <th>買い</th>
              <th>危険度</th>
              <th>取得時刻</th>
              <th>詳細</th>
            </tr>
          </thead>
          <tbody>
            {overviews.map((row) => (
              <tr key={row.stock.id}>
                <td>
                  <strong>{row.stock.symbol}</strong>
                  <span className="muted block">{row.stock.name}</span>
                  <span className="tagList">
                    {row.stock.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="tag">
                        {tag}
                      </span>
                    ))}
                  </span>
                </td>
                <td>
                  {row.stock.market}
                  <span className="muted block">{row.stock.country}</span>
                </td>
                <td>{formatPrice(row.latestSnapshot?.currentPrice, row.latestSnapshot?.currency)}</td>
                <td>{row.holding?.accountType ?? "WATCH_ONLY"}</td>
                <td>
                  <ScoreBadge label={row.scoring?.nisaScore.label ?? "データ不足"} score={row.scoring?.nisaScore.score ?? null} />
                </td>
                <td>
                  <ScoreBadge label={row.scoring?.tokuteiScore.label ?? "データ不足"} score={row.scoring?.tokuteiScore.score ?? null} />
                </td>
                <td>
                  <ScoreBadge label={row.scoring?.buyScore.label ?? "データ不足"} score={row.scoring?.buyScore.score ?? null} />
                </td>
                <td>
                  <ScoreBadge label={row.scoring?.riskScore.label ?? "データ不足"} score={row.scoring?.riskScore.score ?? null} />
                </td>
                <td>{formatDateTime(row.latestSnapshot?.createdAt)}</td>
                <td>
                  <Link href={`/stocks/${encodeURIComponent(row.stock.symbol)}`}>表示</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
