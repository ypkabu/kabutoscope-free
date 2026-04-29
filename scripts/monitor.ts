import { config } from "dotenv";
import { runMonitoring } from "../src/lib/monitor/notificationEngine";

config({ path: ".env.local" });
config();

async function main() {
  console.log("KabutoScope Free 監視ジョブを開始します。");
  console.log("この処理は投資助言ではなく、個人用の情報整理とアラート通知です。自動売買は行いません。");
  const summary = await runMonitoring();
  console.log(`監視ジョブが完了しました。確認銘柄数: ${summary.checked} / 通知件数: ${summary.notificationsSent}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`監視ジョブが失敗しました: ${message}`);
  process.exit(1);
});
