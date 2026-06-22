import { useEffect, useMemo, useState } from "react";
import {
  createCharacterItemsFromDrafts,
  createCharacterPreviewItems,
  getCharacterPreview,
  getSelectedPinyinMap,
} from "./core/characters";
import {
  moveItem,
  preservePinyinsForOrder,
} from "./core/draftList";
import {
  createPracticeResultRecord,
  getCharacterListIdentity,
} from "./core/resultHistory";
import { getReviewItems } from "./core/review";
import { getSessionStats } from "./core/scoring";
import {
  createSharedCharactersData,
  createSharedResultData,
  getSharedCharacterDraftsFromUrl,
  getSharedResultRecordFromUrl,
} from "./core/share";
import {
  createPracticeSession,
  createPracticeSessionFromResultRecord,
  createReviewSession,
  cycleCharacterAssessment,
  getNextCharacterAssessment,
  goToIndex,
  goToNext,
  goToPrevious,
  getCurrentResult,
  isSessionComplete,
  prepareSessionForAnswerEditing,
  recordAttempt,
  updateSessionDrafts,
  updateSessionPracticeDrafts,
} from "./core/session";
import { PracticePage } from "./pages/PracticePage";
import { ImportComparePage } from "./pages/ImportComparePage";
import { ImportPinyinComparePage } from "./pages/ImportPinyinComparePage";
import { ResultDetailPage } from "./pages/ResultDetailPage";
import { ResultHistoryPage } from "./pages/ResultHistoryPage";
import { ResultPage } from "./pages/ResultPage";
import { SetupPage } from "./pages/SetupPage";
import {
  clearStoredData,
  DEFAULT_SETTINGS,
  deleteResultHistoryRecord,
  deleteRecentList,
  getCharacterImportConflict,
  getRecentListKey,
  getResultImportConflict,
  importCharacterDrafts,
  importResultHistory,
  readStoredData,
  saveRecentList,
  saveSettings,
  upsertResultHistory,
} from "./storage/localStorage";
import type { ImportListConflict, ImportPinyinConflict } from "./storage/localStorage";
import type { StoredSettings } from "./storage/storageTypes";
import type { CharacterDraft } from "./types/character";
import type { PracticeResultRecord } from "./types/result";
import type { PracticeSession } from "./types/session";
import { playTone } from "./speech/soundEffects";
import { prepareSpeechSynthesis, speakCharacter } from "./speech/speechSynthesis";
import { copyText } from "./utils/clipboard";
import { notifyAppError } from "./utils/errorNotifications";
import { loadHandwritingFont } from "./utils/handwritingFont";
import { useRemoteFocusNavigation } from "./utils/remoteFocus";
import { extractUniqueCharacters, joinCharacters } from "./utils/text";
import { recognizeCharacterImages, warmupCharacterOcr } from "./ocr/imageOcr";
import type { OcrPreviewImage, OcrUiState } from "./types/ocr";

