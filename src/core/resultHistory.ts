import type { CharacterDraft, CharacterItem } from "../types/character";
import type { PracticeResultRecord } from "../types/result";
import type { PracticeSession, SessionStats } from "../types/session";
import { resolveCharacterPinyin } from "./pinyin";

type ResultDraftGroups = {
  knownDrafts: CharacterDraft[];
  unknownDrafts: CharacterDraft[];
  reviewOnlyDrafts: CharacterDraft[];
  reviewDrafts: CharacterDraft[];
  unansweredDrafts: CharacterDraft[];
};

export function getCharacterListIdentity(drafts: CharacterDraft[]): string {
  const normalized = new Map<string, string>();

  for (const draft of drafts) {
    const pinyin = resolveCharacterPinyin(draft.char, draft.pinyin) ?? "";
    normalized.set(draft.char, pinyin);
  }

  return `v1:${Array.from(normalized.entries())
    .sort(([charA, pinyinA], [charB, pinyinB]) => `${charA}:${pinyinA}`.localeCompare(`${charB}:${pinyinB}`))
    .map(([char, pinyin]) => `${char}:${pinyin}`)
    .join("|")}`;
}

export function createPracticeResultRecord(session: PracticeSession, now = Date.now()): PracticeResultRecord {
  return {
    id: session.id,
    sessionId: session.id,
    sourceListIdentity: session.sourceListIdentity,
    sourceDrafts: session.sourceDrafts,
    practiceDrafts: session.practiceDrafts,
    mode: session.mode,
    round: session.round,
    createdAt: session.createdAt,
    updatedAt: now,
    results: session.results,
  };
}

export function createDraftsFromItems(items: CharacterItem[]): CharacterDraft[] {
  return items.map((item) => ({
    char: item.char,
    pinyin: item.pinyin,
  }));
}

export function getResultRecordStats(record: PracticeResultRecord): SessionStats {
  const groups = getResultRecordDraftGroups(record);
  const total = record.practiceDrafts.length;
  const answered = Object.keys(record.results).filter((char) =>
    record.practiceDrafts.some((draft) => draft.char === char),
  );
  const passedCount = groups.knownDrafts.length + groups.reviewOnlyDrafts.length;
  const passRate = total === 0 ? 0 : Math.round((passedCount / total) * 100);

  return {
    total,
    practiced: answered.length,
    knownCount: groups.knownDrafts.length,
    unknownCount: groups.unknownDrafts.length,
    reviewOnlyCount: groups.reviewOnlyDrafts.length,
    reviewCount: groups.reviewDrafts.length,
    passedCount,
    accuracy: passRate,
    passRate,
    knownChars: groups.knownDrafts.map((draft) => draft.char),
    unknownChars: groups.unknownDrafts.map((draft) => draft.char),
    reviewOnlyChars: groups.reviewOnlyDrafts.map((draft) => draft.char),
    reviewChars: groups.reviewDrafts.map((draft) => draft.char),
    unansweredChars: groups.unansweredDrafts.map((draft) => draft.char),
  };
}

export function getResultRecordDraftGroups(record: PracticeResultRecord): ResultDraftGroups {
  const knownDrafts: CharacterDraft[] = [];
  const unknownDrafts: CharacterDraft[] = [];
  const reviewOnlyDrafts: CharacterDraft[] = [];
  const unansweredDrafts: CharacterDraft[] = [];

  for (const draft of record.practiceDrafts) {
    const result = record.results[draft.char];

    if (result === "known") {
      knownDrafts.push(draft);
      continue;
    }

    if (result === "unknown") {
      unknownDrafts.push(draft);
      continue;
    }

    if (result === "review") {
      reviewOnlyDrafts.push(draft);
      continue;
    }

    unansweredDrafts.push(draft);
  }

  return {
    knownDrafts,
    unknownDrafts,
    reviewOnlyDrafts,
    reviewDrafts: [...unknownDrafts, ...reviewOnlyDrafts],
    unansweredDrafts,
  };
}
