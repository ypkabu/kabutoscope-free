type HeaderProps = {
  totalCount: number;
  doneCount: number;
  completionRate: number;
  lastUpdated: string;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "未保存";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export function Header({ totalCount, doneCount, completionRate, lastUpdated }: HeaderProps) {
  const stats = [
    { label: "総タスク数", value: totalCount },
    { label: "完了数", value: doneCount },
    { label: "完了率", value: `${completionRate}%` },
    { label: "最終更新", value: formatDateTime(lastUpdated) },
  ];

  return (
    <header className="rounded-lg border border-white/10 bg-slate-950/80 p-5 shadow-glow backdrop-blur md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-200">Cygames Internship Preparation</p>
          <h1 className="mt-2 text-2xl font-bold tracking-normal text-white md:text-4xl">
            Wipe&amp;Snap ES Submission Manager
          </h1>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[560px]">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-3">
              <dt className="text-xs text-slate-400">{stat.label}</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-50">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
