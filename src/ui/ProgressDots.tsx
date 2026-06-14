import type { CharacterAssessment } from "../types/session";

type ProgressDotsProps = {
  total: number;
  current: number;
  results?: Array<CharacterAssessment | undefined>;
};

const RESULT_LABELS: Record<CharacterAssessment, string> = {
  known: "正确",
  review: "巩固",
  unknown: "错误",
};

export function ProgressDots({ total, current, results = [] }: ProgressDotsProps) {
  const dots = Array.from({ length: total }, (_, index) => index);
  const resultCounts = results.reduce(
    (counts, result) => {
      if (result) {
        counts[result] += 1;
      }

      return counts;
    },
    { known: 0, review: 0, unknown: 0 },
  );
  const label = `进度 ${Math.min(current + 1, total)} / ${total}，正确 ${resultCounts.known}，巩固 ${resultCounts.review}，错误 ${resultCounts.unknown}`;

  return (
    <div className="progress-dots" aria-label={label}>
      {dots.map((dot) => {
        const result = results[dot];
        const resultLabel = result ? RESULT_LABELS[result] : "未判断";

        return (
          <span
            aria-label={`第 ${dot + 1} 个字：${resultLabel}`}
            className="progress-dot"
            data-active={dot === current ? "true" : "false"}
            data-done={dot < current ? "true" : "false"}
            data-result={result ?? "none"}
            key={dot}
            title={resultLabel}
          />
        );
      })}
    </div>
  );
}
