type ScoreBadgeProps = {
  label: string;
  score?: number | null;
};

export function ScoreBadge({ label, score }: ScoreBadgeProps) {
  const tone = score === null || score === undefined ? "neutral" : score >= 80 ? "strong" : score >= 60 ? "medium" : score >= 40 ? "watch" : "low";

  return (
    <span className={`scoreBadge ${tone}`}>
      <span>{label}</span>
      {score !== null && score !== undefined ? <strong>{score}</strong> : <strong>--</strong>}
    </span>
  );
}
