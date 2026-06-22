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

const PROGRESS_DOT_SLOT_SIZE = 22;
const PROGRESS_DOT_GAP = 5;
const PROGRESS_DOT_STEP = PROGRESS_DOT_SLOT_SIZE + PROGRESS_DOT_GAP;

export function ProgressDots({ total, current, results = [] }: ProgressDotsProps) {
  const dots = Array.from({ length: total }, (_, index) => index);
  const activeIndex = total === 0 ? 0 : Math.min(Math.max(current, 0), total - 1);
  const trackOffset = activeIndex * PROGRESS_DOT_STEP;
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
      <div
        className="progress-dots-track"
        style={{
          transform: `translateX(calc(-${PROGRESS_DOT_SLOT_SIZE / 2}px - ${trackOffset}px))`,
        }}
      >
        {dots.map((dot) => {
          const result = results[dot];
          const resultLabel = result ? RESULT_LABELS[result] : "未判断";

          return (
            <span className="progress-dot-slot" key={dot}>
              <span
                aria-label={`第 ${dot + 1} 个字：${resultLabel}`}
                className="progress-dot"
                data-active={dot === activeIndex ? "true" : "false"}
                data-done={dot < current ? "true" : "false"}
                data-result={result ?? "none"}
                title={resultLabel}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
