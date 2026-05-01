import { createStockAction } from "@/lib/actions";
import { investmentHorizonDescriptions, positionPurposeDescriptions } from "@/lib/strategy";

export const dynamic = "force-dynamic";

export default async function NewStockPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>銘柄追加</h1>
          <p className="muted">銘柄、投資期間、保有目的、アラート設定を登録します。</p>
        </div>
      </div>
      {params.error ? <p className="notice">{params.error}</p> : null}
      <form className="card formGrid" action={createStockAction}>
        <label>symbol<input name="symbol" placeholder="7013.T" required /></label>
        <label>name<input name="name" placeholder="IHI" required /></label>
        <label>market<select name="market" defaultValue="JP_STOCK"><option value="JP_STOCK">日本株</option><option value="US_STOCK">米国株</option><option value="FUND">投資信託</option></select></label>
        <label>country<input name="country" defaultValue="JP" /></label>
        <label>sector<input name="sector" placeholder="semiconductor" /></label>
        <label>accountType<select name="accountType" defaultValue="WATCH_ONLY"><option value="NISA">NISA</option><option value="TOKUTEI">TOKUTEI</option><option value="WATCH_ONLY">監視のみ</option></select></label>
        <label>投資期間<select name="investmentHorizon" defaultValue="MEDIUM"><option value="SHORT">短期</option><option value="MEDIUM">中期</option><option value="LONG">長期</option></select></label>
        <label>保有目的<select name="positionPurpose" defaultValue="WATCH"><option value="CORE">コア資産</option><option value="INCOME">配当・優待</option><option value="GROWTH">成長</option><option value="THEME">テーマ</option><option value="REBOUND">反発狙い</option><option value="WATCH">監視のみ</option></select></label>
        <label>tags<input name="tags" placeholder="semiconductor|ai|high_volatility" /></label>
        <label>買いライン<input name="buyBelow" type="number" step="0.01" /></label>
        <label>利確ライン<input name="takeProfit" type="number" step="0.01" /></label>
        <label>強め利確ライン<input name="strongTakeProfit" type="number" step="0.01" /></label>
        <label>損切りライン<input name="stopLoss" type="number" step="0.01" /></label>
        <label><input name="notifyEnabled" type="checkbox" defaultChecked /> 通知する</label>
        <label>メモ<textarea name="memo" /></label>
        <button type="submit">保存</button>
      </form>
      <section className="card" style={{ marginTop: 16 }}>
        <h2>説明</h2>
        <ul className="reasonList">
          {Object.entries(investmentHorizonDescriptions).map(([key, value]) => <li key={key}>{key}: {value}</li>)}
          {Object.entries(positionPurposeDescriptions).map(([key, value]) => <li key={key}>{key}: {value}</li>)}
        </ul>
      </section>
    </>
  );
}
