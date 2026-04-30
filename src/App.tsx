import { useEffect, useMemo, useState } from "react";
import { EssayTextPanel } from "./components/EssayTextPanel";
import { Header } from "./components/Header";
import { ImportExportPanel } from "./components/ImportExportPanel";
import { ProgressDashboard } from "./components/ProgressDashboard";
import { TodayFocus } from "./components/TodayFocus";
import { TodoFilters } from "./components/TodoFilters";
import { TodoList } from "./components/TodoList";
import { initialEssayText, initialTodos } from "./data/initialData";
import type { StoredAppState, TodoFiltersState, TodoItem } from "./types";

const storageKey = "wipe-snap-es-submission-manager";

const createInitialState = (): StoredAppState => ({
  todos: initialTodos,
  essayText: initialEssayText,
  lastUpdated: new Date().toISOString(),
});

const loadStoredState = (): StoredAppState => {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return createInitialState();
  }

  try {
    const parsed = JSON.parse(raw) as StoredAppState;
    if (!Array.isArray(parsed.todos) || typeof parsed.essayText !== "string") {
      return createInitialState();
    }
    return {
      todos: parsed.todos,
      essayText: parsed.essayText,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch {
    return createInitialState();
  }
};

function App() {
  const [storedState, setStoredState] = useState<StoredAppState>(loadStoredState);
  const [filters, setFilters] = useState<TodoFiltersState>({
    category: "all",
    priority: "all",
    incompleteOnly: false,
    search: "",
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(storedState));
  }, [storedState]);

  const updateTodo = (updatedTodo: TodoItem) => {
    setStoredState((current) => ({
      ...current,
      todos: current.todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)),
      lastUpdated: new Date().toISOString(),
    }));
  };

  const updateEssayText = (essayText: string) => {
    setStoredState((current) => ({
      ...current,
      essayText,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const resetState = () => {
    if (window.confirm("保存済みの進捗とメモを初期状態に戻しますか？")) {
      setStoredState(createInitialState());
    }
  };

  const importState = (state: StoredAppState) => {
    setStoredState({ ...state, lastUpdated: new Date().toISOString() });
  };

  const stats = useMemo(() => {
    const totalCount = storedState.todos.length;
    const doneCount = storedState.todos.filter((todo) => todo.status === "done").length;
    const completionRate = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
    return { totalCount, doneCount, completionRate };
  }, [storedState.todos]);

  const filteredTodos = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return storedState.todos.filter((todo) => {
      const matchesCategory = filters.category === "all" || todo.category === filters.category;
      const matchesPriority = filters.priority === "all" || todo.priority === filters.priority;
      const matchesDone = !filters.incompleteOnly || todo.status !== "done";
      const haystack = `${todo.title} ${todo.description ?? ""} ${todo.note ?? ""}`.toLowerCase();
      const matchesSearch = query.length === 0 || haystack.includes(query);

      return matchesCategory && matchesPriority && matchesDone && matchesSearch;
    });
  }, [filters, storedState.todos]);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <Header
        totalCount={stats.totalCount}
        doneCount={stats.doneCount}
        completionRate={stats.completionRate}
        lastUpdated={storedState.lastUpdated}
      />

      <ProgressDashboard todos={storedState.todos} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <TodoFilters filters={filters} onChange={setFilters} visibleCount={filteredTodos.length} />
          <TodoList todos={filteredTodos} onUpdate={updateTodo} />
        </div>
        <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
          <TodayFocus todos={storedState.todos} />
          <EssayTextPanel value={storedState.essayText} onChange={updateEssayText} />
          <ImportExportPanel state={storedState} onImport={importState} onReset={resetState} />
        </aside>
      </div>
    </main>
  );
}

export default App;