type PageState = "setup" | "practice" | "result" | "resultHistory" | "resultDetail" | "importCompare" | "pinyinCompare";
type AnswerEditingReturnPage = "result" | "resultDetail";
type PendingImport =
  | {
      kind: "characters";
      localDrafts: CharacterDraft[];
      pinyinConflicts: ImportPinyinConflict[];
      resolvedDrafts: CharacterDraft[];
      sharedDrafts: CharacterDraft[];
    }
  | {
      kind: "result";
      localDrafts: CharacterDraft[];
      pinyinConflicts: ImportPinyinConflict[];
      record: PracticeResultRecord;
      resolvedDrafts: CharacterDraft[];
      sharedDrafts: CharacterDraft[];
    };

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
  const [resultHistoriesByListIdentity, setResultHistoriesByListIdentity] = useState<
    Record<string, PracticeResultRecord[]>
  >({});
  const [editingRecentKey, setEditingRecentKey] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [resultStatus, setResultStatus] = useState<string | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [answerEditingReturnPage, setAnswerEditingReturnPage] = useState<AnswerEditingReturnPage | null>(null);
  const [activeListIdentity, setActiveListIdentity] = useState<string | null>(null);
  const [activeResultRecordId, setActiveResultRecordId] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<OcrUiState>(OCR_IDLE_STATE);
  const [ocrPreviewImages, setOcrPreviewImages] = useState<OcrPreviewImage[]>([]);
  const [lastOcrFiles, setLastOcrFiles] = useState<File[]>([]);
  const [isSetupPinyinEditing, setIsSetupPinyinEditing] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

  useEffect(() => {
    let stored = readStoredData();
    const sharedResultRecord = getSharedResultRecordFromUrl(window.location.href);

    if (sharedResultRecord) {
      const importConflict = getResultImportConflict(sharedResultRecord);

      if (importConflict) {
        startPendingImport("result", importConflict, sharedResultRecord);
      } else {
        const importedRecord = importResultHistory(sharedResultRecord, { overwriteLocalSourceOrder: false });
        stored = readStoredData();
        setActiveListIdentity(importedRecord.sourceListIdentity);
        setActiveResultRecordId(importedRecord.id);
        setPage("resultDetail");
        setResultStatus("已导入识字结果");
      }
    } else {
      const sharedDrafts = getSharedCharacterDraftsFromUrl(window.location.href);

      if (sharedDrafts.length > 0) {
        const importConflict = getCharacterImportConflict(sharedDrafts);

        if (importConflict) {
          startPendingImport("characters", importConflict);
        } else {
          const importedDrafts = importCharacterDrafts(sharedDrafts, { overwriteLocalDrafts: false });
          stored = readStoredData();
          setInputText(joinCharacters(importedDrafts.map((draft) => draft.char)));
          setSelectedPinyins(getSelectedPinyinMap(importedDrafts));
          setIsSetupPinyinEditing(false);
          setShareStatus("已导入分享字表");
        }
      }
    }

    setSettings(stored.settings);
    setRecentLists(stored.recentLists);
    setResultHistoriesByListIdentity(stored.resultHistoriesByListIdentity);
    prepareSpeechSynthesis();
    const cancelFontLoad = scheduleHandwritingFontLoad(stored.settings.characterFont);

    return () => {
      cancelFontLoad();
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
  const activeHistoryRecords = activeListIdentity
    ? (resultHistoriesByListIdentity[activeListIdentity] ?? [])
    : [];
  const activeResultRecord =
    activeHistoryRecords.find((record) => record.id === activeResultRecordId) ?? null;
  const activeRecentDrafts =
    activeListIdentity && activeResultRecord
      ? activeResultRecord.sourceDrafts
      : activeListIdentity
        ? (recentLists.find((drafts) => getCharacterListIdentity(drafts) === activeListIdentity) ?? [])
        : [];

  function updateSettings(nextSettings: StoredSettings) {
    setSettings(nextSettings);
    saveSettings(nextSettings);

    if (nextSettings.characterFont === "handwriting") {
      scheduleHandwritingFontLoad(nextSettings.characterFont);
    }
  }

  function refreshStoredState() {
    const stored = readStoredData();
    setRecentLists(stored.recentLists);
    setResultHistoriesByListIdentity(stored.resultHistoriesByListIdentity);
  }

  function applyStoredState() {
    const stored = readStoredData();
    setSettings(stored.settings);
    setRecentLists(stored.recentLists);
    setResultHistoriesByListIdentity(stored.resultHistoriesByListIdentity);
    return stored;
  }

  function startPendingImport(
    kind: "characters",
    conflict: ImportListConflict,
  ): void;
  function startPendingImport(
    kind: "result",
    conflict: ImportListConflict,
    record: PracticeResultRecord,
  ): void;
  function startPendingImport(
    kind: PendingImport["kind"],
    conflict: ImportListConflict,
    record?: PracticeResultRecord,
  ) {
    const resolvedDrafts = preservePinyinsForOrder(conflict.localDrafts, conflict.localDrafts);
    const nextPending: PendingImport =
      kind === "result" && record
        ? {
            kind,
            localDrafts: conflict.localDrafts,
            pinyinConflicts: conflict.pinyinConflicts,
            record,
            resolvedDrafts,
            sharedDrafts: conflict.sharedDrafts,
          }
        : {
            kind: "characters",
            localDrafts: conflict.localDrafts,
            pinyinConflicts: conflict.pinyinConflicts,
            resolvedDrafts,
            sharedDrafts: conflict.sharedDrafts,
          };

    setPendingImport(nextPending);
    setPage(conflict.orderConflict ? "importCompare" : "pinyinCompare");
  }

  function completeCharacterImport(resolvedDrafts: CharacterDraft[], status: string) {
    applyStoredState();
    setInputText(joinCharacters(resolvedDrafts.map((draft) => draft.char)));
    setSelectedPinyins(getSelectedPinyinMap(resolvedDrafts));
    setIsSetupPinyinEditing(false);
    setPendingImport(null);
    setPage("setup");
    setShareStatus(status);
  }

  function completeResultImport(record: PracticeResultRecord, resolvedSourceDrafts: CharacterDraft[], status: string) {
    const importedRecord = importResultHistory(record, { resolvedSourceDrafts });

    applyStoredState();
    setActiveListIdentity(importedRecord.sourceListIdentity);
    setActiveResultRecordId(importedRecord.id);
    setPendingImport(null);
    setPage("resultDetail");
    setResultStatus(status);
  }

  function finishPendingImport(resolvedDrafts: CharacterDraft[], status: string) {
    if (!pendingImport) {
      return;
    }

    if (pendingImport.kind === "result") {
      completeResultImport(pendingImport.record, resolvedDrafts, status);
      return;
    }

    completeCharacterImport(resolvedDrafts, status);
  }

  function resolvePendingImportOrder(useSharedOrder: boolean) {
    if (!pendingImport) {
      return;
    }

    const orderDrafts = useSharedOrder ? pendingImport.sharedDrafts : pendingImport.localDrafts;
    const resolvedDrafts = preservePinyinsForOrder(orderDrafts, pendingImport.localDrafts);

    importCharacterDrafts(pendingImport.sharedDrafts, { resolvedDrafts });
    applyStoredState();

    if (pendingImport.pinyinConflicts.length > 0) {
      setPendingImport({
        ...pendingImport,
        resolvedDrafts,
      });
      setPage("pinyinCompare");
      return;
    }

    finishPendingImport(resolvedDrafts, useSharedOrder ? "已保存分享顺序" : "已保存本地顺序");
  }

  function resolvePendingImportPinyin(char: string, source: "local" | "shared") {
    if (!pendingImport) {
      return;
    }

    const conflict = pendingImport.pinyinConflicts.find((item) => item.char === char);

    if (!conflict) {
      return;
    }

    const pinyin = source === "local" ? conflict.localPinyin : conflict.sharedPinyin;
    const resolvedDrafts = pendingImport.resolvedDrafts.map((draft) =>
      draft.char === char ? { ...draft, pinyin } : draft,
    );
    const pinyinConflicts = pendingImport.pinyinConflicts.filter((item) => item.char !== char);

    importCharacterDrafts(pendingImport.sharedDrafts, { resolvedDrafts });
    applyStoredState();

    if (pinyinConflicts.length > 0) {
      setPendingImport({
        ...pendingImport,
        pinyinConflicts,
        resolvedDrafts,
      });
      return;
    }

    finishPendingImport(
      resolvedDrafts,
      pendingImport.kind === "result" ? "已保存读音并导入结果" : "已保存读音并导入字表",
    );
  }

  function updateInputText(value: string) {
    const nextChars = new Set(getCharacterPreview(value));
    setInputText(value);
    setSelectedPinyins((current) =>
      Object.fromEntries(Object.entries(current).filter(([char]) => nextChars.has(char))),
    );
  }

  function updateSelectedPinyin(char: string, pinyin: string) {
    const nextDrafts = previewDrafts.map((draft) => (draft.char === char ? { ...draft, pinyin } : draft));

    setIsSetupPinyinEditing(true);
    setSelectedPinyins(getSelectedPinyinMap(nextDrafts));
    persistStoredPreviewDrafts(nextDrafts);
  }

  function reorderPreviewItems(fromIndex: number, toIndex: number) {
    const reorderedDrafts = moveItem(previewDrafts, fromIndex, toIndex);

    if (reorderedDrafts === previewDrafts) {
      return;
    }

    setInputText(joinCharacters(reorderedDrafts.map((draft) => draft.char)));
    setSelectedPinyins(getSelectedPinyinMap(reorderedDrafts));
    persistStoredPreviewDrafts(reorderedDrafts);
  }

  function persistStoredPreviewDrafts(nextDrafts: CharacterDraft[]) {
    const nextIdentity = getCharacterListIdentity(nextDrafts);
    const existingKey =
      editingRecentKey ??
      (recentLists.some((drafts) => getCharacterListIdentity(drafts) === nextIdentity) ? nextIdentity : null);

    if (!existingKey) {
      return;
    }

    saveRecentList(nextDrafts, existingKey);
    refreshStoredState();
    setEditingRecentKey(nextIdentity);
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
      const message = error instanceof Error ? error.message : "图片识别失败";

      notifyAppError(error, "图片识别失败");
      setOcrState({
        candidateText: "",
        message,
        progress: 0,
        results: [],
        status: "error",
        totalFiles: files.length,
      });
    }
  }

  function prepareOcrModel() {
    void warmupCharacterOcr().catch((error) => notifyAppError(error, "图片识别模型加载失败"));
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
    startPracticeFromDrafts(previewDrafts, editingRecentKey ?? undefined);
  }

  function startPracticeFromDrafts(drafts: CharacterDraft[], replaceKey?: string) {
    const items = createCharacterItemsFromDrafts(drafts);

    if (items.length === 0) {
      return;
    }

    prepareSpeechSynthesis();
    const chars = items.map((item) => item.char);
    saveRecentList(drafts, replaceKey);
    refreshStoredState();
    setEditingRecentKey(null);
    setSession(
      createPracticeSession({
        sourceText: joinCharacters(chars),
        sourceDrafts: drafts,
        items,
        mode: "flashcard",
        randomOrder: settings.randomOrder,
      }),
    );
    setAnswerEditingReturnPage(null);
    setResultStatus(null);
    setPage("practice");
  }

  function editRecent(drafts: CharacterDraft[]) {
    setIsSetupPinyinEditing(false);
    setInputText(joinCharacters(drafts.map((draft) => draft.char)));
    setSelectedPinyins(getSelectedPinyinMap(drafts));
    setEditingRecentKey(getRecentListKey(drafts));
  }

  function removeRecent(drafts: CharacterDraft[]) {
    const key = getRecentListKey(drafts);
    deleteRecentList(key);
    refreshStoredState();

    if (editingRecentKey === key) {
      setEditingRecentKey(null);
      setInputText("");
    }

    if (activeListIdentity === key) {
      setActiveListIdentity(null);
      setActiveResultRecordId(null);
      setPage("setup");
    }
  }

  function clearAllCache() {
    const confirmed = window.confirm("确定清理全部缓存？最近字表、识字结果和设置都会删除。");

    if (!confirmed) {
      return;
    }

    clearStoredData();
    setInputText("");
    setSelectedPinyins({});
    setSettings(DEFAULT_SETTINGS);
    setRecentLists([]);
    setResultHistoriesByListIdentity({});
    setEditingRecentKey(null);
    setSession(null);
    setAnswerEditingReturnPage(null);
    setActiveListIdentity(null);
    setActiveResultRecordId(null);
    setOcrState(OCR_IDLE_STATE);
    setOcrPreviewImages([]);
    setLastOcrFiles([]);
    setIsSetupPinyinEditing(false);
    setResultStatus(null);
    setShareStatus("已清理全部缓存");
    setPage("setup");
    updateShareUrl(window.location.pathname);
    scheduleHandwritingFontLoad(DEFAULT_SETTINGS.characterFont);
  }

  function updateSession(nextSession: PracticeSession) {
    setSession(nextSession);

    if (isSessionComplete(nextSession)) {
      finishPractice(nextSession);
    }
  }

  function updatePracticeDrafts(nextDrafts: CharacterDraft[], options: { preserveQueueOrder?: boolean } = {}) {
    if (!session || nextDrafts.length === 0) {
      return;
    }

    const previousListIdentity = session.sourceListIdentity;
    const nextSession = updateSessionDrafts(session, nextDrafts, options);

    saveRecentList(nextSession.sourceDrafts, previousListIdentity);
    refreshStoredState();
    setSession(nextSession);
  }

  function updatePracticeDraftPinyin(char: string, pinyin: string) {
    if (!session) {
      return;
    }

    updatePracticeDrafts(
      session.sourceDrafts.map((draft) => (draft.char === char ? { ...draft, pinyin } : draft)),
      { preserveQueueOrder: true },
    );
  }

  function reorderPracticeDrafts(fromIndex: number, toIndex: number) {
    if (!session) {
      return;
    }

    updatePracticeDrafts(moveItem(session.sourceDrafts, fromIndex, toIndex));
  }

  function reorderResultPracticeItems(nextDrafts: CharacterDraft[]) {
    if (!session) {
      return;
    }

    if (nextDrafts === session.practiceDrafts) {
      return;
    }

    const nextSession = updateSessionPracticeDrafts(session, nextDrafts);
    const shouldUpdateSavedResult = page === "result" || activeResultRecordId === nextSession.id;

    setSession(nextSession);

    if (shouldUpdateSavedResult) {
      upsertResultHistory(createPracticeResultRecord(nextSession));
      refreshStoredState();
    }
  }

  function reorderResultRecordPracticeDrafts(record: PracticeResultRecord, nextDrafts: CharacterDraft[]) {
    if (nextDrafts === record.practiceDrafts) {
      return;
    }

    const nextRecord: PracticeResultRecord = {
      ...record,
      practiceDrafts: nextDrafts,
      updatedAt: Date.now(),
    };

    upsertResultHistory(nextRecord);
    refreshStoredState();
    setActiveResultRecordId(nextRecord.id);
  }

  function saveSessionResult(nextSession: PracticeSession): PracticeResultRecord {
    const record = createPracticeResultRecord(nextSession);
    upsertResultHistory(record);
    refreshStoredState();
    setActiveListIdentity(record.sourceListIdentity);
    setActiveResultRecordId(record.id);
    return record;
  }

  function markKnown() {
    if (!session) {
      return;
    }
    if (settings.soundEnabled) {
      playTone("success");
    }
    updateSession(recordAttempt(session, "known", { advance: !getCurrentResult(session) }));
  }

  function markUnknown() {
    if (!session) {
      return;
    }
    if (settings.soundEnabled) {
      playTone("soft");
    }
    updateSession(recordAttempt(session, "unknown", { advance: !getCurrentResult(session) }));
  }

  function markReview() {
    if (!session) {
      return;
    }
    if (settings.soundEnabled) {
      playTone("soft");
    }
    updateSession(recordAttempt(session, "review", { advance: !getCurrentResult(session) }));
  }

  function cycleAssessment(char: string) {
    if (!session) {
      return;
    }

    const nextResult = getNextCharacterAssessment(session.results[char]);

    if (settings.soundEnabled) {
      if (nextResult === "known") {
        playTone("success");
      } else if (nextResult) {
        playTone("soft");
      }
    }

    setSession(cycleCharacterAssessment(session, char));
  }

  function restartSetup() {
    setPage("setup");
    setSession(null);
    setAnswerEditingReturnPage(null);
    setResultStatus(null);
    setActiveListIdentity(null);
    setActiveResultRecordId(null);
  }

  function finishSession() {
    if (session) {
      finishPractice(session);
    }
  }

  function continuePractice() {
    setAnswerEditingReturnPage(null);
    setPage("practice");
    setResultStatus(null);
  }

  function finishPractice(nextSession: PracticeSession) {
    saveSessionResult(nextSession);

    const returnPage = answerEditingReturnPage;

    setAnswerEditingReturnPage(null);
    setPage(returnPage === "resultDetail" ? "resultDetail" : "result");
  }

  function editCurrentAnswers() {
    if (!session) {
      return;
    }

    setSession(prepareSessionForAnswerEditing(session));
    setAnswerEditingReturnPage("result");
    setResultStatus(null);
    setPage("practice");
  }

  function editResultRecord(record: PracticeResultRecord) {
    setSession(createPracticeSessionFromResultRecord(record));
    setActiveListIdentity(record.sourceListIdentity);
    setActiveResultRecordId(record.id);
    setAnswerEditingReturnPage("resultDetail");
    setResultStatus(null);
    setPage("practice");
  }

  function reviewMistakes() {
    if (!session) {
      return;
    }

    const reviewItems = getReviewItems(session);

    if (reviewItems.length === 0) {
      return;
    }

    setSession(createReviewSession(session, reviewItems, "flashcard", settings.randomOrder));
    setAnswerEditingReturnPage(null);
    setResultStatus(null);
    setPage("practice");
  }

  function openRecentHistory(drafts: CharacterDraft[]) {
    setActiveListIdentity(getCharacterListIdentity(drafts));
    setActiveResultRecordId(null);
    setResultStatus(null);
    setPage("resultHistory");
  }

  function openResultRecord(record: PracticeResultRecord) {
    setActiveListIdentity(record.sourceListIdentity);
    setActiveResultRecordId(record.id);
    setResultStatus(null);
    setPage("resultDetail");
  }

  function deleteResultRecord(record: PracticeResultRecord) {
    deleteResultHistoryRecord(record.sourceListIdentity, record.id);
    refreshStoredState();
    setResultStatus("已删除识字结果");

    if (activeResultRecordId === record.id) {
      setActiveResultRecordId(null);
      setPage("resultHistory");
    }
  }

  function practiceDrafts(drafts: CharacterDraft[]) {
    startPracticeFromDrafts(drafts);
  }

  function updateShareUrl(url: string) {
    window.history.replaceState(null, "", url);
  }

  async function copyShareLink(url: string, successText: string, failureText: string) {
    setShareStatus((await copyText(url)) ? successText : failureText);
  }

  async function copyResultShareLink(url: string, successText: string, failureText: string) {
    setResultStatus((await copyText(url)) ? successText : failureText);
  }

  async function shareCharacters(drafts: CharacterDraft[]) {
    if (drafts.length === 0) {
      return;
    }

    const shareData = createSharedCharactersData(drafts, window.location.href);
    updateShareUrl(shareData.url);
    await copyShareLink(shareData.url, "链接已复制", "请从地址栏复制");
  }

  function shareCurrentCharacters() {
    void shareCharacters(previewDrafts);
  }

  function shareRecent(drafts: CharacterDraft[]) {
    void shareCharacters(drafts);
  }

  async function shareResultRecord(record: PracticeResultRecord) {
    const shareData = createSharedResultData(record, window.location.href);
    updateShareUrl(shareData.url);
    await copyResultShareLink(shareData.url, "结果链接已复制", "请从地址栏复制");
  }

  function shareCurrentResult() {
    if (!session) {
      return;
    }

    void shareResultRecord(saveSessionResult(session));
  }

  function speakCurrent() {
    if (!settings.soundEnabled) {
      return;
    }

    const current = session?.queue[session.currentIndex];
    speakCharacter(current?.char ?? "", { pinyin: current?.pinyin });
  }

  return (
    <div className="app-shell" data-character-font={settings.characterFont}>
      {page === "setup" ? (
        <SetupPage
          inputText={inputText}
          recentLists={recentLists}
          resultHistoriesByListIdentity={resultHistoriesByListIdentity}
          settings={settings}
          previewItems={previewItems}
          ocrPreviewImages={ocrPreviewImages}
          ocrState={ocrState}
          shareStatus={shareStatus}
          showPinyinChoices={isSetupPinyinEditing}
          onImageFilesSelected={recognizeImages}
          onInputChange={updateInputText}
          editingRecentKey={editingRecentKey}
          onDeleteRecent={removeRecent}
          onEditRecent={editRecent}
          onOpenRecentHistory={openRecentHistory}
          onClearAllCache={clearAllCache}
          onClearOcr={clearOcrCandidates}
          onConfirmOcr={confirmOcrCandidates}
          onPinyinChange={updateSelectedPinyin}
          onPinyinEditToggle={() => setIsSetupPinyinEditing((current) => !current)}
          onReorderPreviewItems={reorderPreviewItems}
          onOcrCandidateChange={updateOcrCandidateText}
          onPrepareOcr={prepareOcrModel}
          onRetryOcr={retryOcr}
          onSettingsChange={updateSettings}
          onShare={shareCurrentCharacters}
          onShareRecent={shareRecent}
          onStart={startPractice}
        />
      ) : null}

      {page === "importCompare" && pendingImport ? (
        <ImportComparePage
          importType={pendingImport.kind}
          localDrafts={pendingImport.localDrafts}
          sharedDrafts={pendingImport.sharedDrafts}
          onKeepLocal={() => resolvePendingImportOrder(false)}
          onUseShared={() => resolvePendingImportOrder(true)}
        />
      ) : null}

      {page === "pinyinCompare" && pendingImport ? (
        <ImportPinyinComparePage
          importType={pendingImport.kind}
          conflicts={pendingImport.pinyinConflicts}
          onSelectPinyin={resolvePendingImportPinyin}
        />
      ) : null}

      {page === "practice" && session ? (
        <PracticePage
          session={session}
          settings={settings}
          onExit={restartSetup}
          onFinish={finishSession}
          onCycleAssessment={cycleAssessment}
          onKnown={markKnown}
          onNext={() => setSession(goToNext(session))}
          onPinyinChange={updatePracticeDraftPinyin}
          onPrevious={() => setSession(goToPrevious(session))}
          onReorderDrafts={reorderPracticeDrafts}
          onReview={markReview}
          onSelectPracticeIndex={(index) => setSession(goToIndex(session, index))}
          onSettingsChange={updateSettings}
          onSpeak={speakCurrent}
          onUnknown={markUnknown}
        />
      ) : null}

      {page === "result" && session && stats ? (
        <ResultPage
          actionStatus={resultStatus}
          canContinue={stats.practiced < stats.total}
          items={session.items}
          settings={settings}
          stats={stats}
          onContinue={continuePractice}
          onEditAnswers={editCurrentAnswers}
          onRestart={restartSetup}
          onReview={reviewMistakes}
          onReorderPracticeDrafts={reorderResultPracticeItems}
          onSettingsChange={updateSettings}
          onShareResult={shareCurrentResult}
        />
      ) : null}

      {page === "resultHistory" && activeListIdentity ? (
        <ResultHistoryPage
          drafts={activeRecentDrafts}
          records={activeHistoryRecords}
          onBack={restartSetup}
          onDeleteRecord={deleteResultRecord}
          onOpenRecord={openResultRecord}
          onPracticeList={practiceDrafts}
        />
      ) : null}

      {page === "resultDetail" && activeResultRecord ? (
        <ResultDetailPage
          actionStatus={resultStatus}
          record={activeResultRecord}
          settings={settings}
          onBack={() => setPage("resultHistory")}
          onDelete={deleteResultRecord}
          onEditAnswers={editResultRecord}
          onPracticeList={practiceDrafts}
          onReorderPracticeDrafts={reorderResultRecordPracticeDrafts}
          onSettingsChange={updateSettings}
          onShareResult={(record) => void shareResultRecord(record)}
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

function scheduleHandwritingFontLoad(characterFont: StoredSettings["characterFont"]): () => void {
  if (characterFont !== "handwriting") {
    return () => undefined;
  }

  const timer = window.setTimeout(() => {
    void loadHandwritingFont().catch(() => undefined);
  }, 900);

  return () => {
    window.clearTimeout(timer);
  };
}
