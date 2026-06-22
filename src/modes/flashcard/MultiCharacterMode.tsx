import type { CharacterItem } from "../../types/character";
import type { CharacterAssessment } from "../../types/session";
import { CharacterChip, type CharacterChipTone } from "../../ui/CharacterChip";

type MultiCharacterModeProps = {
  items: CharacterItem[];
  results: Record<string, CharacterAssessment>;
  showPinyin: boolean;
  onCycleAssessment: (char: string) => void;
};

const ASSESSMENT_LABELS: Record<CharacterAssessment, string> = {
  unknown: "错误",
  review: "巩固",
  known: "正确",
};

export function MultiCharacterMode({
  items,
  results,
  showPinyin,
  onCycleAssessment,
}: MultiCharacterModeProps) {
  const counts = getAssessmentCounts(items, results);
  const answeredCount = counts.unknown + counts.review + counts.known;

  return (
    <section className="multi-practice" aria-label="多字练习">
      <div className="multi-practice-summary" aria-label={`已判 ${answeredCount}，共 ${items.length}`}>
        <span className="multi-practice-count">已判 {answeredCount}/{items.length}</span>
        <span className="multi-practice-badge" data-result="unknown">错误 {counts.unknown}</span>
        <span className="multi-practice-badge" data-result="review">巩固 {counts.review}</span>
        <span className="multi-practice-badge" data-result="known">正确 {counts.known}</span>
      </div>

      <div className="multi-character-grid">
        {items.map((item) => {
          const result = results[item.char];
          const stateLabel = result ? ASSESSMENT_LABELS[result] : "未判";
          const nextLabel = getNextAssessmentLabel(result);

          return (
            <button
              aria-label={`${item.char}，${stateLabel}，点击标记${nextLabel}`}
              className="multi-character-tile"
              data-result={result ?? "unanswered"}
              key={item.id}
              title={`${item.char}：${stateLabel}`}
              type="button"
              onClick={() => onCycleAssessment(item.char)}
            >
              <CharacterChip
                char={item.char}
                pinyin={item.pinyin}
                showPinyin={showPinyin && Boolean(item.pinyin)}
                tone={getAssessmentTone(result)}
                variant="result"
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function getAssessmentCounts(
  items: CharacterItem[],
  results: Record<string, CharacterAssessment>,
): Record<CharacterAssessment, number> {
  return items.reduce<Record<CharacterAssessment, number>>(
    (counts, item) => {
      const result = results[item.char];

      if (result) {
        counts[result] += 1;
      }

      return counts;
    },
    { unknown: 0, review: 0, known: 0 },
  );
}

function getAssessmentTone(result?: CharacterAssessment): CharacterChipTone {
  if (result === "unknown") {
    return "red";
  }

  if (result === "review") {
    return "yellow";
  }

  if (result === "known") {
    return "green";
  }

  return "neutral";
}

function getNextAssessmentLabel(result?: CharacterAssessment): string {
  if (!result) {
    return "错误";
  }

  if (result === "unknown") {
    return "巩固";
  }

  if (result === "review") {
    return "正确";
  }

  return "未判";
}
