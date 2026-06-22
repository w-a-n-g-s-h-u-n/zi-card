import { useRef } from "react";
import type { CharacterAssessment } from "../types/session";
import { CharacterChip, type CharacterChipTone } from "./CharacterChip";

type ProgressCharacter = {
  char: string;
  pinyin?: string;
};

type ProgressDotsProps = {
  total: number;
  current: number;
  results?: Array<CharacterAssessment | undefined>;
  characters?: ProgressCharacter[];
  showCharacters?: boolean;
  showPinyin?: boolean;
  onSelect?: (index: number) => void;
};

const RESULT_LABELS: Record<CharacterAssessment, string> = {
  known: "正确",
  review: "巩固",
  unknown: "错误",
};

const PROGRESS_DOT_SLOT_SIZE = 22;
const PROGRESS_DOT_GAP = 5;
const PROGRESS_DOT_STEP = PROGRESS_DOT_SLOT_SIZE + PROGRESS_DOT_GAP;
const PROGRESS_CHARACTER_SLOT_SIZE = 56;
const PROGRESS_CHARACTER_GAP = 8;
const PROGRESS_CHARACTER_STEP = PROGRESS_CHARACTER_SLOT_SIZE + PROGRESS_CHARACTER_GAP;

export function ProgressDots({
  total,
  current,
  results = [],
  characters = [],
  showCharacters = false,
  showPinyin = false,
  onSelect,
}: ProgressDotsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerDownRef = useRef(false);
  const pointerDraggedRef = useRef(false);
  const pointerStartXRef = useRef(0);
  const dots = Array.from({ length: total }, (_, index) => index);
  const activeIndex = total === 0 ? 0 : Math.min(Math.max(current, 0), total - 1);
  const slotSize = showCharacters ? PROGRESS_CHARACTER_SLOT_SIZE : PROGRESS_DOT_SLOT_SIZE;
  const trackStep = showCharacters ? PROGRESS_CHARACTER_STEP : PROGRESS_DOT_STEP;
  const trackOffset = activeIndex * trackStep;
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
  const canSelectCharacters = showCharacters && Boolean(onSelect);

  function selectNearestIndex(clientX: number) {
    if (!rootRef.current || !onSelect) {
      return;
    }

    const rect = rootRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const offsetSteps = Math.round((clientX - centerX) / trackStep);
    const nextIndex = Math.min(Math.max(activeIndex + offsetSteps, 0), Math.max(total - 1, 0));

    onSelect(nextIndex);
  }

  return (
    <div
      aria-label={label}
      className="progress-dots"
      data-draggable={canSelectCharacters ? "true" : "false"}
      data-preview={showCharacters ? "characters" : "dots"}
      ref={rootRef}
      onPointerDown={(event) => {
        if (!canSelectCharacters) {
          return;
        }

        pointerDownRef.current = true;
        pointerDraggedRef.current = false;
        pointerStartXRef.current = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
        selectNearestIndex(event.clientX);
      }}
      onPointerMove={(event) => {
        if (!canSelectCharacters || !pointerDownRef.current) {
          return;
        }

        if (Math.abs(event.clientX - pointerStartXRef.current) > 4) {
          pointerDraggedRef.current = true;
        }

        selectNearestIndex(event.clientX);
      }}
      onPointerUp={(event) => {
        if (!canSelectCharacters) {
          return;
        }

        pointerDownRef.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        pointerDownRef.current = false;
        pointerDraggedRef.current = false;
      }}
    >
      <div
        className="progress-dots-track"
        data-preview={showCharacters ? "characters" : "dots"}
        style={{
          transform: `translateX(calc(-${slotSize / 2}px - ${trackOffset}px))`,
        }}
      >
        {dots.map((dot) => {
          const result = results[dot];
          const resultLabel = result ? RESULT_LABELS[result] : "未判断";
          const character = characters[dot]?.char;

          return (
            <span className="progress-dot-slot" data-preview={showCharacters ? "characters" : "dots"} key={dot}>
              {showCharacters ? (
                <button
                  aria-label={`第 ${dot + 1} 个字${character ? `，${character}` : ""}：${resultLabel}`}
                  className="progress-character-chip"
                  data-active={dot === activeIndex ? "true" : "false"}
                  data-result={result ?? "none"}
                  title={character ? `${character}：${resultLabel}` : resultLabel}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (pointerDraggedRef.current) {
                      event.preventDefault();
                      pointerDraggedRef.current = false;
                      return;
                    }

                    onSelect?.(dot);
                  }}
                >
                  <CharacterChip
                    char={character ?? ""}
                    pinyin={characters[dot]?.pinyin}
                    showPinyin={showPinyin && Boolean(characters[dot]?.pinyin)}
                    tone={getResultTone(result)}
                    variant="result"
                  />
                </button>
              ) : (
                <span
                  aria-label={`第 ${dot + 1} 个字：${resultLabel}`}
                  className="progress-dot"
                  data-active={dot === activeIndex ? "true" : "false"}
                  data-done={dot < current ? "true" : "false"}
                  data-preview="dots"
                  data-result={result ?? "none"}
                  title={resultLabel}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function getResultTone(result?: CharacterAssessment): CharacterChipTone {
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
