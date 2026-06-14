import { useEffect, useMemo, useState } from "react";
import copyTextToClipboard from "copy-text-to-clipboard";
import {
  createCharacterItemsFromDrafts,
  createCharacterPreviewItems,
  getCharacterPreview,
  getSelectedPinyinMap,
} from "./core/characters";
import { getReviewItems } from "./core/review";
import { getSessionStats } from "./core/scoring";
import { createSharedCharactersUrl, getSharedCharacterDraftsFromUrl } from "./core/share";
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
import type { CharacterDraft } from "./types/character";
import type { PracticeSession } from "./types/session";
import { playTone } from "./speech/soundEffects";
import { prepareSpeechSynthesis, speakCharacter } from "./speech/speechSynthesis";
import { joinCharacters } from "./utils/text";

type PageState = "setup" | "practice" | "result";

export default function App() {
  const [page, setPage] = useState<PageState>("setup");
  const [inputText, setInputText] = useState("");
  const [selectedPinyins, setSelectedPinyins] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [recentLists, setRecentLists] = useState<CharacterDraft[][]>([]);
  const [editingRecentKey, setEditingRecentKey] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);

  useEffect(() => {
    const stored = readStoredData();
    const sharedDrafts = getSharedCharacterDraftsFromUrl(window.location.href);

    if (sharedDrafts.length > 0) {
      setInputText(joinCharacters(sharedDrafts.map((draft) => draft.char)));
      setSelectedPinyins(getSelectedPinyinMap(sharedDrafts));
      setShareStatus("已载入分享字表");
    }

    setSettings(stored.settings);
    setRecentLists(stored.recentLists);
    prepareSpeechSynthesis();
  }, []);

  useEffect(() => {
    if (!shareStatus) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShareStatus(null);
    }, 2600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [shareStatus]);

  const previewItems = useMemo(
    () => createCharacterPreviewItems(inputText, selectedPinyins),
    [inputText, selectedPinyins],
  );

  const previewDrafts = useMemo(
    () =>
      previewItems.map<CharacterDraft>((item) => ({
        char: item.char,
        pinyin: item.selectedPinyin,
      })),
    [previewItems],
  );

  const sourceChars = useMemo(() => {
    if (session) {
      return session.items.map((item) => item.char);
    }
    return previewDrafts.map((draft) => draft.char);
  }, [previewDrafts, session]);

  const stats = useMemo(() => (session ? getSessionStats(session) : null), [session]);

  function updateSettings(nextSettings: StoredSettings) {
    setSettings(nextSettings);
    saveSettings(nextSettings);
  }

  function updateInputText(value: string) {
    const nextChars = new Set(getCharacterPreview(value));
    setInputText(value);
    setSelectedPinyins((current) =>
      Object.fromEntries(Object.entries(current).filter(([char]) => nextChars.has(char))),
    );
  }

  function updateSelectedPinyin(char: string, pinyin: string) {
    setSelectedPinyins((current) => ({
      ...current,
      [char]: pinyin,
    }));
  }

  function startPractice() {
    const items = createCharacterItemsFromDrafts(previewDrafts);

    if (items.length === 0) {
      return;
    }

    prepareSpeechSynthesis();
    const chars = items.map((item) => item.char);
    saveRecentList(previewDrafts, editingRecentKey ?? undefined);
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

  function useRecent(drafts: CharacterDraft[]) {
    setInputText(joinCharacters(drafts.map((draft) => draft.char)));
    setSelectedPinyins(getSelectedPinyinMap(drafts));
    setEditingRecentKey(null);
  }

  function editRecent(drafts: CharacterDraft[]) {
    setInputText(joinCharacters(drafts.map((draft) => draft.char)));
    setSelectedPinyins(getSelectedPinyinMap(drafts));
    setEditingRecentKey(getRecentListKey(drafts));
  }

  function removeRecent(drafts: CharacterDraft[]) {
    const key = getRecentListKey(drafts);
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

  function copyWithCopyEvent(text: string): boolean {
    let copied = false;

    const handleCopy = (event: ClipboardEvent) => {
      event.clipboardData?.setData("text/plain", text);
      event.preventDefault();
      copied = true;
    };

    document.addEventListener("copy", handleCopy, { once: true });

    try {
      const commandCopied = document.execCommand("copy");
      return copied || commandCopied;
    } catch {
      return false;
    } finally {
      document.removeEventListener("copy", handleCopy);
    }
  }

  function copyText(text: string): boolean {
    if (copyWithCopyEvent(text)) {
      return true;
    }

    try {
      return copyTextToClipboard(text);
    } catch {
      return false;
    }
  }

  function getBrowserUserAgent() {
    return window.navigator.userAgent.toLowerCase();
  }

  function isWechatBrowser() {
    return getBrowserUserAgent().includes("micromessenger");
  }

  function setShareUrl(url: string) {
    window.history.replaceState(null, "", url);
  }

  async function shareCharacters(drafts: CharacterDraft[]) {
    if (drafts.length === 0) {
      return;
    }

    const text = joinCharacters(drafts.map((draft) => draft.char));
    const url = createSharedCharactersUrl(drafts, window.location.href);
    const shareData = {
      title: "识字小练习",
      text: `本次字表：${text}`,
      url,
    };

    setShareUrl(url);

    if (isWechatBrowser()) {
      const copied = copyText(url);
      setShareStatus(copied ? "链接已复制，请点右上角分享" : "请点右上角分享");
      return;
    }

    if (navigator.share) {
      let copied = false;

      try {
        const sharePromise = navigator.share(shareData);
        copied = copyText(url);
        await sharePromise;
        setShareStatus("已打开分享");
        return;
      } catch {
        copied ||= copyText(url);
        setShareStatus(copied ? "分享未成功，链接已复制" : "分享未成功，请从地址栏复制");
        return;
      }
    }

    const copied = copyText(url);
    setShareStatus(copied ? "链接已复制" : "请从地址栏复制");
  }

  function shareCurrentCharacters() {
    void shareCharacters(previewDrafts);
  }

  function shareRecent(drafts: CharacterDraft[]) {
    void shareCharacters(drafts);
  }

  function speakCurrent() {
    const current = session?.queue[session.currentIndex];
    speakCharacter(current?.char ?? "", { pinyin: current?.pinyin });
  }

  return (
    <div className="app-shell">
      {page === "setup" ? (
        <SetupPage
          inputText={inputText}
          recentLists={recentLists}
          settings={settings}
          previewItems={previewItems}
          shareStatus={shareStatus}
          onInputChange={updateInputText}
          editingRecentKey={editingRecentKey}
          onDeleteRecent={removeRecent}
          onEditRecent={editRecent}
          onPinyinChange={updateSelectedPinyin}
          onSettingsChange={updateSettings}
          onShare={shareCurrentCharacters}
          onShareRecent={shareRecent}
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
