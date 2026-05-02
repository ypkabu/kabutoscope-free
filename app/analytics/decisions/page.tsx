import { formatDateTime, formatPercent, formatPrice } from "@/lib/format";
import { createBrowserSafeSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DecisionAnalyticsPage() {
  const supabase = createBrowserSafeSupabaseClient();
  const [journalsRes, snapshotsRes] = supabase
    ? await Promise.all([
        supabase.from("trade_journal").select("*").not("final_decision", "is", null).order("created_at", { ascending: false }).limit(100),
        supabase.from("price_snapshots").select("*").order("created_at", { ascending: true }).limit(5000)
      ])
    : [{ data: [] }, { data: [] }];
  const snapshots = snapshotsRes.data ?? [];

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>過去判定の検証</h1>
          <p className="muted">判断メモ保存時の総合判定と、その後の価格変化を確認します。価格データ不足の場合は判定不能です。</p>
        </div>
      </div>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>日付</th>
              <th>銘柄</th>
              <th>総合判定</th>
              <th>記録時価格</th>
              <th>1日後</th>
              <th>3日後</th>
              <th>7日後</th>
              <th>30日後</th>
              <th>判定</th>
              <th>コメント</th>
            </tr>
          </thead>
          <tbody>
            {(journalsRes.data ?? []).map((journal: any) => {
              const changes = [1, 3, 7, 30].map((days) => changeAfter(journal, snapshots, days));
              const result = judgeDecision(journal.final_decision, changes[2], changes[3]);
              return (
                <tr key={journal.id}>
                  <td>{formatDateTime(journal.created_at)}</td>
                  <td>{journal.symbol}</td>
                  <td>{journal.final_decision}</td>
                  <td>{journal.price === null ? "価格未入力" : formatPrice(journal.price)}</td>
                  {changes.map((change, index) => <td key={index}>{change === null ? "データ不足" : formatPercent(change)}</td>)}
                  <td>{result.label}</td>
                  <td>{result.comment}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function changeAfter(journal: any, snapshots: any[], days: number) {
  const base = Number(journal.price);
  if (!base) return null;
  const targetTime = new Date(journal.created_at).getTime() + days * 24 * 60 * 60 * 1000;
  const snapshot = snapshots.find((item) => item.symbol === journal.symbol && new Date(item.created_at).getTime() >= targetTime && item.current_price !== null);
  if (!snapshot) return null;
  return ((Number(snapshot.current_price) - base) / base) * 100;
}

function judgeDecision(finalDecision: string | null, change7: number | null, change30: number | null) {
  const value = change30 ?? change7;
  if (value === null) return { label: "判定不能", comment: "価格データがまだ足りません。" };
  if (finalDecision === "少額なら買い候補" || finalDecision === "強い買い候補" || finalDecision === "買いライン接近") {
    return value >= 5 ? { label: "成功候補", comment: "判定後に上昇しています。" } : { label: "要検証", comment: "買い候補後の上昇はまだ弱めです。" };
  }
  if (finalDecision === "買わない理由あり" || finalDecision === "反発確認待ち" || finalDecision === "監視のみ") {
    return value <= 0 ? { label: "成功候補", comment: "待ち判定後に下落または横ばいでした。" } : { label: "要検証", comment: "待ち判定後に上昇しており、ルール見直し候補です。" };
  }
  if (finalDecision === "利確優先" || finalDecision === "一部利確候補") {
    return value <= 2 ? { label: "成功候補", comment: "利確候補後に下落または横ばいでした。" } : { label: "要検証", comment: "利確候補後も上昇しており、過熱判定を見直す余地があります。" };
  }
  return { label: "判定不能", comment: "この総合判定の検証ルールはまだ簡易扱いです。" };
}
