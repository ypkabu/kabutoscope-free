import Link from "next/link";
import { addJournalAction } from "@/lib/actions";
import { formatDateTime, formatPrice } from "@/lib/format";
import { createBrowserSafeSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const supabase = createBrowserSafeSupabaseClient();
  const { data } = supabase
    ? await supabase.from("trade_journal").select("*").order("created_at", { ascending: false }).limit(50)
    : { data: [] };

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>取引メモ・判断記録</h1>
          <p className="muted">なぜ買うのか、どこで見直すのかを記録します。投資助言ではなく、自分用の振り返りです。</p>
        </div>
      </div>
      <section className="grid twoCol">
        <form className="card formGrid" action={addJournalAction}>
          <h2>判断メモを追加</h2>
          <label>symbol<input name="symbol" placeholder="6526.T" required /></label>
          <label>actionType
            <select name="actionType" defaultValue="BUY_PLAN">
              <option value="BUY_PLAN">買う前の計画</option>
              <option value="BUY">買い記録</option>
              <option value="SELL_PLAN">売る前の計画</option>
              <option value="SELL">売り記録</option>
              <option value="HOLD">継続保有</option>
              <option value="REVIEW">見直し</option>
            </select>
          </label>
          <label>accountType<select name="accountType"><option value="NISA">NISA</option><option value="TOKUTEI">TOKUTEI</option></select></label>
          <label>価格<input name="price" type="number" step="0.01" /></label>
          <label>数量<input name="quantity" type="number" step="0.01" /></label>
          <label>なぜこの銘柄を買うのか<textarea name="reason" /></label>
          <label>期待シナリオ<textarea name="expectedScenario" /></label>
          <label>どこまで下がったら見直すのか<textarea name="exitCondition" /></label>
          <label>どこまで上がったら利確するのか<textarea name="takeProfitCondition" /></label>
          <label>損切り条件<textarea name="stopLossCondition" /></label>
          <label>感情タグ
            <select name="emotionTag" defaultValue="planned">
              <option value="calm">落ち着いている</option>
              <option value="fear_of_missing_out">置いていかれ不安</option>
              <option value="panic">焦り</option>
              <option value="planned">計画通り</option>
              <option value="revenge_trade">取り返したい気持ち</option>
              <option value="uncertain">迷い</option>
            </select>
          </label>
          <button type="submit">保存</button>
        </form>

        <section className="card">
          <h2>最近の記録</h2>
          {(data ?? []).length === 0 ? <p className="muted">記録はまだありません。</p> : (
            <ul className="reasonList">
              {(data ?? []).map((row: any) => (
                <li key={row.id}>
                  <Link href={`/stocks/${encodeURIComponent(row.symbol)}`}>{row.symbol}</Link> / {row.action_type} / {formatPrice(row.price)} / {formatDateTime(row.created_at)}
                  <span className="block muted">{row.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </>
  );
}
