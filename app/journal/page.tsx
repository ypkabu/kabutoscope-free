import Link from "next/link";
import { JournalForm } from "@/components/JournalForm";
import { formatDateTime, formatPrice } from "@/lib/format";
import { accountTypeLabels, actionTypeLabels, emotionTagLabels } from "@/lib/journalLabels";
import { createBrowserSafeSupabaseClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ journal?: string; journalError?: string }> }) {
  const params = await searchParams;
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
      {params.journal ? <p className="notice">判断メモを保存しました。</p> : null}
      {params.journalError ? <p className="notice">{params.journalError}</p> : null}
      <section className="grid twoCol">
        <section className="card">
          <h2>判断メモを追加</h2>
          <JournalForm />
        </section>

        <section className="card">
          <h2>最近の記録</h2>
          {(data ?? []).length === 0 ? <p className="muted">記録はまだありません。</p> : (
            <ul className="reasonList">
              {(data ?? []).map((row: any) => (
                <li key={row.id}>
                  <Link href={`/stocks/${encodeURIComponent(row.symbol)}`}>{row.symbol}</Link> / {actionTypeLabels[row.action_type as keyof typeof actionTypeLabels] ?? row.action_type} / {accountTypeLabels[row.account_type as keyof typeof accountTypeLabels] ?? row.account_type} / {row.price === null ? "価格未入力" : formatPrice(row.price)} / 数量: {row.quantity ?? "未入力"} / {formatDateTime(row.created_at)}
                  <span className="block muted">理由: {row.reason ?? "未入力"}</span>
                  <span className="block muted">期待シナリオ: {row.expected_scenario ?? "未入力"}</span>
                  <span className="block muted">見直し条件: {row.exit_condition ?? "未入力"}</span>
                  <span className="block muted">利確条件: {row.take_profit_condition ?? "未入力"}</span>
                  <span className="block muted">損切り条件: {row.stop_loss_condition ?? "未入力"}</span>
                  <span className="block muted">感情: {emotionTagLabels[row.emotion_tag as keyof typeof emotionTagLabels] ?? "未入力"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </>
  );
}
