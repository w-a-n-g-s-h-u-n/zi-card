import { Home, ListChecks } from "lucide-react";
import { getCurrentItem, getCurrentResult } from "../core/session";
import { FlashcardMode } from "../modes/flashcard/FlashcardMode";
import { FindCharacterMode } from "../modes/find-character/FindCharacterMode";
import { getModeConfig } from "../modes";
import type { PracticeSession } from "../types/session";
import { IconButton } from "../ui/IconButton";
import { ProgressDots } from "../ui/ProgressDots";
import { PracticeLayout } from "../layout/PracticeLayout";
import type { StoredSettings } from "../storage/storageTypes";

type PracticePageProps = {
  session: PracticeSession;
  settings: StoredSettings;
  onKnown: () => void;
  onUnknown: () => void;
  onReview: () => void;
  onCorrect: () => void;
  onWrong: (selected: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSpeak: () => void;
  onExit: () => void;
  onFinish: () => void;
};

export function PracticePage({
  session,
  settings,
  onKnown,
  onUnknown,
  onReview,
  onCorrect,
  onWrong,
  onPrevious,
  onNext,
  onSpeak,
  onExit,
  onFinish,
}: PracticePageProps) {
  const item = getCurrentItem(session);
  const mode = getModeConfig(session.mode);
  const progressNumber = Math.min(session.currentIndex + 1, session.queue.length);

  return (
    <section className="practice-page">
      <header className="practice-header">
        <IconButton icon={Home} label="返回" title="返回" variant="quiet" onClick={onExit} />
        <div className="practice-meta">
          <span>{mode.label}</span>
          <strong>
            {progressNumber}/{session.queue.length}
          </strong>
        </div>
        <IconButton icon={ListChecks} label="完成" title="完成" variant="quiet" onClick={onFinish} />
      </header>

      <ProgressDots
        current={session.currentIndex}
        results={session.queue.map((queueItem) => session.results[queueItem.char])}
        total={session.queue.length}
      />

      <PracticeLayout>
        {session.mode === "flashcard" ? (
          <FlashcardMode
            canGoNext={session.currentIndex < session.queue.length - 1}
            canGoPrevious={session.currentIndex > 0}
            item={item}
            selectedResult={getCurrentResult(session)}
            showPinyin={settings.showPinyin}
            onKnown={onKnown}
            onNext={onNext}
            onPrevious={onPrevious}
            onReview={onReview}
            onSpeak={onSpeak}
            onUnknown={onUnknown}
          />
        ) : (
          <FindCharacterMode
            allItems={session.items}
            item={item}
            showPinyin={settings.showPinyin}
            onCorrect={onCorrect}
            onSpeak={onSpeak}
            onUnknown={onUnknown}
            onWrong={onWrong}
          />
        )}
      </PracticeLayout>
    </section>
  );
}
