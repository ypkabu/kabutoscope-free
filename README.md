# KabutoScope Free

KabutoScope Free は、無料のYahoo Finance系データ、Supabase Free、Vercel Hobby、GitHub Actions、Discord Webhookで動かす個人用の株式監視Webアプリです。

このアプリは投資助言ではありません。自動売買は行いません。表示や通知は「候補」「検討」「監視」「注意」のための情報整理であり、最終判断は必ずユーザー自身で行ってください。

## 主な機能

- 日本株・米国株の銘柄マスター管理
- 保有区分: `NISA` / `TOKUTEI` / `WATCH_ONLY`
- 買いライン、利確ライン、強め利確ライン、損切りラインの管理
- GitHub Actionsによる定期監視
- 価格スナップショットとスコア結果のSupabase保存
- NISA向き、特定口座向き、買い候補、売り候補、危険度、判定信頼度のルールベーススコア
- Discord Webhook通知
- 同一銘柄・同一通知タイプの1日1回通知抑止

## セットアップ

```bash
npm install
```

`.env.local` を作成します。

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DISCORD_WEBHOOK_URL=
ENABLE_NOTIFICATIONS=true
APP_BASE_URL=http://localhost:3000
```

Supabase SQL Editorで `supabase/migrations/001_init.sql` を実行します。

## ローカル実行

```bash
npm run dev
```

監視ジョブを手動実行する場合:

```bash
npm run monitor
```

## 確認コマンド

```bash
npm run log:steps
npm run typecheck
npm run build
```

## 画面

- `/`: ダッシュボード
- `/stocks`: 銘柄一覧
- `/stocks/[symbol]`: 銘柄詳細
- `/rankings/nisa`: NISA向き候補ランキング
- `/rankings/tokutei`: 特定口座向き候補ランキング
- `/rankings/buy`: 買い候補ランキング
- `/rankings/sell`: 保有株の利確・見直し候補ランキング
- `/rankings/risk`: 危険度ランキング

## GitHub Actions

`.github/workflows/monitor.yml` が平日30分ごとに `npm run monitor` を実行します。

GitHubの `Settings > Secrets and variables > Actions` に以下を設定してください。

Secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DISCORD_WEBHOOK_URL`

Variables:

- `ENABLE_NOTIFICATIONS`
- `APP_BASE_URL`

## 無料運用の制限

- Yahoo Finance系の無料データは遅延、欠損、不正確な値、取得失敗があり得ます。
- Yahoo Finance系の取得方法は商用利用を保証するものではありません。
- Supabase Free、Vercel Hobby、GitHub Actionsには利用上限があります。
- GitHub Actionsのスケジュール実行は遅延することがあります。
- 初版では `SP500_FUND` はYahoo Financeで取得せず、手動監視項目として扱います。
- このアプリは個人利用向けです。
- 投資助言、売買指示、自動売買は行いません。
