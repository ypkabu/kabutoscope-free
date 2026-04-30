type EssayTextPanelProps = {
  value: string;
  onChange: (value: string) => void;
};

export function EssayTextPanel({ value, onChange }: EssayTextPanelProps) {
  return (
    <section className="rounded-lg border border-amber-300/30 bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">ES貼り付け用文章</h2>
        <span className="text-xs text-slate-400">{value.length} 文字</span>
      </div>
      <textarea
        className="min-h-56 w-full resize-y rounded-md border border-white/10 bg-slate-900 px-3 py-3 text-sm leading-7 text-slate-100 outline-none ring-amber-300/40 focus:ring-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
