import type { CharacterDraft } from "../types/character";
import { getCharacterListIdentity } from "../core/resultHistory";
import { resolveCharacterPinyin } from "../core/pinyin";
import type { PracticeResultRecord } from "../types/result";
import type { StoredData, StoredSettings } from "./storageTypes";

const STORAGE_KEY = "character-practice:v2";
const MAX_RECENT_LISTS = 6;
const MAX_RESULT_HISTORY_PER_LIST = 20;

export const DEFAULT_SETTINGS: StoredSettings = {
  characterFont: "handwriting",
  randomOrder: false,
  showPinyin: true,
  soundEnabled: true,
  mode: "flashcard",
};

const DEFAULT_DATA: StoredData = {
  version: 2,
  recentLists: [],
  resultHistoriesByListIdentity: {},
  settings: DEFAULT_SETTINGS,
};

export function readStoredData(): StoredData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_DATA;
    }

    const parsed = JSON.parse(raw) as Partial<StoredData>;

    if (parsed.version !== 2) {
      return DEFAULT_DATA;
    }

    return {
      version: 2,
      recentLists: normalizeRecentLists(parsed.recentLists),
      resultHistoriesByListIdentity: normalizeResultHistories(parsed.resultHistoriesByListIdentity),
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    return DEFAULT_DATA;
  }
}

export function writeStoredData(data: StoredData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearStoredData(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function saveSettings(settings: StoredSettings): void {
  const current = readStoredData();
  writeStoredData({
    ...current,
    settings,
  });
}

export function saveRecentList(drafts: CharacterDraft[], replaceKey?: string): void {
  const current = readStoredData();
  const key = getCharacterListIdentity(drafts);
  const recentLists = [
    drafts,
    ...current.recentLists.filter((item) => {
      const itemKey = getCharacterListIdentity(item);
      return itemKey !== key && itemKey !== replaceKey;
    }),
  ].slice(0, MAX_RECENT_LISTS);
  const resultHistoriesByListIdentity = { ...current.resultHistoriesByListIdentity };

  if (replaceKey && replaceKey !== key) {
    delete resultHistoriesByListIdentity[replaceKey];
  }

  writeStoredData({
    ...current,
    recentLists,
    resultHistoriesByListIdentity: pruneHistoriesToRecentLists(resultHistoriesByListIdentity, recentLists),
  });
}

export function deleteRecentList(key: string): void {
  const current = readStoredData();
  const resultHistoriesByListIdentity = { ...current.resultHistoriesByListIdentity };
  delete resultHistoriesByListIdentity[key];

  writeStoredData({
    ...current,
    recentLists: current.recentLists.filter((item) => getCharacterListIdentity(item) !== key),
    resultHistoriesByListIdentity,
  });
}

export function getRecentListKey(drafts: CharacterDraft[]): string {
  return getCharacterListIdentity(drafts);
}

export function upsertResultHistory(record: PracticeResultRecord): void {
  const current = readStoredData();

  writeStoredData({
    ...current,
    resultHistoriesByListIdentity: upsertRecordIntoHistories(current.resultHistoriesByListIdentity, record),
  });
}

export function importResultHistory(record: PracticeResultRecord): PracticeResultRecord {
  const current = readStoredData();
  const normalizedRecord = {
    ...record,
    sourceListIdentity: getCharacterListIdentity(record.sourceDrafts),
  };
  const hasRecentList = current.recentLists.some(
    (drafts) => getCharacterListIdentity(drafts) === normalizedRecord.sourceListIdentity,
  );
  const recentLists = hasRecentList
    ? current.recentLists
    : [normalizedRecord.sourceDrafts, ...current.recentLists].slice(0, MAX_RECENT_LISTS);

  const nextHistories = upsertRecordIntoHistories(current.resultHistoriesByListIdentity, normalizedRecord);
  const savedRecord = getStoredEquivalentRecord(nextHistories, normalizedRecord) ?? normalizedRecord;

  writeStoredData({
    ...current,
    recentLists,
    resultHistoriesByListIdentity: pruneHistoriesToRecentLists(nextHistories, recentLists),
  });

  return savedRecord;
}

export function deleteResultHistoryRecord(sourceListIdentity: string, recordId: string): void {
  const current = readStoredData();
  const records = current.resultHistoriesByListIdentity[sourceListIdentity] ?? [];

  writeStoredData({
    ...current,
    resultHistoriesByListIdentity: {
      ...current.resultHistoriesByListIdentity,
      [sourceListIdentity]: records.filter((record) => record.id !== recordId),
    },
  });
}

function upsertRecordIntoHistories(
  histories: Record<string, PracticeResultRecord[]>,
  record: PracticeResultRecord,
): Record<string, PracticeResultRecord[]> {
  const records = histories[record.sourceListIdentity] ?? [];
  const existingIndex = records.findIndex(
    (item) => item.id === record.id || shouldMergeSharedResultRecord(item, record),
  );
  const nextRecord =
    existingIndex >= 0 && record.id.startsWith("shared-")
      ? records[existingIndex]
      : existingIndex >= 0 && records[existingIndex].updatedAt > record.updatedAt
        ? records[existingIndex]
        : record;
  const nextRecords =
    existingIndex >= 0
      ? records.map((item, index) => (index === existingIndex ? nextRecord : item))
      : [nextRecord, ...records];

  return {
    ...histories,
    [record.sourceListIdentity]: nextRecords
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, MAX_RESULT_HISTORY_PER_LIST),
  };
}

function normalizeRecentLists(value: unknown): CharacterDraft[][] {
  if (!Array.isArray(value)) {
    return [];
  }

  const recentLists: CharacterDraft[][] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!Array.isArray(item)) {
      continue;
    }

    const drafts = item.filter(isCharacterDraft);
    const identity = getCharacterListIdentity(drafts);

    if (drafts.length === 0 || seen.has(identity)) {
      continue;
    }

    seen.add(identity);
    recentLists.push(drafts);

    if (recentLists.length >= MAX_RECENT_LISTS) {
      break;
    }
  }

  return recentLists;
}

