import { Check, ChevronLeft, ChevronRight, RotateCcw, Volume2, X } from "lucide-react";
import type { ReactNode } from "react";
import type { CharacterItem } from "../../types/character";
import { Button } from "../../ui/Button";
import { IconButton } from "../../ui/IconButton";
import { CharacterCard } from "../../ui/CharacterCard";
import { getFlashcardPrompt } from "./flashcardLogic";
import type { CharacterAssessment } from "../../types/session";

type FlashcardModeProps = {
  item?: CharacterItem;
  showPinyin: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  extraCardAction?: ReactNode;
  selectedResult?: CharacterAssessment;
  onKnown: () => void;
  onUnknown: () => void;
  onReview: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSpeak: () => void;
};

export function FlashcardMode({
  item,
  showPinyin,
  canGoPrevious,
  canGoNext,
  extraCardAction,
  selectedResult,
  onKnown,
  onUnknown,
  onReview,
  onPrevious,
  onNext,
  onSpeak,
}: FlashcardModeProps) {
  return (
    <>
      <CharacterCard
        char={getFlashcardPrompt(item)}
        label="认"
        pinyin={showPinyin ? item?.pinyin : undefined}
        action={
          <>
            <IconButton
              icon={Volume2}
              label="读音"
              title="读音"
              variant="quiet"
              onClick={onSpeak}
              disabled={!item}
            />
            {extraCardAction}
          </>
        }
      />

      <div className="practice-controls flashcard-controls">
        <div className="answer-actions">
          <Button
            icon={X}
            selected={selectedResult === "unknown"}
            variant="danger"
            size="large"
            onClick={onUnknown}
          >
            错误
          </Button>
          <Button
            icon={RotateCcw}
            selected={selectedResult === "review"}
            variant="secondary"
            size="large"
            onClick={onReview}
          >
            巩固
          </Button>
          <Button
            icon={Check}
            selected={selectedResult === "known"}
            variant="primary"
            size="large"
            onClick={onKnown}
          >
            正确
          </Button>
        </div>

        <div className="step-actions">
          <IconButton
            icon={ChevronLeft}
            label="上一个"
            title="上一个"
            onClick={onPrevious}
            disabled={!canGoPrevious}
          />
          <IconButton
            icon={ChevronRight}
            label="下一个"
            title="下一个"
            onClick={onNext}
            disabled={!canGoNext}
          />
        </div>
      </div>
    </>
  );
}
