import Link from "next/link";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KabutoScope Free",
  description: "個人用の株式監視・スコアリング・Discord通知ツール"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="siteHeader">
          <Link href="/" className="brand">
            KabutoScope Free
          </Link>
          <nav>
            <Link href="/stocks">銘柄一覧</Link>
            <Link href="/rankings/nisa">NISA</Link>
            <Link href="/rankings/tokutei">特定口座</Link>
            <Link href="/rankings/buy">買い候補</Link>
            <Link href="/rankings/smart">総合判定</Link>
            <Link href="/rankings/do-not-buy">買わない理由</Link>
            <Link href="/rankings/sell">利確・見直し</Link>
            <Link href="/rankings/risk">危険度</Link>
            <Link href="/portfolio/target">目標</Link>
            <Link href="/analytics/decisions">判定検証</Link>
            <Link href="/import/stocks">インポート</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
