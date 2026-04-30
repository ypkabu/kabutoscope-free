import { categoryStyles } from "../data/initialData";
import type { Priority, TodoItem as TodoItemType, TodoStatus } from "../types";

type TodoItemProps = {
  todo: TodoItemType;
  onUpdate: (todo: TodoItemType) => void;
};

const priorityClass: Record<Priority, string> = {
  high: "border-red-400/50 bg-red-500/15 text-red-100",
  medium: "border-amber-400/40 bg-amber-500/15 text-amber-100",
  low: "border-slate-400/30 bg-slate-500/15 text-slate-200",
};

const statusLabel: Record<TodoStatus, string> = {
  todo: "todo",
  doing: "doing",
  done: "done",
};

export function TodoItem({ todo, onUpdate }: TodoItemProps) {
  const categoryStyle = categoryStyles[todo.category] ?? categoryStyles.README;
  const isDone = todo.status === "done";

  return (
    <article
      className={`rounded-lg border bg-slate-950/75 p-4 transition ${categoryStyle.border} ${
        isDone ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <label className="flex items-start gap-3 md:flex-1">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 shrink-0 accent-teal-400"
            checked={isDone}
            onChange={(event) => onUpdate({ ...todo, status: event.target.checked ? "done" : "todo" })}
          />
          <span>
            <span
              className={`block text-base font-semibold text-slate-50 ${
                isDone ? "line-through decoration-slate-400" : ""
              }`}
            >
              {todo.title}
            </span>
            {todo.description && <span className="mt-1 block text-sm leading-6 text-slate-400">{todo.description}</span>}
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${categoryStyle.badge}`}>
            {todo.category}
          </span>
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityClass[todo.priority]}`}>
            {todo.priority}
          </span>
          <select
            className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none ring-teal-300/40 focus:ring-2"
            value={todo.status}
            onChange={(event) => onUpdate({ ...todo, status: event.target.value as TodoStatus })}
            aria-label={`${todo.title}のステータス`}
          >
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {todo.links && todo.links.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {todo.links.map((link) => (
            <a key={link} className="text-sm text-teal-200 underline-offset-4 hover:underline" href={link}>
              {link}
            </a>
          ))}
        </div>
      )}
      <label className="mt-3 block text-sm text-slate-300">
        note
        <textarea
          className="mt-1 min-h-20 w-full resize-y rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm leading-6 text-slate-100 outline-none ring-teal-300/40 placeholder:text-slate-600 focus:ring-2"
          value={todo.note ?? ""}
          onChange={(event) => onUpdate({ ...todo, note: event.target.value })}
          placeholder="リンク、提出前メモ、確認結果など"
        />
      </label>
    </article>
  );
}
