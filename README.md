# KabutoScope Free

KabutoScope Free は、無料データソースを使って日本株・米国株を監視し、ルールベースの疑似AIスコアで候補整理する個人用Webアプリです。

このアプリは投資助言ではありません。自動売買は行いません。表示や通知は「候補」「検討」「監視」「注意」のための情報整理であり、最終判断は必ずユーザー自身で行ってください。

## 実装済み機能

- Supabase用スキーマと初期データ
- 銘柄マスター、保有区分、アラート設定、価格スナップショット、通知ログ、スコア結果の保存
- Yahoo Finance系の無料Chart APIを使った株価取得
- 日本株 `.T` と米国株ティッカーの取得
- 取得失敗時に処理全体を止めない監視ジョブ
- 移動平均、騰落率、52週高値安値距離、出来高倍率、ボラティリティなどの指標計算
- NISA向き、特定口座向き、買い候補、売り候補、危険度、判定信頼度のスコアリング
- 日本語の理由、プラス要因、マイナス要因、テンプレートコメント生成
- ダッシュボード、銘柄一覧、銘柄詳細、ランキング画面
- Discord Webhook通知
- 同一銘柄・同一通知タイプの1日1回通知抑止
- GitHub Actionsの平日30分間隔監視ワークフロー

## 実装ステップと確認ログ

各段階の実装内容と動作確認方法は、次のコマンドで日本語ログとして出力できます。

```bash
npm run log:steps
```

## セットアップ手順

1. 依存関係をインストールします。

```bash
npm install
```

2. `.env.example` を参考に `.env.local` を作成します。

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DISCORD_WEBHOOK_URL=
ENABLE_NOTIFICATIONS=true
APP_BASE_URL=http://localhost:3000
```

3. Supabaseで `supabase/migrations/001_init.sql` を実行します。

4. ローカルで画面を起動します。

```bash
npm run dev
```

5. ブラウザで `http://localhost:3000` を開きます。

## 環境変数

- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURLです。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 画面表示用のSupabase anon keyです。
- `SUPABASE_SERVICE_ROLE_KEY`: GitHub Actionsや監視ジョブが保存処理を行うためのサービスロールキーです。公開しないでください。
- `DISCORD_WEBHOOK_URL`: Discord通知先のWebhook URLです。未設定の場合は送信をスキップします。
- `ENABLE_NOTIFICATIONS`: `true` のときDiscord通知を送ります。検証時は `false` にすると安全です。
- `APP_BASE_URL`: Discord通知に表示する詳細ページURLのベースです。

## ローカルでの実行方法

画面表示:

```bash
npm run dev
```

監視ジョブ:

```bash
npm run monitor
```

型チェック:

```bash
npm run typecheck
```

本番ビルド:

```bash
npm run build
```

## Supabase設定

1. Supabase Freeで新しいプロジェクトを作成します。
2. SQL Editorを開きます。
3. `supabase/migrations/001_init.sql` の内容を貼り付けて実行します。
4. `stocks`、`holdings`、`alert_settings` に初期データが入っていることを確認します。
5. Project Settings > API から URL、anon key、service role key を取得します。

注意: service role key は強い権限を持ちます。VercelやGitHub Secretsには保存できますが、ブラウザに公開しないでください。

## Discord Webhook設定

1. Discordの通知先チャンネルで「連携サービス」または「Webhook」を開きます。
2. 新しいWebhookを作成します。
3. Webhook URLをコピーします。
4. `.env.local`、Vercel Environment Variables、GitHub Secretsの `DISCORD_WEBHOOK_URL` に設定します。
5. 最初は `ENABLE_NOTIFICATIONS=false` で監視ジョブを試し、問題なければ `true` にします。

## GitHub Actions設定

GitHubリポジトリの Settings > Secrets and variables > Actions に設定します。

Secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DISCORD_WEBHOOK_URL`

Variables:

- `ENABLE_NOTIFICATIONS`: `true` または `false`
- `APP_BASE_URL`: VercelのURL

`.github/workflows/monitor.yml` は平日のUTC 0時から14時まで30分ごとに実行します。日本時間の市場時間と完全一致するわけではありませんが、無料運用で扱いやすい範囲にしています。手動実行は `workflow_dispatch` から可能です。

## Vercelへのデプロイ

1. GitHubリポジトリをVercelにImportします。
2. Framework PresetはNext.jsを選びます。
3. Environment Variablesに次を設定します。
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DISCORD_WEBHOOK_URL`
   - `ENABLE_NOTIFICATIONS`
   - `APP_BASE_URL`
4. Deployします。
5. デプロイ後のURLを `APP_BASE_URL` とGitHub Actions Variablesに設定します。

## 画面

- `/`: ダッシュボード
- `/stocks`: 銘柄一覧
- `/stocks/[symbol]`: 銘柄詳細
- `/rankings/nisa`: NISA向き候補ランキング
- `/rankings/tokutei`: 特定口座向き候補ランキング
- `/rankings/buy`: 買い候補ランキング
- `/rankings/sell`: 保有株の利確・見直し候補ランキング
- `/rankings/risk`: 危険度ランキング

## 通知条件

- `BUY_LINE`: 現在値が買いライン以下
- `BUY_SCORE`: 買い候補スコアが80以上
- `TAKE_PROFIT`: 現在値が利確ライン以上
- `STRONG_TAKE_PROFIT`: 現在値が強め利確ライン以上
- `STOP_LOSS`: 現在値が損切りライン以下
- `HIGH_RISK`: 危険度スコアが75以上
- `SELL_SCORE`: 売り候補スコアが75以上

同じ銘柄・同じ通知タイプは、同じ日に1回だけ通知します。

## 無料運用の制限

- Yahoo Finance系の無料データは遅延、欠損、不正確な値、取得失敗があり得ます。
- Yahoo Finance系の取得方法は商用利用を保証するものではありません。
- Supabase Free、Vercel Hobby、GitHub Actionsには利用上限があります。
- GitHub Actionsのスケジュール実行は遅延することがあります。
- 初版では `SP500_FUND` はYahoo Financeで取得せず、手動監視項目として扱います。
- このアプリは個人利用向けです。
- 投資助言、売買指示、自動売買は行いません。
- 最終判断は必ずユーザー自身で行ってください。

## 注意文

このアプリのスコア、ランキング、Discord通知は、無料データと固定ルールに基づく候補整理です。「絶対買い」「必ず上がる」「今すぐ買え」「売れ」といった判断は行いません。
