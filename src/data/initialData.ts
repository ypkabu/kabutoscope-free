import type { Priority, TodoItem } from "../types";

export const categories = [
  "Zenn記事",
  "動画・画像素材",
  "GitHub提出用リポジトリ",
  "README",
  "コミット整理",
  "ES入力文",
  "生成AI利用申告",
  "最終提出前チェック",
] as const;

export const categoryStyles: Record<
  string,
  { border: string; text: string; bar: string; badge: string }
> = {
  Zenn記事: {
    border: "border-cyan-400/40",
    text: "text-cyan-200",
    bar: "bg-cyan-400",
    badge: "bg-cyan-400/15 text-cyan-100",
  },
  "動画・画像素材": {
    border: "border-rose-400/40",
    text: "text-rose-200",
    bar: "bg-rose-400",
    badge: "bg-rose-400/15 text-rose-100",
  },
  GitHub提出用リポジトリ: {
    border: "border-violet-400/40",
    text: "text-violet-200",
    bar: "bg-violet-400",
    badge: "bg-violet-400/15 text-violet-100",
  },
  README: {
    border: "border-emerald-400/40",
    text: "text-emerald-200",
    bar: "bg-emerald-400",
    badge: "bg-emerald-400/15 text-emerald-100",
  },
  コミット整理: {
    border: "border-sky-400/40",
    text: "text-sky-200",
    bar: "bg-sky-400",
    badge: "bg-sky-400/15 text-sky-100",
  },
  ES入力文: {
    border: "border-amber-400/40",
    text: "text-amber-200",
    bar: "bg-amber-400",
    badge: "bg-amber-400/15 text-amber-100",
  },
  生成AI利用申告: {
    border: "border-fuchsia-400/40",
    text: "text-fuchsia-200",
    bar: "bg-fuchsia-400",
    badge: "bg-fuchsia-400/15 text-fuchsia-100",
  },
  最終提出前チェック: {
    border: "border-lime-400/40",
    text: "text-lime-200",
    bar: "bg-lime-400",
    badge: "bg-lime-400/15 text-lime-100",
  },
};

type RawTodo = Omit<TodoItem, "id" | "status"> & { priority: Priority };

