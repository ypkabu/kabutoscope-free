import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreBadge } from "@/components/ScoreBadge";
import { addJournalAction } from "@/lib/actions";
import { formatDateTime, formatPercent, formatPrice } from "@/lib/format";
import { getStockOverviewBySymbol } from "@/lib/repositories";
import { investmentHorizonLabels, positionPurposeLabels, strategyDescription } from "@/lib/strategy";
import type { ScoreBlock } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol);
  const overview = await getStockOverviewBySymbol(symbol);

  if (!overview) {
    notFound();
  }

  const scoring = overview.scoring;
  const horizon = overview.holding?.investmentHorizon ?? "MEDIUM";
  const purpose = overview.holding?.positionPurpose ?? "WATCH";

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>
            {overview.stock.name} <span className="muted">{overview.stock.symbol}</span>
          </h1>
          <p className="muted">市場: {overview.stock.market} / 国: {overview.stock.country} / セクター: {overview.stock.sector}</p>
          <div className="tagList">
            {overview.stock.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="buttonRow">
          <Link href="/stocks">一覧へ戻る</Link>
          <Link href={`/stocks/${encodeURIComponent(overview.stock.symbol)}/edit`}>投資期間を編集</Link>
        </div>
      </div>

      <section className="grid twoCol">
        <article className="card">
          <h2>現在値</h2>
          <p className="priceLine">{formatPrice(overview.latestSnapshot?.currentPrice, overview.latestSnapshot?.currency)}</p>
          <p>前日比: {formatPrice(overview.latestSnapshot?.change, overview.latestSnapshot?.currency)} / {formatPercent(overview.latestSnapshot?.changePercent)}</p>
          <p>出来高: {overview.latestSnapshot?.volume?.toLocaleString("ja-JP") ?? "未取得"}</p>
          <p>市場時刻: {formatDateTime(overview.latestSnapshot?.marketTime)}</p>
        </article>

        <article className="card">
          <h2>保有・アラート設定</h2>
          <p>口座区分: {overview.holding?.accountType ?? "WATCH_ONLY"}</p>
          <p>投資期間: {investmentHorizonLabels[horizon]}</p>
          <p>保有目的: {positionPurposeLabels[purpose]}</p>
          <p>数量: {overview.holding?.quantity ?? 0}</p>
          <p>平均取得単価: {formatPrice(overview.holding?.averagePrice, overview.latestSnapshot?.currency)}</p>
          <p>含み損益率: {scoring?.positionProfitPercent === null || scoring?.positionProfitPercent === undefined ? "未計算" : formatPercent(scoring.positionProfitPercent)}</p>
          <p>メモ: {overview.holding?.memo ?? "未設定"}</p>
          <p>買いライン: {formatPrice(overview.alertSetting?.buyBelow, overview.latestSnapshot?.currency)}</p>
          <p>利確ライン: {formatPrice(overview.alertSetting?.takeProfit, overview.latestSnapshot?.currency)}</p>
          <p>強め利確ライン: {formatPrice(overview.alertSetting?.strongTakeProfit, overview.latestSnapshot?.currency)}</p>
          <p>損切りライン: {formatPrice(overview.alertSetting?.stopLoss, overview.latestSnapshot?.currency)}</p>
          <p>通知: {overview.alertSetting?.notifyEnabled ? "有効" : "無効"}</p>
          <p className="notice">{strategyDescription(overview.stock, overview.holding)}</p>
        </article>
      </section>

      {scoring ? (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>スコア</h2>
          <p>総合判定: <strong>{scoring.overallLabel}</strong></p>
          {scoring.doNotBuyReasons.length > 0 ? (
            <p className="notice">買わない理由: {scoring.doNotBuyReasons.join("、")}</p>
          ) : null}
          <div className="scoreGrid">
            <ScoreDetail title="NISA向き" block={scoring.nisaScore} />
            <ScoreDetail title="特定口座向き" block={scoring.tokuteiScore} />
            <ScoreDetail title="買い候補" block={scoring.buyScore} />
            <ScoreDetail title="売り候補" block={scoring.sellScore} />
            <ScoreDetail title="危険度" block={scoring.riskScore} />
            <ScoreDetail title="判定信頼度" block={scoring.confidenceScore} />
          </div>
        </section>
      ) : (
        <p className="notice">データ不足のため判定信頼度は低めです。</p>
      )}

      {scoring ? (
        <section className="grid twoCol" style={{ marginTop: 16 }}>
          <article className="card">
            <h2>テクニカル指標</h2>
            <p>5日移動平均: {formatPrice(scoring.indicators.ma5, overview.latestSnapshot?.currency)}</p>
            <p>25日移動平均: {formatPrice(scoring.indicators.ma25, overview.latestSnapshot?.currency)}</p>
            <p>75日移動平均: {formatPrice(scoring.indicators.ma75, overview.latestSnapshot?.currency)}</p>
            <p>5日騰落率: {formatPercent(scoring.indicators.return5d)}</p>
            <p>20日騰落率: {formatPercent(scoring.indicators.return20d)}</p>
            <p>52週高値から: {formatPercent(scoring.indicators.drawdownFrom52WeekHigh)}</p>
            <p>52週安値から: {formatPercent(scoring.indicators.riseFrom52WeekLow)}</p>
            <p>出来高倍率: {scoring.indicators.volumeRatio?.toFixed(2) ?? "未計算"}</p>
            <p>20日ボラティリティ: {scoring.indicators.volatility20d?.toFixed(2) ?? "未計算"}</p>
          </article>

          <article className="card">
            <h2>最近の通知ログ</h2>
            {overview.recentNotifications && overview.recentNotifications.length > 0 ? (
              <ul className="reasonList">
                {overview.recentNotifications.slice(0, 8).map((log) => (
                  <li key={log.id}>
                    {log.notificationType} / {formatPrice(log.currentPrice, overview.latestSnapshot?.currency)} / {formatDateTime(log.createdAt)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">通知ログはまだありません。</p>
            )}
          </article>
        </section>
      ) : null}

      <section className="card" style={{ marginTop: 16 }}>
        <h2>判断メモを追加</h2>
        <form className="formGrid" action={addJournalAction}>
          <input type="hidden" name="stockId" value={overview.stock.id} />
          <input type="hidden" name="symbol" value={overview.stock.symbol} />
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
          <label>accountType<select name="accountType" defaultValue={overview.holding?.accountType === "NISA" ? "NISA" : "TOKUTEI"}><option value="NISA">NISA</option><option value="TOKUTEI">TOKUTEI</option></select></label>
          <label>価格<input name="price" type="number" step="0.01" defaultValue={overview.latestSnapshot?.currentPrice ?? undefined} /></label>
          <label>数量<input name="quantity" type="number" step="0.01" /></label>
          <label>なぜこの銘柄を買う/見直すのか<textarea name="reason" /></label>
          <label>期待シナリオ<textarea name="expectedScenario" /></label>
          <label>見直し条件<textarea name="exitCondition" /></label>
          <label>利確条件<textarea name="takeProfitCondition" /></label>
          <label>損切り条件<textarea name="stopLossCondition" /></label>
          <label>感情タグ<select name="emotionTag" defaultValue="planned"><option value="calm">落ち着いている</option><option value="fear_of_missing_out">置いていかれ不安</option><option value="panic">焦り</option><option value="planned">計画通り</option><option value="revenge_trade">取り返したい気持ち</option><option value="uncertain">迷い</option></select></label>
          <button type="submit">判断メモを保存</button>
        </form>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>最近の価格スナップショット</h2>
        <p className="muted">一覧画面では直近スナップショットを表示します。履歴の詳細レビューはSupabaseのprice_snapshotsで確認してください。</p>
        <p>直近保存時刻: {formatDateTime(overview.latestSnapshot?.createdAt)}</p>
      </section>
    </>
  );
}

function ScoreDetail({ title, block }: { title: string; block: ScoreBlock }) {
  return (
    <article className="card">
      <div className="split">
        <h3>{title}</h3>
        <ScoreBadge label={block.label} score={block.score} />
      </div>
      <p>{block.comment}</p>
      <strong>プラス要因</strong>
      <ul className="reasonList">
        {block.positiveFactors.length > 0 ? block.positiveFactors.map((reason) => <li key={reason}>{reason}</li>) : <li>該当なし</li>}
      </ul>
      <strong>マイナス要因</strong>
      <ul className="reasonList">
        {block.negativeFactors.length > 0 ? block.negativeFactors.map((reason) => <li key={reason}>{reason}</li>) : <li>該当なし</li>}
      </ul>
    </article>
  );
}
