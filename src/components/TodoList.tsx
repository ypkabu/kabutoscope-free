import type { TodoItem as TodoItemType } from "../types";
import { TodoItem } from "./TodoItem";

type TodoListProps = {
  todos: TodoItemType[];
  onUpdate: (todo: TodoItemType) => void;
};

export function TodoList({ todos, onUpdate }: TodoListProps) {
  return (
    <section aria-labelledby="todo-list-title">
      <h2 id="todo-list-title" className="mb-3 text-lg font-semibold text-white">
        TODO一覧
      </h2>
      <div className="space-y-3">
        {todos.length > 0 ? (
          todos.map((todo) => <TodoItem key={todo.id} todo={todo} onUpdate={onUpdate} />)
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 bg-slate-950/60 p-8 text-center text-slate-400">
            条件に一致するタスクはありません。
          </div>
        )}
      </div>
    </section>
  );
}