const rawTodos: RawTodo[] = [
  {
    category: "Zenn記事",
    title: "Zenn記事を完成させる",
    priority: "high",
    description:
      "技術説明、担当範囲、AI利用説明はかなり整っている。残りは動作デモと最終確認。",
  },
  { category: "Zenn記事", title: "動作デモ欄に動画・GIF・画像を入れる", priority: "high" },
  {
    category: "Zenn記事",
    title: "プレイ全体の様子を入れる",
    priority: "high",
    description:
      "メインモニター、スマホ画面、自作カメラ型コントローラー、Leap Motionでの拭き取りが同時に分かる30秒程度の動画またはGIF。",
  },
  {
    category: "Zenn記事",
    title: "スマホファインダーの映像を入れる",
    priority: "high",
    description: "ズーム中にスマホ側へSceneCapture2Dの別映像が表示されている様子。",
  },
  {
    category: "Zenn記事",
    title: "Leap Motionで拭き取る様子を入れる",
    priority: "high",
    description: "手の移動量に応じてレンズ汚れが消える様子。",
  },
  {
    category: "Zenn記事",
    title: "自作カメラ型コントローラーの写真を入れる",
    priority: "high",
    description: "Joy-Conとスマホを段ボール製筐体に組み込んでいることが分かる写真。",
  },
  {
    category: "Zenn記事",
    title: "Zenn記事内のTODOや仮文章が残っていないか確認する",
    priority: "high",
    description: "特に画像リンク、制作期間、仮URL、○○表記を確認。",
  },
  { category: "Zenn記事", title: "Zenn上で画像・動画リンクが正しく表示されるか確認する", priority: "high" },
  {
    category: "Zenn記事",
    title: "Front Matterが正しいZenn形式になっているか確認する",
    priority: "high",
    description: "title, emoji, type, topics, published の形式を確認。",
  },
  { category: "Zenn記事", title: "である調に文体が統一されているか確認する", priority: "medium" },
  { category: "Zenn記事", title: "Zenn記事URLを取得する", priority: "high" },
  { category: "動画・画像素材", title: "30秒程度のプレイ全体動画を撮影する", priority: "high" },
  { category: "動画・画像素材", title: "スマホファインダーのGIFを作成する", priority: "high" },
  { category: "動画・画像素材", title: "Leap Motion拭き取りGIFを作成する", priority: "high" },
  { category: "動画・画像素材", title: "自作カメラ型コントローラーの写真を撮る", priority: "high" },
  {
    category: "動画・画像素材",
    title: "動画を提出用に圧縮・リネームする",
    priority: "medium",
    description: "ファイル名に作品名、応募者名、応募IDなどを入れる場合は指定に従う。",
  },
  {
    category: "動画・画像素材",
    title: "動画アップロード先を決める",
    priority: "high",
    description: "ギガファイル便、Google Drive、YouTube限定公開など、募集要項に合う形式を選ぶ。",
  },
  {
    category: "動画・画像素材",
    title: "動画リンクが外部から見られるか確認する",
    priority: "high",
    description: "シークレットモードや別端末で確認。",
  },
  { category: "GitHub提出用リポジトリ", title: "新しい提出用リポジトリを作成する", priority: "high" },
  { category: "GitHub提出用リポジトリ", title: "新しい提出用リポジトリをローカルにCloneする", priority: "high" },
  { category: "GitHub提出用リポジトリ", title: "UE5用 .gitignore を入れる", priority: "high" },
  {
    category: "GitHub提出用リポジトリ",
    title: "不要フォルダを入れない",
    priority: "high",
    description: "Binaries, DerivedDataCache, Intermediate, Saved, .vs など。",
  },
  { category: "GitHub提出用リポジトリ", title: "Binaries/ が入っていないか確認する", priority: "high" },
  { category: "GitHub提出用リポジトリ", title: "DerivedDataCache/ が入っていないか確認する", priority: "high" },
  { category: "GitHub提出用リポジトリ", title: "Intermediate/ が入っていないか確認する", priority: "high" },
  { category: "GitHub提出用リポジトリ", title: "Saved/ が入っていないか確認する", priority: "high" },
  { category: "GitHub提出用リポジトリ", title: ".vs/ が入っていないか確認する", priority: "high" },
  { category: "GitHub提出用リポジトリ", title: "公開してよいソース・ファイルだけ入れる", priority: "high" },
  { category: "GitHub提出用リポジトリ", title: "有料アセットが混ざっていないか確認する", priority: "high" },
  { category: "GitHub提出用リポジトリ", title: "他人の素材や公開NGファイルが混ざっていないか確認する", priority: "high" },
  { category: "GitHub提出用リポジトリ", title: "APIキー、個人情報、ローカルパスが入っていないか確認する", priority: "high" },
  {
    category: "GitHub提出用リポジトリ",
    title: "GitHubリポジトリをpublicにするかprivate共有にするか確認する",
    priority: "medium",
    description: "募集要項に合わせる。",
  },
  { category: "GitHub提出用リポジトリ", title: "GitHub URLを取得する", priority: "high" },
  { category: "コミット整理", title: "chore: add Unreal Engine gitignore", priority: "medium" },
  { category: "コミット整理", title: "feat: add core gameplay source", priority: "medium" },
  { category: "コミット整理", title: "feat: add phone display SWindow implementation", priority: "medium" },
  { category: "コミット整理", title: "feat: add zoom viewfinder RenderTarget implementation", priority: "medium" },
  { category: "コミット整理", title: "feat: add Leap Motion wiping system", priority: "medium" },
  { category: "コミット整理", title: "docs: add README with project overview", priority: "medium" },
  {
    category: "コミット整理",
    title: "コミット履歴が提出用として見やすいか確認する",
    priority: "medium",
    description: "無理に細かく分けすぎず、技術単位で分ける。",
  },
  { category: "README", title: "READMEを完成させる", priority: "high" },
  { category: "README", title: "作品概要を書く", priority: "high" },
  {
    category: "README",
    title: "制作人数を書く",
    priority: "high",
    description: "4人チーム制作であることを明記。",
  },
  {
    category: "README",
    title: "制作期間を書く",
    priority: "high",
    description: "約2か月など、正確な期間を書く。",
  },
  {
    category: "README",
    title: "使用技術を書く",
    priority: "high",
    description: "UE5, C++, Blueprint, SWindow, SceneCapture2D, RenderTarget, UltraleapTracking など。",
  },
  { category: "README", title: "自分の担当範囲を書く", priority: "high" },
  {
    category: "README",
    title: "他メンバーの担当範囲を書く",
    priority: "medium",
    description: "3Dモデル、ステージ制作、サウンド、ゲームルールの検討など。",
  },
  {
    category: "README",
    title: "主な実装クラスを書く",
    priority: "high",
    description: "ATomatinaHUD, ATomatinaPlayerPawn, ATomatinaTowelSystem, ATomatoDirtManager など。",
  },
  { category: "README", title: "Zenn記事へのリンクを書く", priority: "high" },
  { category: "README", title: "動作デモへのリンクを書く", priority: "high" },
  {
    category: "README",
    title: "提出用リポジトリであることを書く",
    priority: "high",
    description: "実際の全コミット履歴ではなく、インターン応募用に整理したリポジトリであることを明記。",
  },
  {
    category: "README",
    title: "生成AI利用について簡潔に書く",
    priority: "medium",
    description: "Claude Codeを補助的に利用。仕様設計・採用判断・実機検証は自分で行ったことを書く。",
  },
  { category: "README", title: "READMEの画像・動画リンクが表示されるか確認する", priority: "high" },
  {
    category: "ES入力文",
    title: "ESのリンク欄に貼るURLを整理する",
    priority: "high",
    description: "Zenn記事URL、GitHub URL、動画URLの順番を決める。",
  },
  { category: "ES入力文", title: "ESのリンク欄や説明欄に貼る文章を用意する", priority: "high" },
  { category: "ES入力文", title: "Q28の制作物説明文を最終確認する", priority: "high" },
  { category: "ES入力文", title: "Q31の生成AI利用内容を最終確認する", priority: "high" },
  {
    category: "ES入力文",
    title: "Q35 / Q38の志望理由と制作物内容に矛盾がないか確認する",
    priority: "medium",
  },
  {
    category: "ES入力文",
    title: "ES本文とZenn記事の表記を統一する",
    priority: "high",
    description: "Wipe&Snap、4人チーム、約2か月、担当範囲など。",
  },
  { category: "ES入力文", title: "Tomatina表記が記事中のクラス名説明以外に残っていないか確認する", priority: "high" },
  { category: "生成AI利用申告", title: "Claude Codeを使用した内容を整理する", priority: "high" },
  { category: "生成AI利用申告", title: "生成AI利用の申告文を作る", priority: "high" },
  { category: "生成AI利用申告", title: "仕様設計・実機検証・採用判断は自分で行ったことを書く", priority: "high" },
  {
    category: "生成AI利用申告",
    title: "AI案をそのまま採用しなかった例を書く",
    priority: "medium",
    description: "RenderTarget表示でBrush再生成案ではなくDMI方式を採用した例など。",
  },
  { category: "生成AI利用申告", title: "Cygamesの生成AI利用規定と矛盾がないか確認する", priority: "high" },
  { category: "最終提出前チェック", title: "Zenn記事をスマホとPCで表示確認する", priority: "high" },
  { category: "最終提出前チェック", title: "GitHub READMEをスマホとPCで表示確認する", priority: "high" },
  { category: "最終提出前チェック", title: "動画リンクが期限切れしないか確認する", priority: "high" },
  {
    category: "最終提出前チェック",
    title: "ギガファイル便などを使う場合、保存期限を締切後まで長めに設定する",
    priority: "high",
  },
  { category: "最終提出前チェック", title: "GitHubに公開NGファイルがないか最終確認する", priority: "high" },
  { category: "最終提出前チェック", title: "ESフォームの文字数制限を再確認する", priority: "high" },
  { category: "最終提出前チェック", title: "ESのURL欄に貼ったリンクをクリックして確認する", priority: "high" },
  { category: "最終提出前チェック", title: "提出前に第三者視点でZenn記事を一度読む", priority: "medium" },
  { category: "最終提出前チェック", title: "提出前にREADMEを一度読む", priority: "medium" },
  { category: "最終提出前チェック", title: "提出完了後、提出内容のスクリーンショットを保存する", priority: "low" },
];

export const initialTodos: TodoItem[] = rawTodos.map((todo, index) => ({
  ...todo,
  id: `todo-${String(index + 1).padStart(3, "0")}`,
  status: "todo",
  note: "",
}));

export const initialEssayText = `UE5/C++で制作した4人チーム作品「Wipe&Snap」の技術記事です。
私は主に、ゲーム体験の企画、スマホ表示用SWindow、SceneCapture2D + RenderTargetによるズームファインダー、Leap Motion Controllerを用いた拭き取り判定、UI/UX調整を担当しました。
チーム制作のため、GitHubは実際の開発履歴ではなく、インターン応募用に自分の担当実装を確認しやすい形で整理した提出用リポジトリを掲載しています。`;
