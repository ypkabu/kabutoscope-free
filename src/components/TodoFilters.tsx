import { categories } from "../data/initialData";
import type { TodoFiltersState } from "../types";

type TodoFiltersProps = {
  filters: TodoFiltersState;
  onChange: (filters: TodoFiltersState) => void;
  visibleCount: number;
};

export function TodoFilters({ filters, onChange, visibleCount }: TodoFiltersProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm text-slate-300">
          検索
          <input
            className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-teal-300/40 placeholder:text-slate-600 focus:ring-2"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
            placeholder="タイトル、説明、メモを検索"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          カテゴリ
          <select
            className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-teal-300/40 focus:ring-2"
            value={filters.category}
            onChange={(event) => onChange({ ...filters, category: event.target.value })}
          >
            <option value="all">すべて</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          優先度
          <select
            className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-teal-300/40 focus:ring-2"
            value={filters.priority}
            onChange={(event) =>
              onChange({ ...filters, priority: event.target.value as TodoFiltersState["priority"] })
            }
          >
            <option value="all">すべて</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200">
          <input
            type="checkbox"
            className="h-4 w-4 accent-teal-400"
            checked={filters.incompleteOnly}
            onChange={(event) => onChange({ ...filters, incompleteOnly: event.target.checked })}
          />
          未完了のみ
        </label>
        <div className="rounded-md bg-white/[0.05] px-3 py-2 text-sm text-slate-300">
          表示中 <span className="font-semibold text-white">{visibleCount}</span> 件
        </div>
      </div>
    </section>
  );
}
