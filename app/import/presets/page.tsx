import { PresetsClient } from "./PresetsClient";

export const dynamic = "force-dynamic";

export default function ImportPresetsPage() {
  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>プリセット登録</h1>
          <p className="muted">13万円初期プランやテーマ別候補をボタンで登録します。投資助言ではなく、自分用の候補整理です。</p>
        </div>
      </div>
      <PresetsClient />
    </>
  );
}
