import { useEffect, useMemo, useState } from "react";
import {
  createCharacterItemsFromDrafts,
  createCharacterPreviewItems,
  getCharacterPreview,
  getSelectedPinyinMap,
} from "./core/characters";
import { getReviewItems } from "./core/review";
import { getSessionStats } from "./core/scoring";
import { createSharedCharactersData, getSharedCharacterDraftsFromUrl } from "./core/share";
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
import { copyText } from "./utils/clipboard";
import { useRemoteFocusNavigation } from "./utils/remoteFocus";
import { extractUniqueCharacters, joinCharacters } from "./utils/text";
import { recognizeCharacterImages, warmupCharacterOcr } from "./ocr/imageOcr";
import type { OcrPreviewImage, OcrUiState } from "./types/ocr";

type PageState = "setup" | "practice" | "result";

const OCR_IDLE_STATE: OcrUiState = {
  candidateText: "",
  message: "",
  progress: 0,
  results: [],
  status: "idle",
  totalFiles: 0,
};

export default function App() {
  useRemoteFocusNavigation();

  const [page, setPage] = useState<PageState>("setup");
  const [inputText, setInputText] = useState("");
  const [selectedPinyins, setSelectedPinyins] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<StoredSettings>(DEFAULT_SETTINGS);
  const [recentLists, setRecentLists] = useState<CharacterDraft[][]>([]);
  const [editingRecentKey, setEditingRecentKey] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [resultStatus, setResultStatus] = useState<string | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [ocrState, setOcrState] = useState<OcrUiState>(OCR_IDLE_STATE);
  const [ocrPreviewImages, setOcrPreviewImages] = useState<OcrPreviewImage[]>([]);
  const [lastOcrFiles, setLastOcrFiles] = useState<File[]>([]);

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
    const cancelOcrWarmup = scheduleOcrWarmup();

    return () => {
      cancelOcrWarmup();
    };
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

  useEffect(() => {
    if (!resultStatus) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setResultStatus(null);
    }, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [resultStatus]);

  useEffect(
    () => () => {
      revokeOcrPreviewImages(ocrPreviewImages);
    },
    [ocrPreviewImages],
  );

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

  async function recognizeImages(files: File[]) {
    if (files.length === 0 || isOcrWorkingStatus(ocrState.status)) {
      return;
    }

    setShareStatus(null);
    setLastOcrFiles(files);
    setOcrPreviewImages(createOcrPreviewImages(files));
    setOcrState({
      candidateText: "",
      message: "准备识别图片",
      progress: 0,
      results: [],
      status: "loading",
      totalFiles: files.length,
    });

    try {
      const result = await recognizeCharacterImages(files, (progress) => {
        const currentFileNumber = Math.min(progress.completedFiles + 1, progress.totalFiles);
        const fileText = progress.fileName ? `：${progress.fileName}` : "";

        setOcrState({
          candidateText: "",
          message: `${progress.status} ${currentFileNumber}/${progress.totalFiles}${fileText}`,
          progress: progress.overallProgress,
          results: [],
          status: progress.phase === "loading" ? "loading" : "recognizing",
          totalFiles: progress.totalFiles,
        });
      });

      setOcrState({
        candidateText: joinCharacters(result.chars),
        message:
          result.chars.length > 0
            ? `识别到 ${result.chars.length} 个字，请确认`
            : "未识别到汉字，可重新识别或手动输入",
        progress: 1,
        results: result.files.map((file) => ({
          charCount: file.chars.length,
          error: file.error,
          fileName: file.fileName,
        })),
        status: "pending",
        totalFiles: result.files.length,
      });
    } catch (error) {
      setOcrState({
        candidateText: "",
        message: error instanceof Error ? error.message : "图片识别失败",
        progress: 0,
        results: [],
        status: "error",
        totalFiles: files.length,
      });
    }
  }

  function prepareOcrModel() {
    if (shouldSkipOcrWarmup()) {
      return;
    }

    void warmupCharacterOcr().catch(() => undefined);
  }

  function updateOcrCandidateText(value: string) {
    const candidateCount = extractUniqueCharacters(value).length;

    setOcrState((current) => ({
      ...current,
      candidateText: value,
      message: candidateCount > 0 ? `候选字表 ${candidateCount} 个字` : "候选字表为空",
      status: "pending",
    }));
  }

  function confirmOcrCandidates() {
    const candidateChars = extractUniqueCharacters(ocrState.candidateText);

    if (candidateChars.length === 0) {
      setOcrState((current) => ({
        ...current,
        message: "候选字表为空",
        status: "pending",
      }));
      return;
    }

    const currentChars = getCharacterPreview(inputText);
    const mergedChars = mergeCharacterLists(currentChars, candidateChars);
    const addedCount = mergedChars.length - currentChars.length;

    updateInputText(joinCharacters(mergedChars));
    setOcrPreviewImages([]);
    setOcrState({
      ...OCR_IDLE_STATE,
      message: addedCount > 0 ? `已加入 ${addedCount} 个字` : "候选字都已在当前字表中",
      progress: 1,
    });
  }

  function retryOcr() {
    if (lastOcrFiles.length === 0 || isOcrWorkingStatus(ocrState.status)) {
      return;
    }

    void recognizeImages(lastOcrFiles);
  }

  function clearOcrCandidates() {
    setOcrPreviewImages([]);
    setLastOcrFiles([]);
    setOcrState(OCR_IDLE_STATE);
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
    setResultStatus(null);
  }

  function finishSession() {
    setPage("result");
  }

  function continuePractice() {
    setPage("practice");
    setResultStatus(null);
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
    setResultStatus(null);
    setPage("practice");
  }

  async function copyReviewChars() {
    if (!stats || stats.reviewChars.length === 0) {
      return;
    }

    setResultStatus((await copyText(joinCharacters(stats.reviewChars))) ? "待练字已复制" : "复制失败，请手动选择");
  }

  function isWechatBrowser() {
    return window.navigator.userAgent.toLowerCase().includes("micromessenger");
  }

  function updateShareUrl(url: string) {
    window.history.replaceState(null, "", url);
  }

  async function copyShareLink(url: string, successText: string, failureText: string) {
    setShareStatus((await copyText(url)) ? successText : failureText);
  }

  async function shareCharacters(drafts: CharacterDraft[]) {
    if (drafts.length === 0) {
      return;
    }

    const shareData = createSharedCharactersData(drafts, window.location.href);
    updateShareUrl(shareData.url);

    if (isWechatBrowser()) {
      await copyShareLink(shareData.url, "链接已复制，请点右上角分享", "请点右上角分享");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareStatus("已打开分享");
        return;
      } catch {
        await copyShareLink(shareData.url, "分享未成功，链接已复制", "分享未成功，请从地址栏复制");
        return;
      }
    }

    await copyShareLink(shareData.url, "链接已复制", "请从地址栏复制");
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
    <div className="app-shell" data-character-font={settings.characterFont}>
      {page === "setup" ? (
        <SetupPage
          inputText={inputText}
          recentLists={recentLists}
          settings={settings}
          previewItems={previewItems}
          ocrPreviewImages={ocrPreviewImages}
          ocrState={ocrState}
          shareStatus={shareStatus}
          onImageFilesSelected={recognizeImages}
          onInputChange={updateInputText}
          editingRecentKey={editingRecentKey}
          onDeleteRecent={removeRecent}
          onEditRecent={editRecent}
          onClearOcr={clearOcrCandidates}
          onConfirmOcr={confirmOcrCandidates}
          onPinyinChange={updateSelectedPinyin}
          onOcrCandidateChange={updateOcrCandidateText}
          onPrepareOcr={prepareOcrModel}
          onRetryOcr={retryOcr}
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
          actionStatus={resultStatus}
          canContinue={!isSessionComplete(session)}
          canReview={stats.reviewCount > 0}
          stats={stats}
          onContinue={continuePractice}
          onCopyReview={copyReviewChars}
          onRestart={restartSetup}
          onReview={reviewMistakes}
        />
      ) : null}
    </div>
  );
}

function mergeCharacterLists(currentChars: string[], nextChars: string[]): string[] {
  const result = [...currentChars];
  const seen = new Set(result);

  for (const char of nextChars) {
    if (seen.has(char)) {
      continue;
    }

    seen.add(char);
    result.push(char);
  }

  return result;
}

function isOcrWorkingStatus(status: OcrUiState["status"]): boolean {
  return status === "loading" || status === "recognizing";
}

function createOcrPreviewImages(files: File[]): OcrPreviewImage[] {
  return files.map((file, index) => ({
    id: `${file.name}-${file.lastModified}-${file.size}-${index}`,
    name: file.name,
    url: URL.createObjectURL(file),
  }));
}

function revokeOcrPreviewImages(images: OcrPreviewImage[]) {
  for (const image of images) {
    URL.revokeObjectURL(image.url);
  }
}

function scheduleOcrWarmup(): () => void {
  if (shouldSkipOcrWarmup()) {
    return () => undefined;
  }

  const timer = window.setTimeout(() => {
    void warmupCharacterOcr().catch(() => undefined);
  }, 1600);

  return () => {
    window.clearTimeout(timer);
  };
}

function shouldSkipOcrWarmup(): boolean {
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } })
    .connection;

  return Boolean(connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g");
}
