# KabutoScope Free

KabutoScope Free は、無料のYahoo Finance系データ、Supabase Free、Vercel Hobby、GitHub Actions、Discord Webhookで動かす個人用の株式監視Webアプリです。

このアプリは投資助言ではありません。自動売買は行いません。表示や通知は「候補」「検討」「監視」「注意」のための情報整理であり、最終判断は必ずユーザー自身で行います。

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
- `/dashboard`: ダッシュボード
- `/stocks`: 銘柄一覧
- `/stocks/new`: 銘柄追加
- `/stocks/[symbol]`: 銘柄詳細
- `/stocks/[symbol]/edit`: 投資期間・保有目的の編集
- `/rankings/nisa`: NISA向き候補ランキング
- `/rankings/tokutei`: 特定口座向き候補ランキング
- `/rankings/buy`: 買い候補ランキング
- `/rankings/sell`: 保有株の利確・見直し候補ランキング
- `/rankings/risk`: 危険度ランキング
- `/rankings/short-term-sell`: 短期利確候補ランキング
- `/rankings/long-term-review`: 長期見直し候補ランキング
- `/rankings/by-horizon`: 投資期間別ランキング
- `/portfolio/target`: 目標ポートフォリオ
- `/portfolio/settings`: 資金設定
- `/plan/initial-130k`: 13万円プラン専用ダッシュボード
- `/import/stocks`: JSON / CSV 一括インポート
- `/import/presets`: プリセット登録
- `/journal`: 取引メモ・判断記録
- `/analytics/notifications`: 通知後パフォーマンス検証

## JSONインポート方法

`/import/stocks` を開き、JSONを貼り付けて「検証」を押します。エラーがなければ「一括登録」を押します。

`investmentHorizon` と `positionPurpose` を指定できます。古いJSONにこの2項目がない場合は、口座区分とタグから自動補完します。

```json
[
  {
    "symbol": "6526.T",
    "name": "ソシオネクスト",
    "market": "JP_STOCK",
    "country": "JP",
    "sector": "semiconductor",
    "accountType": "TOKUTEI",
    "investmentHorizon": "SHORT",
    "positionPurpose": "THEME",
    "tags": ["semiconductor", "ai", "high_volatility", "growth", "tokutei"],
    "buyBelow": 1900,
    "takeProfit": 2400,
    "strongTakeProfit": 2700,
    "stopLoss": 1700,
    "maxInvestmentAmount": 30000,
    "maxPortfolioWeight": 0.25,
    "notifyEnabled": true,
    "memo": "SBI特定口座の半導体短期・中期枠。買いすぎ注意。"
  }
]
```

## CSVインポート方法

`/import/stocks` はCSVにも対応しています。新しいCSVヘッダーは以下です。

```csv
symbol,name,market,country,sector,accountType,investmentHorizon,positionPurpose,tags,buyBelow,takeProfit,strongTakeProfit,stopLoss,maxInvestmentAmount,maxPortfolioWeight,notifyEnabled,memo
```

`tags` は `|` 区切りです。古いCSVに `investmentHorizon` と `positionPurpose` がない場合も、自動補完します。

```csv
6526.T,ソシオネクスト,JP_STOCK,JP,semiconductor,TOKUTEI,SHORT,THEME,semiconductor|ai|high_volatility|growth|tokutei,1900,2400,2700,1700,30000,0.25,true,SBI特定口座の半導体短期・中期枠
```

## プリセット登録方法

`/import/presets` から以下のプリセットを登録できます。

- 13万円初期プラン
- 長期NISA候補セット
- 半導体・AI短期候補セット
- 防衛・重工テーマ候補セット
- ゲーム・エンタメ候補セット
- 高配当・優待候補セット
- 米国AI大型株候補セット

既存銘柄は「更新」または「スキップ」を選べます。登録後は各銘柄の詳細ページで内容を確認してください。

## 13万円プランの自動セットアップ

`/import/presets` の「13万円プランをセットアップ」を押すと、銘柄、目標ポートフォリオ、資金設定をまとめて登録します。

資金設定の初期値:

- 総資金: 130,000円
- 現金: 130,000円
- 楽天NISA予定額: 65,000円
- SBI特定口座予定額: 50,000円
- 最低現金比率: 10%
- 警告現金比率: 20%

