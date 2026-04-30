export type Priority = "high" | "medium" | "low";
export type TodoStatus = "todo" | "doing" | "done";

export type TodoItem = {
  id: string;
  category: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TodoStatus;
  dueHint?: string;
  links?: string[];
  note?: string;
};

export type TodoFiltersState = {
  category: string;
  priority: "all" | Priority;
  incompleteOnly: boolean;
  search: string;
};

export type StoredAppState = {
  todos: TodoItem[];
  essayText: string;
  lastUpdated: string;
};
