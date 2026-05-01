import { ImportStocksClient } from "./ImportStocksClient";

export const dynamic = "force-dynamic";

export default function ImportStocksPage() {
  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>銘柄一括インポート</h1>
          <p className="muted">JSONまたはCSVを貼るだけで、銘柄・アラート・リスク上限・投資期間をまとめて登録します。</p>
        </div>
      </div>
      <ImportStocksClient />
    </>
  );
}