## 資金設定の変更方法

`/portfolio/settings` で総資金、現金、楽天NISA予定額、SBI特定口座予定額、最低現金比率、警告現金比率を変更できます。

金額入力欄は日本円のnumber inputです。1,000円単位で上下でき、`+1万円` / `-1万円` ボタンも使えます。

「13万円プランに戻す」を押すと初期値に戻ります。保存するたびに `portfolio_settings_history` に履歴を残します。

現金比率の意味:

- 現金比率20%以上: 安全
- 現金比率10〜20%: 注意
- 現金比率10%未満: 危険

楽天NISA予定額は長期・非課税枠の目安、SBI特定口座予定額は短期〜中期のテーマ監視枠の目安です。買いすぎ警告や最大投資額の判定では、総資金や各銘柄の上限を参考にします。

## 投資期間別ロジック

`investmentHorizon` は、同じ銘柄でも持ち方によって判定を変えるための設定です。

- `SHORT`: 数日〜数週間の短期売買。価格ライン、短期モメンタム、出来高、早めの利確・損切りを重視します。
- `MEDIUM`: 数ヶ月〜1年程度の中期保有。テーマ継続、25日線・75日線、決算後の変化を重視します。
- `LONG`: 1年以上の長期保有。短期値動きだけでは売り判定を強くせず、事業・配当・優待・長期トレンドを重視します。

`positionPurpose` は保有目的です。

- `CORE`: S&P500など資産の土台
- `INCOME`: 配当・優待
- `GROWTH`: 長期成長
- `THEME`: 半導体・防衛などテーマ
- `REBOUND`: 下落後の反発
- `WATCH`: 監視のみ

短期銘柄は +10〜20% の含み益でも利確候補が出やすく、損切り判定も早めです。長期NISA枠は短期上昇だけでは売り判定を弱め、減配・優待改悪・長期トレンド崩れを重視します。半導体銘柄はテーマ性を評価しますが、高ボラティリティや集中リスクにも注意します。

NISA長期枠とSBI特定短期枠では、同じ銘柄でも売り時が変わります。これは「いつまで・何の目的で持つか」が違うためです。

## 登録後に編集する方法

- 銘柄追加: `/stocks/new`
- 投資期間・保有目的の編集: `/stocks/[symbol]/edit`
- 判断メモの追加: `/stocks/[symbol]` または `/journal`
- 資金設定の編集: `/portfolio/settings`

## 判断メモ追加フォームの使い方

判断メモは `/stocks/[symbol]` の銘柄詳細、または `/journal` から追加できます。これは投資助言ではなく、自分がなぜ候補として見たのか、どこで見直すのかを後から振り返るための記録です。

`actionType` は画面では日本語で表示され、DBには内部値で保存されます。

- `BUY_PLAN`: 買う前の計画
- `BUY`: 実際に買った
- `SELL_PLAN`: 売る前の計画
- `SELL`: 実際に売った
- `HOLD`: 継続保有
- `REVIEW`: 見直し

`accountType` も画面では日本語表示です。

- `NISA`: NISA
- `TOKUTEI`: 特定口座
- `WATCH_ONLY`: 監視のみ

感情タグは、判断時の自分の状態を残すためのものです。

- `calm`: 冷静
- `planned`: 計画通り
- `fear_of_missing_out`: 置いていかれそうで焦り
- `panic`: パニック
- `revenge_trade`: 取り返したい
- `uncertain`: 自信なし・迷い中

数量は未定でも保存できます。買う前の計画、見直し、監視のみでは数量が決まっていないことがあるためです。ただし、`BUY` または `SELL` の実際の売買記録では、数量を入れると後で振り返りやすくなります。

価格は現在値が取得できている場合、自動で入力されます。ユーザーが上書きできます。空欄でも保存できますが、その場合は「価格未入力」と表示します。

フォームには以下の入力補助ボタンがあります。

- テンプレートを入れる
- 現在値を価格に入れる
- 買いラインを見直し条件に入れる
- 利確ラインを利確条件に入れる
- 損切りラインを損切り条件に入れる
- 内容をクリア

銘柄別テンプレートは、まず以下に対応しています。

- `6526.T` ソシオネクスト
- `7013.T` IHI
- `9434.T` ソフトバンク
- `9432.T` NTT
- `7974.T` 任天堂
- `6857.T` アドバンテスト
- `SP500_FUND` eMAXIS Slim 米国株式 S&P500

