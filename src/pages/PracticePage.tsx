import { Home, Save, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { createCharacterPreviewItems, getSelectedPinyinMap } from "../core/characters";
import { getCurrentItem, getCurrentResult } from "../core/session";
import { FlashcardMode } from "../modes/flashcard/FlashcardMode";
import { FindCharacterMode } from "../modes/find-character/FindCharacterMode";
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
  onCorrect: () => void;
  onWrong: (selected: string) => void;
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
  onCorrect,
  onWrong,
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
  const progressNumber = Math.min(session.currentIndex + 1, session.queue.length);
  const previewItems = useMemo(
    () =>
      createCharacterPreviewItems(
        joinCharacters(session.sourceDrafts.map((draft) => draft.char)),
        getSelectedPinyinMap(session.sourceDrafts),
      ),
    [session.sourceDrafts],
  );
  const settingsAction = (
    <IconButton
      icon={Settings2}
      label="设置"
      title="设置"
      variant="quiet"
      onClick={() => setIsSettingsOpen(true)}
    />
  );

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
        <IconButton icon={Save} label="保存" title="保存" variant="quiet" onClick={onFinish} />
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
            extraCardAction={settingsAction}
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
        ) : (
          <FindCharacterMode
            allItems={session.items}
            item={item}
            extraCardAction={settingsAction}
            showPinyin={settings.showPinyin}
            showSpeakButton={settings.soundEnabled}
            onCorrect={onCorrect}
            onSpeak={onSpeak}
            onUnknown={onUnknown}
            onWrong={onWrong}
          />
        )}
      </PracticeLayout>

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
