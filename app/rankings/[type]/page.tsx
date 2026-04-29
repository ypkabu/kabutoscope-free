import { notFound } from "next/navigation";
import { RankingTable } from "@/components/RankingTable";
import { getRankedOverviews } from "@/lib/repositories";

const titles: Record<string, string> = {
  nisa: "NISA向き候補ランキング",
  tokutei: "特定口座向き候補ランキング",
  buy: "買い候補ランキング",
  sell: "保有株の利確・見直し候補ランキング",
  risk: "危険度ランキング"
};

export default async function RankingPage({ params }: { params: { type: string } }) {
  const type = params.type;
  if (!titles[type]) {
    notFound();
  }

  const rows = await getRankedOverviews(type);

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
