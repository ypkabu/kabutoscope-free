import { categoryStyles } from "../data/initialData";

type CategoryCardProps = {
  category: string;
  total: number;
  done: number;
  highOpenCount: number;
};

export function CategoryCard({ category, total, done, highOpenCount }: CategoryCardProps) {
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);
  const style = categoryStyles[category] ?? categoryStyles.README;

  return (
    <article className={`rounded-lg border ${style.border} bg-slate-950/70 p-4`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className={`text-sm font-semibold ${style.text}`}>{category}</h3>
        <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${style.badge}`}>
          {done}/{total}
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${rate}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>{rate}% 完了</span>
        <span className={highOpenCount > 0 ? "font-semibold text-red-200" : "text-slate-500"}>
          high未完了 {highOpenCount}
        </span>
      </div>
    </article>
  );
}
