import { categories } from "../data/initialData";
import type { TodoItem } from "../types";
import { CategoryCard } from "./CategoryCard";

type ProgressDashboardProps = {
  todos: TodoItem[];
};

export function ProgressDashboard({ todos }: ProgressDashboardProps) {
  return (
    <section aria-labelledby="progress-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="progress-title" className="text-lg font-semibold text-white">
          進捗ダッシュボード
        </h2>
        <span className="text-sm text-slate-400">カテゴリ別の残り火力を確認</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => {
          const categoryTodos = todos.filter((todo) => todo.category === category);
          const done = categoryTodos.filter((todo) => todo.status === "done").length;
          const highOpenCount = categoryTodos.filter(
            (todo) => todo.priority === "high" && todo.status !== "done",
          ).length;

          return (
            <CategoryCard
              key={category}
              category={category}
              total={categoryTodos.length}
              done={done}
              highOpenCount={highOpenCount}
            />
          );
        })}
      </div>
    </section>
  );
}
