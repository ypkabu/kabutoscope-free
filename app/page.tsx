import Link from "next/link";
import { StockSummaryCard } from "@/components/StockSummaryCard";
import { formatDateTime, formatPrice } from "@/lib/format";
import { getRankingScore, getStockOverviews } from "@/lib/repositories";

export default async function DashboardPage() {
  const overviews = await getStockOverviews();
  const buyCandidates = top(overviews, "buy");
  const sellCandidates = top(overviews, "sell");
  const riskCandidates = top(overviews, "risk");
  const nisaCandidates = top(overviews, "nisa");
  const tokuteiCandidates = top(overviews, "tokutei");
  const notifications = overviews.flatMap((row) => row.recentNotifications ?? []).slice(0, 8);
  const dataErrors = overviews.filter((row) => row.latestSnapshot?.rawJson && isErrorRaw(row.latestSnapshot.rawJson));

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>KabutoScope Free</h1>
          <p className="muted">無料データを使った個人用の株式監視・候補整理ツールです。投資助言や自動売買は行いません。</p>
        </div>
        <Link href="/stocks">銘柄一覧を見る</Link>
      </div>

      <section className="grid dashboardGrid">
        <DashboardSection title="今日の買い候補" href="/rankings/buy" rows={buyCandidates} scoreType="buy" />
        <DashboardSection title="利確・見直し候補" href="/rankings/sell" rows={sellCandidates} scoreType="sell" />
        <DashboardSection title="危険度高め" href="/rankings/risk" rows={riskCandidates} scoreType="risk" />
        <DashboardSection title="NISA候補" href="/rankings/nisa" rows={nisaCandidates} scoreType="nisa" />
        <DashboardSection title="特定口座候補" href="/rankings/tokutei" rows={tokuteiCandidates} scoreType="tokutei" />

        <section className="card">
          <div className="split">
            <h2>最近の通知</h2>
            <span className="muted">{notifications.length}件</span>
          </div>
          {notifications.length === 0 ? (
            <p className="muted">通知ログはまだありません。</p>
          ) : (
            <ul className="reasonList">
              {notifications.map((log) => (
                <li key={log.id}>
                  {log.symbol} / {log.notificationType} / {formatPrice(log.currentPrice)} / {formatDateTime(log.createdAt)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2>データ取得エラー</h2>
          {dataErrors.length === 0 ? (
            <p className="muted">直近スナップショットでは大きな取得エラーは見つかっていません。</p>
          ) : (
            <ul className="reasonList">
              {dataErrors.map((row) => (
                <li key={row.stock.id}>{row.stock.symbol}: 取得結果を確認してください。</li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </>
  );
}

function DashboardSection({
  title,
  href,
  rows,
  scoreType
}: {
  title: string;
  href: string;
  rows: Awaited<ReturnType<typeof getStockOverviews>>;
  scoreType: "nisa" | "tokutei" | "buy" | "sell" | "risk";
}) {
  return (
    <section className="grid">
      <div className="split">
        <h2>{title}</h2>
        <Link href={href}>一覧</Link>
      </div>
      {rows.map((row) => (
        <StockSummaryCard key={row.stock.id} row={row} scoreType={scoreType} />
      ))}
    </section>
  );
}

function top(rows: Awaited<ReturnType<typeof getStockOverviews>>, type: string) {
  return [...rows].sort((a, b) => getRankingScore(b, type) - getRankingScore(a, type)).slice(0, 3);
}

function isErrorRaw(rawJson: unknown) {
  return typeof rawJson === "object" && rawJson !== null && "error" in rawJson;
}
