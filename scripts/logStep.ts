const steps = [
  {
    title: "Step 1: Supabaseスキーマ、初期データ、株式一覧・詳細ページ",
    implemented: [
      "stocks / holdings / alert_settings / price_snapshots / notification_logs / scoring_results / app_settings のSQLを用意",
      "指定銘柄の初期データとアラートラインを投入できるseedを用意",
      "/stocks と /stocks/[symbol] で銘柄・保有・アラート・スコア・履歴を確認できる画面を用意"
    ],
    verify: [
      "Supabase SQL Editorでsupabase/migrations/001_init.sqlを実行",
      "npm run dev を起動し、/stocks と /stocks/9434.T を開く",
      "Supabase未設定でも初期データのフォールバック表示を確認"
    ]
  },
  {
    title: "Step 2: 株価取得とスナップショット保存",
    implemented: [
      "Yahoo Finance系の無料Chart APIを使ったgetQuote(symbol)とgetHistoricalPrices(symbol, range)を実装",
      "日本株の.T銘柄と米国株ティッカーに対応",
      "取得失敗時はエラーを記録して処理継続",
      "price_snapshots.raw_jsonに生レスポンスを保存"
    ],
    verify: [
      "Supabase環境変数を設定して npm run monitor を実行",
      "price_snapshots に各銘柄のスナップショットが追加されることを確認",
      "SP500_FUNDは初版では手動監視としてスキップされることを確認"
    ]
  },
  {
    title: "Step 3: 指標計算とルールベース疑似AIスコアリング",
    implemented: [
      "ma5 / ma25 / ma75 / return5d / return20d / 52週高値安値距離 / 出来高倍率 / volatility20dを計算",
      "NISA向き、特定口座向き、買い候補、売り候補、危険度、判定信頼度を0-100で算出",
      "AI APIを使わず、理由・プラス要因・マイナス要因・日本語コメントをテンプレート生成"
    ],
    verify: [
      "npm run monitor 実行後、scoring_results のscores_jsonを確認",
      "ランキング画面や詳細画面でスコア理由が日本語で表示されることを確認"
    ]
  },
  {
    title: "Step 4: ランキングページとダッシュボード",
    implemented: [
      "/rankings/nisa /rankings/tokutei /rankings/buy /rankings/sell /rankings/risk を実装",
      "トップページに買い候補、売り候補、危険度、NISA、特定口座、最近の通知、取得エラー枠を表示",
      "スコアバッジと日本語ラベルで状態を確認可能"
    ],
    verify: [
      "npm run dev を起動して各ランキングURLを開く",
      "スコア順に並び替わること、詳細ページへのリンクが動くことを確認"
    ]
  },
  {
    title: "Step 5: Discord通知エンジンとGitHub Actions",
    implemented: [
      "BUY_LINE / BUY_SCORE / TAKE_PROFIT / STRONG_TAKE_PROFIT / STOP_LOSS / HIGH_RISK / SELL_SCOREを判定",
      "同一銘柄・同一通知タイプは1日1回に抑止",
      "Discord Webhookへ日本語メッセージを送信",
      "平日30分間隔のGitHub Actions workflowを用意"
    ],
    verify: [
      "ENABLE_NOTIFICATIONS=falseで npm run monitor を実行し、通知ログだけ確認",
      "DISCORD_WEBHOOK_URLとENABLE_NOTIFICATIONS=trueを設定して手動workflow_dispatchを実行",
      "notification_logs とDiscordチャンネルに通知が出ることを確認"
    ]
  },
  {
    title: "Step 6: READMEとセットアップ資料",
    implemented: [
      "無料運用の制限、Supabase、Vercel、GitHub Actions、Discord Webhookの設定手順を日本語で記載",
      "投資助言ではないこと、自動売買をしないこと、最終判断はユーザー自身が行うことを明記"
    ],
    verify: ["README.mdを読み、.env.exampleの変数を埋めればローカル実行できることを確認"]
  },
  {
    title: "追加改善: 投資レーダー化",
    implemented: [
      "investmentHorizon / positionPurpose をholdingsに追加し、既存データをタグと口座区分から自動補完",
      "JSON / CSV 一括インポート、プリセット登録、13万円プラン自動セットアップを追加",
      "資金設定、目標ポートフォリオ、タグ偏り分析、判断メモ、通知後検証ページを追加",
      "短期・中期・長期の投資期間に応じて買い・売り・リスク判定を調整",
      "ランキングとDiscord通知に投資期間・保有目的・総合判定を表示"
    ],
    verify: [
      "Supabase SQL Editorでsupabase/migrations/002_portfolio_radar.sqlを実行",
      "/import/stocks でJSONまたはCSVを検証して一括登録",
      "/import/presets で13万円初期プランを登録",
      "/portfolio/settings で資金設定を保存",
      "/stocks/[symbol]/edit で投資期間と保有目的を切り替え",
      "/rankings/by-horizon で短期・中期・長期の分類を確認"
    ]
  }
];

for (const step of steps) {
  console.log(`\n【${step.title}】`);
  console.log("実装内容:");
  for (const item of step.implemented) console.log(`- ${item}`);
  console.log("動作確認方法:");
  for (const item of step.verify) console.log(`- ${item}`);
}
