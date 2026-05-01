import { notFound } from "next/navigation";
import { RankingTable } from "@/components/RankingTable";
import { getRankedOverviews } from "@/lib/repositories";

const titles: Record<string, string> = {
  nisa: "NISA向き候補ランキング",
  tokutei: "特定口座向き候補ランキング",
  buy: "買い候補ランキング",
  sell: "保有株の利確・見直し候補ランキング",
  risk: "危険度ランキング",
  "short-term-sell": "短期利確候補ランキング",
  "long-term-review": "長期見直し候補ランキング",
  "by-horizon": "投資期間別ランキング"
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RankingPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!titles[type]) {
    notFound();
  }

  const rows = await getRankedOverviews(type);
  if (type === "by-horizon") {
    return (
      <>
        <div className="pageHeader">
          <div>
            <h1>{titles[type]}</h1>
            <p className="muted">短期・中期・長期ごとに候補を分けて表示します。</p>
          </div>
        </div>
        {(["SHORT", "MEDIUM", "LONG"] as const).map((horizon) => (
          <section className="card" style={{ marginTop: 16 }} key={horizon}>
            <h2>{horizon === "SHORT" ? "短期" : horizon === "MEDIUM" ? "中期" : "長期"}</h2>
            <RankingTable type="buy" rows={rows.filter((row) => row.holding?.investmentHorizon === horizon)} />
          </section>
        ))}
      </>
    );
  }

  return (
    <>
      <div className="pageHeader">
        <div>
          <h1>{titles[type]}</h1>
          <p className="muted">ルールベースの疑似AIスコアです。投資助言ではなく、候補整理と監視のための表示です。</p>
        </div>
      </div>
      <RankingTable type={type} rows={rows} />
    </>
  );
}
