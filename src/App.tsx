import { useEffect, useMemo, useState } from "react";
import copyToClipboard from "copy-to-clipboard";
import { createCharacterItems, getCharacterPreview } from "./core/characters";
import { getReviewItems } from "./core/review";
import { getSessionStats } from "./core/scoring";
import { createSharedCharactersUrl, getSharedCharactersFromUrl } from "./core/share";
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
import { prepareSpeechSynthesis, speakCharacter } from "./speech/speechSynthesis";
import { joinCharacters } from "./utils/text";

type PageState = "setup" | "practice" | "result";
type SharePanel = {
  url: string;
  help: string;
};

export default function App() {
  const [page, setPage] = useState<PageState>("setup");
  const [inputText, setInputText] = useState("");
  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [recentLists, setRecentLists] = useState<string[][]>([]);
  const [editingRecentKey, setEditingRecentKey] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [sharePanel, setSharePanel] = useState<SharePanel | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);

  useEffect(() => {
    const stored = readStoredData();
    const sharedChars = getSharedCharactersFromUrl(window.location.href);

    if (sharedChars.length > 0) {
      setInputText(joinCharacters(sharedChars));
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

    prepareSpeechSynthesis();
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

  function copySelectedTextField(text: string): boolean {
    const field = document.getElementById("share-link-field");

    if (!field || !("select" in field)) {
      return false;
    }

    const textField = field as HTMLTextAreaElement | HTMLInputElement;

    if (textField.value !== text) {
      return false;
    }

    textField.focus();
    textField.select();
    textField.setSelectionRange(0, text.length);

    try {
      return document.execCommand("copy");
    } catch {
      return false;
    }
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

  async function copyText(text: string): Promise<boolean> {
    if (copySelectedTextField(text) || copyWithCopyEvent(text)) {
      return true;
    }

    try {
      return await copyToClipboard(text, {
        fallbackToPrompt: false,
        format: "text/plain",
      });
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

  function getShareHelp(copied: boolean) {
    if (isWechatBrowser()) {
      return copied ? "链接已复制，也可用右上角分享" : "点右上角分享，或长按下方链接";
    }

    return copied ? "链接已复制，也可长按下方链接" : "长按下方链接复制";
  }

  function openSharePanel(url: string, copied: boolean) {
    setSharePanel({
      url,
      help: getShareHelp(copied),
    });
    window.history.replaceState(null, "", url);
  }

  function canUseNativeShare(shareData: ShareData) {
    if (!navigator.share || isWechatBrowser()) {
      return false;
    }

    if (!navigator.canShare) {
      return true;
    }

    try {
      return navigator.canShare(shareData);
    } catch {
      return false;
    }
  }

  async function shareCharacters(chars: string[]) {
    if (chars.length === 0) {
      return;
    }

    const text = joinCharacters(chars);
    const url = createSharedCharactersUrl(chars, window.location.href);
    const shareData = {
      title: "识字小练习",
      text: `本次字表：${text}`,
      url,
    };
    const shouldUseNativeShare = canUseNativeShare(shareData);

    if (shouldUseNativeShare) {
      try {
        await navigator.share(shareData);
        setShareStatus("已打开分享");
        setSharePanel(null);
        return;
      } catch {
        // After a failed native share, many browsers have consumed the tap gesture, so copy on next tap.
        openSharePanel(url, false);
        setShareStatus("分享未成功，请点复制或长按链接");
        return;
      }
    }

    const copied = await copyText(url);
    openSharePanel(url, copied);
    setShareStatus(copied ? getShareHelp(true) : "请长按链接复制");
  }

  function shareCurrentCharacters() {
    void shareCharacters(getCharacterPreview(inputText));
  }

  function shareRecent(chars: string[]) {
    void shareCharacters(chars);
  }

  async function copySharePanelLink() {
    if (!sharePanel) {
      return;
    }

    const copied = await copyText(sharePanel.url);
    setSharePanel({
      ...sharePanel,
      help: getShareHelp(copied),
    });
    setShareStatus(copied ? "链接已复制" : "请长按链接复制");
  }

  function closeSharePanel() {
    setSharePanel(null);
    setShareStatus(null);
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
          shareHelp={sharePanel?.help ?? null}
          shareStatus={shareStatus}
          shareUrl={sharePanel?.url ?? null}
          onInputChange={setInputText}
          editingRecentKey={editingRecentKey}
          onCloseSharePanel={closeSharePanel}
          onCopyShareLink={copySharePanelLink}
          onDeleteRecent={removeRecent}
          onEditRecent={editRecent}
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