テンプレートは断定的な売買指示ではなく、買う理由、期待シナリオ、見直し条件、利確条件、損切り条件を整理するための下書きです。必要に応じて自分の言葉に直して保存してください。

## ルールベースAI風判定

このアプリはAI API、OpenAI API、有料APIを使いません。無料で取得できる価格データ、移動平均、出来高、保有情報、資金設定、タグ、投資期間、保有目的を固定ルールで組み合わせて、AI風の候補整理を行います。

追加スコアの意味:

- `marketScore`: 日経平均、S&P500、NASDAQ、半導体ETFなど取得できる指数から見た相場環境です。
- `timingScore`: 買いライン、移動平均、短期下落、出来高などから見たタイミングです。
- `fomoRiskScore`: 急騰後に焦って追いかける高値追いリスクです。
- `averagingDownRiskScore`: 含み損、下落トレンド、買い増し過多によるナンピン危険度です。
- `portfolioFitScore`: 現金比率、最大投資額、口座区分、投資期間、保有目的との相性です。
- `decisionConfidenceScore`: 現在値、履歴価格、相場環境、アラート設定などのデータ充足度を含めた総合判定の信頼度です。
- `doNotBuyScore`: 買いラインに近くても待つ理由の強さです。
- `finalDecision`: 複数スコアを組み合わせた総合ラベルです。

`finalDecision` には、強い買い候補、少額なら買い候補、買いライン接近、反発確認待ち、決算待ち、買わない理由あり、監視のみ、継続保有、一部利確候補、利確優先、長期方針見直し、損切り検討、計画外購入注意などを表示します。

買い候補よりも「買わない理由」を重視します。買いラインに近くても、危険度、FOMOリスク、ナンピン危険度、現金比率、最大投資額、テーマ偏り、地合い悪化が重なる場合は、待ち・監視・反発確認待ちの表示を優先します。これは売買指示ではなく、自分の判断を冷静にするための注意表示です。

銘柄詳細では、AI APIを使わずにタグとスコアから以下の3つのシナリオをテンプレート生成します。

- 強気シナリオ
- 中立シナリオ
- 弱気シナリオ

判断メモを保存すると、その時点の買い候補、売り候補、危険度、買わない理由、FOMOリスク、ナンピン危険度、ポートフォリオ適合、総合判定を `trade_journal` に保存します。後から `/analytics/decisions` で、過去の判定後に価格がどう動いたかを確認できます。

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
- このアプリは個人利用向けとして作っています。
- 投資助言、売買指示、自動売買は行いません。

## 動作確認手順

1. `/import/stocks` を開く
2. JSONを貼る
3. 検証ボタンで内容確認できる
4. 一括登録できる
5. 既存銘柄はスキップまたは更新できる
6. `/import/presets` を開く
7. 13万円初期プランを登録できる
8. `/portfolio/target` に反映される
9. `/rankings/nisa` にNISA候補が反映される
10. `/rankings/tokutei` に特定口座候補が反映される
11. ソシオネクストを `SHORT` / `THEME` に設定できる
12. NTTを `LONG` / `INCOME` に設定できる
13. `/rankings/by-horizon` で期間別に表示される
14. Discord通知に投資期間と目的が表示される
15. 判断メモ追加フォームを開ける
16. actionType / accountType / emotionTag が日本語で表示される
17. quantity が空でも保存できる
18. currentPrice が price に自動入力される
19. ソシオネクストで「テンプレートを入れる」を押すと判断メモが自動入力される
20. 入力補助ボタンが動作する
21. 保存後、判断メモ一覧で日本語表示される
22. `/rankings/smart` で総合AI風ランキングが表示される
23. `/rankings/do-not-buy` で買わない理由ランキングが表示される
24. `/rankings/fomo-risk` で高値追い注意ランキングが表示される
25. `/rankings/averaging-down-risk` でナンピン注意ランキングが表示される
26. `/rankings/portfolio-fit` でポートフォリオ適合ランキングが表示される
27. Discord通知に `finalDecision` と追加スコアが表示される
28. BUY_PLAN保存時に `trade_journal` に保存時点のスコアが残る
29. `/analytics/decisions` で過去判定を検証できる
