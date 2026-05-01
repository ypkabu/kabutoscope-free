import { formatDateTime, formatPercent, formatPrice } from "@/lib/format";
import { createBrowserSafeSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function NotificationAnalyticsPage() {
  const supabase = createBrowserSafeSupabaseClient();
  const [logsRes, snapshotsRes] = supabase
    ? await Promise.all([
        supabase.from("notification_logs").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("price_snapshots").select("*").order("created_at", { ascending: true }).limit(5000)
      ])
    : [{ data: [] }, { data: [] }];
  const snapshots = snapshotsRes.data ?? [];

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>通知後パフォーマンス検証</h1>
          <p className="muted">通知後1日、3日、7日、30日の価格変化を確認します。価格データ不足の場合は判定不能です。</p>
        </div>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>通知日時</th>
              <th>銘柄</th>
              <th>通知タイプ</th>
              <th>通知時価格</th>
              <th>1日後</th>
              <th>3日後</th>
              <th>7日後</th>
              <th>30日後</th>
              <th>判定</th>
            </tr>
          </thead>
          <tbody>
            {(logsRes.data ?? []).map((log: any) => {
              const changes = [1, 3, 7, 30].map((days) => changeAfter(log, snapshots, days));
              return (
                <tr key={log.id}>
                  <td>{formatDateTime(log.created_at)}</td>
                  <td>{log.symbol}</td>
                  <td>{log.notification_type}</td>
                  <td>{formatPrice(log.current_price)}</td>
                  {changes.map((change, index) => <td key={index}>{change === null ? "データ不足" : formatPercent(change)}</td>)}
                  <td>{judge(log.notification_type, changes[2], changes[3])}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function changeAfter(log: any, snapshots: any[], days: number) {
  const base = Number(log.current_price);
  if (!base) return null;
  const targetTime = new Date(log.created_at).getTime() + days * 24 * 60 * 60 * 1000;
  const snapshot = snapshots.find((item) => item.symbol === log.symbol && new Date(item.created_at).getTime() >= targetTime && item.current_price !== null);
  if (!snapshot) return null;
  return ((Number(snapshot.current_price) - base) / base) * 100;
}

function judge(type: string, change7: number | null, change30: number | null) {
  const value = change30 ?? change7;
  if (value === null) return "判定不能";
  if (type === "BUY_LINE" || type === "BUY_SCORE") return value >= 5 ? "成功候補" : "要検証";
  if (type === "TAKE_PROFIT" || type === "SELL_SCORE" || type === "STRONG_TAKE_PROFIT") return value <= 2 ? "成功候補" : "要検証";
  if (type === "STOP_LOSS" || type === "HIGH_RISK") return value < 0 ? "成功候補" : "要検証";
  return "判定不能";
}
