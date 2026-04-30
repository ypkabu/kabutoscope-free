# Wipe&Snap ES Submission Manager

Cygamesインターン応募に向けて、Zenn記事、GitHub提出用リポジトリ、README、動画・画像素材、ES貼り付け文章、生成AI利用申告をまとめて管理するローカルTODOアプリです。

## 機能

- カテゴリ別の進捗ダッシュボード
- high priority の未完了タスクを集約する「今日やること」
- TODOの完了切り替え、ステータス変更、メモ編集
- カテゴリ、優先度、未完了、検索による絞り込み
- ES貼り付け用文章の編集と保存
- localStorageへの自動保存
- 初期状態へのリセット
- JSONエクスポート / インポート

## 技術構成

- React
- TypeScript
- Vite
- Tailwind CSS
- localStorage

## 起動方法

依存関係をインストールします。

```bash
npm install
```

開発サーバーを起動します。

```bash
npm run dev
```

表示されたURLをブラウザで開きます。通常は `http://localhost:5173/` です。

## 確認コマンド

型チェック:

```bash
npm run typecheck
```

本番ビルド:

```bash
npm run build
```

## データ保存

進捗、メモ、ステータス、ES貼り付け用文章はブラウザのlocalStorageに保存されます。別ブラウザや別PCに移す場合は、画面内のJSONエクスポート / インポートを使ってください。
