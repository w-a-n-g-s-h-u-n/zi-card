import { Home, Save, Settings } from "lucide-react";
import { useMemo, useState } from "react";
import { createCharacterPreviewItems, getSelectedPinyinMap } from "../core/characters";
import { getSessionStats } from "../core/scoring";
import { getCurrentItem, getCurrentResult } from "../core/session";
import { FlashcardMode } from "../modes/flashcard/FlashcardMode";
import { MultiCharacterMode } from "../modes/flashcard/MultiCharacterMode";
import { getModeConfig } from "../modes";
import type { PracticeSession } from "../types/session";
import { IconButton } from "../ui/IconButton";
import { ProgressDots } from "../ui/ProgressDots";
import { PracticeLayout } from "../layout/PracticeLayout";
import type { StoredSettings } from "../storage/storageTypes";
import { joinCharacters } from "../utils/text";
import { PracticeSettingsPanel } from "./practice/PracticeSettingsPanel";

type PracticePageProps = {
  session: PracticeSession;
  settings: StoredSettings;
  onKnown: () => void;
  onUnknown: () => void;
  onReview: () => void;
  onCycleAssessment: (char: string) => void;
  onSelectPracticeIndex: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSpeak: () => void;
  onPinyinChange: (char: string, pinyin: string) => void;
  onReorderDrafts: (fromIndex: number, toIndex: number) => void;
  onSettingsChange: (settings: StoredSettings) => void;
  onExit: () => void;
  onFinish: () => void;
};

export function PracticePage({
  session,
  settings,
  onKnown,
  onUnknown,
  onReview,
  onCycleAssessment,
  onSelectPracticeIndex,
  onPrevious,
  onNext,
  onSpeak,
  onPinyinChange,
  onReorderDrafts,
  onSettingsChange,
  onExit,
  onFinish,
}: PracticePageProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPinyinEditing, setIsPinyinEditing] = useState(false);
  const item = getCurrentItem(session);
  const mode = getModeConfig(session.mode);
  const isMultiDisplay = settings.practiceDisplayMode === "multi";
  const stats = useMemo(() => getSessionStats(session), [session]);
  const progressNumber = Math.min(session.currentIndex + 1, session.queue.length);
  const previewItems = useMemo(
    () =>
      createCharacterPreviewItems(
        joinCharacters(session.sourceDrafts.map((draft) => draft.char)),
        getSelectedPinyinMap(session.sourceDrafts),
      ),
    [session.sourceDrafts],
  );

  return (
    <section className="practice-page" data-display-mode={settings.practiceDisplayMode}>
      <header className="practice-header">
        <IconButton icon={Home} label="返回" title="返回" variant="quiet" onClick={onExit} />
        <div className="practice-meta">
          <span>{isMultiDisplay ? `${mode.label} · 多字` : mode.label}</span>
          <strong>
            {isMultiDisplay ? `${stats.practiced}/${stats.total}` : `${progressNumber}/${session.queue.length}`}
          </strong>
        </div>
        <div className="practice-header-actions">
          <IconButton
            icon={Settings}
            label="设置"
            title="设置"
            variant="quiet"
            onClick={() => setIsSettingsOpen(true)}
          />
          <IconButton icon={Save} label="保存" title="保存" variant="quiet" onClick={onFinish} />
        </div>
      </header>

      {isMultiDisplay ? (
        <MultiCharacterMode
          items={session.queue}
          results={session.results}
          showPinyin={settings.showPinyin}
          onCycleAssessment={onCycleAssessment}
        />
      ) : (
        <>
          <ProgressDots
            characters={session.queue}
            current={session.currentIndex}
            onSelect={onSelectPracticeIndex}
            results={session.queue.map((queueItem) => session.results[queueItem.char])}
            showCharacters={settings.showCharacterProgress}
            showPinyin={settings.showPinyin}
            total={session.queue.length}
          />
          <PracticeLayout>
            <FlashcardMode
              canGoNext={session.currentIndex < session.queue.length - 1}
              canGoPrevious={session.currentIndex > 0}
              item={item}
              selectedResult={getCurrentResult(session)}
              showPinyin={settings.showPinyin}
              showSpeakButton={settings.soundEnabled}
              onKnown={onKnown}
              onNext={onNext}
              onPrevious={onPrevious}
              onReview={onReview}
              onSpeak={onSpeak}
              onUnknown={onUnknown}
            />
          </PracticeLayout>
        </>
      )}

      <PracticeSettingsPanel
        open={isSettingsOpen}
        previewItems={previewItems}
        settings={settings}
        showPinyinChoices={isPinyinEditing}
        onClose={() => setIsSettingsOpen(false)}
        onPinyinChange={(char, pinyin) => {
          setIsPinyinEditing(true);
          onPinyinChange(char, pinyin);
        }}
        onReorderDrafts={onReorderDrafts}
        onSettingsChange={onSettingsChange}
        onTogglePinyinEdit={() => setIsPinyinEditing((current) => !current)}
      />
    </section>
  );
}