function normalizeResultHistories(value: unknown): Record<string, PracticeResultRecord[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, PracticeResultRecord[]> = {};

  for (const [identity, records] of Object.entries(value)) {
    if (!Array.isArray(records)) {
      continue;
    }

    const normalizedRecords = records.filter(isPracticeResultRecord).reduce<PracticeResultRecord[]>(
      (result, record) => addNormalizedResultRecord(result, record),
      [],
    );

    if (normalizedRecords.length === 0) {
      continue;
    }

    result[identity] = normalizedRecords
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, MAX_RESULT_HISTORY_PER_LIST);
  }

  return result;
}

function addNormalizedResultRecord(records: PracticeResultRecord[], record: PracticeResultRecord): PracticeResultRecord[] {
  const existingIndex = records.findIndex(
    (item) => item.id === record.id || shouldMergeSharedResultRecord(item, record),
  );

  if (existingIndex < 0) {
    return [...records, record];
  }

  const existingRecord = records[existingIndex];
  const nextRecord = record.id.startsWith("shared-")
    ? existingRecord
    : existingRecord.id.startsWith("shared-") || record.updatedAt > existingRecord.updatedAt
      ? record
      : existingRecord;

  return records.map((item, index) => (index === existingIndex ? nextRecord : item));
}

function getStoredEquivalentRecord(
  histories: Record<string, PracticeResultRecord[]>,
  record: PracticeResultRecord,
): PracticeResultRecord | null {
  return (
    histories[record.sourceListIdentity]?.find(
      (item) => item.id === record.id || shouldMergeSharedResultRecord(item, record),
    ) ?? null
  );
}

function shouldMergeSharedResultRecord(left: PracticeResultRecord, right: PracticeResultRecord): boolean {
  return (left.id.startsWith("shared-") || right.id.startsWith("shared-")) && areEquivalentResultRecords(left, right);
}

function areEquivalentResultRecords(left: PracticeResultRecord, right: PracticeResultRecord): boolean {
  return (
    getCharacterListIdentity(left.sourceDrafts) === getCharacterListIdentity(right.sourceDrafts) &&
    areEquivalentDraftLists(left.sourceDrafts, right.sourceDrafts) &&
    areEquivalentDraftLists(left.practiceDrafts, right.practiceDrafts) &&
    areEquivalentPracticeResults(left, right)
  );
}

function areEquivalentDraftLists(left: CharacterDraft[], right: CharacterDraft[]): boolean {
  return (
    left.length === right.length &&
    left.every((draft, index) => {
      const rightDraft = right[index];

      return (
        Boolean(rightDraft) &&
        draft.char === rightDraft.char &&
        resolveCharacterPinyin(draft.char, draft.pinyin) === resolveCharacterPinyin(rightDraft.char, rightDraft.pinyin)
      );
    })
  );
}

function areEquivalentPracticeResults(left: PracticeResultRecord, right: PracticeResultRecord): boolean {
  return left.practiceDrafts.every((draft) => left.results[draft.char] === right.results[draft.char]);
}

function pruneHistoriesToRecentLists(
  histories: Record<string, PracticeResultRecord[]>,
  recentLists: CharacterDraft[][],
): Record<string, PracticeResultRecord[]> {
  const identities = new Set(recentLists.map((drafts) => getCharacterListIdentity(drafts)));

  return Object.fromEntries(Object.entries(histories).filter(([identity]) => identities.has(identity)));
}

function isCharacterDraft(value: unknown): value is CharacterDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Partial<CharacterDraft>;
  return typeof draft.char === "string" && draft.char.length > 0 && (!draft.pinyin || typeof draft.pinyin === "string");
}

function isPracticeResultRecord(value: unknown): value is PracticeResultRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<PracticeResultRecord>;

  return (
    typeof record.id === "string" &&
    typeof record.sessionId === "string" &&
    typeof record.sourceListIdentity === "string" &&
    Array.isArray(record.sourceDrafts) &&
    record.sourceDrafts.every(isCharacterDraft) &&
    Array.isArray(record.practiceDrafts) &&
    record.practiceDrafts.every(isCharacterDraft) &&
    (record.mode === "flashcard" || record.mode === "find-character") &&
    (record.round === "main" || record.round === "review") &&
    typeof record.createdAt === "number" &&
    typeof record.updatedAt === "number" &&
    Boolean(record.results) &&
    typeof record.results === "object" &&
    !Array.isArray(record.results)
  );
}
