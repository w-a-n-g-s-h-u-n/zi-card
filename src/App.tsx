import { useEffect, useMemo, useState } from "react";
import { createCharacterItems, getCharacterPreview } from "./core/characters";
import { getReviewItems } from "./core/review";
import { getSessionStats } from "./core/scoring";
import {
  createPracticeSession,
  createReviewSession,
  goToNext,
  goToPrevious,
  getCurrentResult,
  isSessionComplete,
  recordAttempt,
} from "./core/session";
import { PracticePage } from "./pages/PracticePage";
import { ResultPage } from "./pages/ResultPage";
import { SetupPage } from "./pages/SetupPage";
import {
  DEFAULT_SETTINGS,
  deleteRecentList,
  getRecentListKey,
  readStoredData,
  saveRecentList,
  saveSettings,
} from "./storage/localStorage";
import type { StoredSettings } from "./storage/storageTypes";
import type { PracticeSession } from "./types/session";
import { playTone } from "./speech/soundEffects";
import { speakCharacter } from "./speech/speechSynthesis";
import { joinCharacters } from "./utils/text";

type PageState = "setup" | "practice" | "result";

export default function App() {
  const [page, setPage] = useState<PageState>("setup");
  const [inputText, setInputText] = useState("");
  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [recentLists, setRecentLists] = useState<string[][]>([]);
  const [editingRecentKey, setEditingRecentKey] = useState<string | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);

  useEffect(() => {
    const stored = readStoredData();
    setSettings(stored.settings);
    setRecentLists(stored.recentLists);
  }, []);

  const sourceChars = useMemo(() => {
    if (session) {
      return session.items.map((item) => item.char);
    }
    return getCharacterPreview(inputText);
  }, [inputText, session]);

  const stats = useMemo(() => (session ? getSessionStats(session) : null), [session]);

  function updateSettings(nextSettings: StoredSettings) {
    setSettings(nextSettings);
    saveSettings(nextSettings);
  }

  function startPractice() {
    const items = createCharacterItems(inputText);

    if (items.length === 0) {
      return;
    }

    const chars = items.map((item) => item.char);
    saveRecentList(chars, editingRecentKey ?? undefined);
    setRecentLists(readStoredData().recentLists);
    setEditingRecentKey(null);
    setSession(
      createPracticeSession({
        sourceText: joinCharacters(chars),
        items,
        mode: settings.mode,
        randomOrder: settings.randomOrder,
      }),
    );
    setPage("practice");
  }

  function useRecent(chars: string[]) {
    setInputText(joinCharacters(chars));
    setEditingRecentKey(null);
  }

  function editRecent(chars: string[]) {
    setInputText(joinCharacters(chars));
    setEditingRecentKey(getRecentListKey(chars));
  }

  function removeRecent(chars: string[]) {
    const key = getRecentListKey(chars);
    deleteRecentList(key);
    setRecentLists(readStoredData().recentLists);

    if (editingRecentKey === key) {
      setEditingRecentKey(null);
      setInputText("");
    }
  }

  function updateSession(nextSession: PracticeSession) {
    setSession(nextSession);

    if (isSessionComplete(nextSession)) {
      setPage("result");
    }
  }

  function markKnown() {
    if (!session) {
      return;
    }
    if (settings.soundEnabled) {
      playTone("success");
    }
    updateSession(recordAttempt(session, "known", undefined, { advance: !getCurrentResult(session) }));
  }

  function markUnknown() {
    if (!session) {
      return;
    }
    if (settings.soundEnabled) {
      playTone("soft");
    }
    updateSession(recordAttempt(session, "unknown", undefined, { advance: !getCurrentResult(session) }));
  }

  function markReview() {
    if (!session) {
      return;
    }
    if (settings.soundEnabled) {
      playTone("soft");
    }
    updateSession(recordAttempt(session, "review", undefined, { advance: !getCurrentResult(session) }));
  }

  function markCorrect() {
    if (!session) {
      return;
    }
    if (settings.soundEnabled) {
      playTone("success");
    }
    updateSession(recordAttempt(session, "correct"));
  }

  function markWrong(selected: string) {
    if (!session) {
      return;
    }
    if (settings.soundEnabled) {
      playTone("soft");
    }
    setSession(recordAttempt(session, "wrong", selected));
  }

  function restartSetup() {
    setPage("setup");
    setSession(null);
  }

  function finishSession() {
    setPage("result");
  }

  function reviewMistakes() {
    if (!session) {
      return;
    }

    const reviewItems = getReviewItems(session);

    if (reviewItems.length === 0) {
      return;
    }

    setSession(createReviewSession(session, reviewItems, settings.mode, settings.randomOrder));
    setPage("practice");
  }

  async function copySourceChars() {
    const text = joinCharacters(sourceChars);

    if (!text) {
      return;
    }

    await navigator.clipboard?.writeText(text);
  }

  function speakCurrent() {
    const current = session?.queue[session.currentIndex];
    speakCharacter(current?.char ?? "");
  }

  return (
    <div className="app-shell">
      {page === "setup" ? (
        <SetupPage
          inputText={inputText}
          recentLists={recentLists}
          settings={settings}
          onInputChange={setInputText}
          editingRecentKey={editingRecentKey}
          onDeleteRecent={removeRecent}
          onEditRecent={editRecent}
          onSettingsChange={updateSettings}
          onStart={startPractice}
          onUseRecent={useRecent}
        />
      ) : null}

      {page === "practice" && session ? (
        <PracticePage
          session={session}
          settings={settings}
          onCorrect={markCorrect}
          onExit={restartSetup}
          onFinish={finishSession}
          onKnown={markKnown}
          onNext={() => setSession(goToNext(session))}
          onPrevious={() => setSession(goToPrevious(session))}
          onReview={markReview}
          onSpeak={speakCurrent}
          onUnknown={markUnknown}
          onWrong={markWrong}
        />
      ) : null}

      {page === "result" && session && stats ? (
        <ResultPage
          canReview={stats.reviewCount > 0}
          sourceChars={sourceChars}
          stats={stats}
          onCopy={copySourceChars}
          onRestart={restartSetup}
          onReview={reviewMistakes}
        />
      ) : null}
    </div>
  );
}
