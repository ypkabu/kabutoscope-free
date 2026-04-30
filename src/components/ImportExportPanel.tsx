import type { StoredAppState } from "../types";

type ImportExportPanelProps = {
  state: StoredAppState;
  onImport: (state: StoredAppState) => void;
  onReset: () => void;
};

export function ImportExportPanel({ state, onImport, onReset }: ImportExportPanelProps) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wipe-snap-es-manager-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File | undefined) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as StoredAppState;
        if (!Array.isArray(parsed.todos) || typeof parsed.essayText !== "string") {
          throw new Error("Invalid backup shape");
        }
        onImport({
          todos: parsed.todos,
          essayText: parsed.essayText,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        });
      } catch {
        window.alert("JSONの形式を確認してください。");
      }
    };
    reader.readAsText(file);
  };

  return (
    <section className="rounded-lg border border-white/10 bg-slate-950/70 p-4">
      <h2 className="text-lg font-semibold text-white">データ管理</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button
          className="rounded-md border border-teal-300/30 bg-teal-400/10 px-3 py-2 text-sm font-semibold text-teal-100 transition hover:bg-teal-400/20"
          type="button"
          onClick={exportJson}
        >
          JSONエクスポート
        </button>
        <label className="cursor-pointer rounded-md border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-center text-sm font-semibold text-sky-100 transition hover:bg-sky-400/20">
          JSONインポート
          <input
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={(event) => importJson(event.target.files?.[0])}
          />
        </label>
        <button
          className="rounded-md border border-red-300/30 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-400/20"
          type="button"
          onClick={onReset}
        >
          初期状態にリセット
        </button>
      </div>
    </section>
  );
}
