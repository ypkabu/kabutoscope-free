import type { TodoItem } from "../types";

type TodayFocusProps = {
  todos: TodoItem[];
};

export function TodayFocus({ todos }: TodayFocusProps) {
  const highOpenTodos = todos.filter((todo) => todo.priority === "high" && todo.status !== "done");
  const focusTodos = highOpenTodos.slice(0, 8);

  return (
    <section className="rounded-lg border border-red-300/30 bg-red-950/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-red-100">今日やること</h2>
        <span className="rounded-full bg-red-400/15 px-2.5 py-1 text-xs font-semibold text-red-100">
          high未完了 {highOpenTodos.length}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {focusTodos.length > 0 ? (
          focusTodos.map((todo) => (
            <div key={todo.id} className="rounded-md border border-white/10 bg-slate-950/70 p-3">
              <p className="text-sm font-semibold text-white">{todo.title}</p>
              <p className="mt-1 text-xs text-slate-400">{todo.category}</p>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-400">
            high priority の未完了タスクはありません。
          </p>
        )}
      </div>
    </section>
  );
}
