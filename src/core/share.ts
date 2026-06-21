import type { CharacterDraft } from "../types/character";
import type { PracticeResultRecord } from "../types/result";
import type { CharacterAssessment } from "../types/session";
import { joinCharacters } from "../utils/text";
import { getCharacterListIdentity } from "./resultHistory";
import { getCharacterPinyinOptions, resolveCharacterPinyin } from "./pinyin";

const SHARE_SHORT_PARAM = "s";
const SHARE_PRACTICE_PARAM = "p";
const SHARE_ERROR_PARAM = "e";
const SHARE_REVIEW_PARAM = "r";
const SHARE_UNANSWERED_PARAM = "u";
const SHARE_TITLE = "识字小练习";
const BYTES_PER_DRAFT = 4;
const HAN_CHARACTER_RE = /\p{Script=Han}/u;

type SharedResultIndexes = {
  practiceIndexes: number[];
  errorIndexes: number[];
  reviewIndexes: number[];
  unansweredIndexes: number[];
};

export type SharedCharactersData = {
  title: string;
  text: string;
  url: string;
};

export function getSharedCharacterDraftsFromUrl(href: string): CharacterDraft[] {
  try {
    const url = new URL(href);
    const shortValue = url.searchParams.get(SHARE_SHORT_PARAM);

    if (shortValue) {
      return decodeShortSharedDrafts(shortValue);
    }

    return [];
  } catch {
    return [];
  }
}

export function createSharedCharactersUrl(drafts: CharacterDraft[], href: string): string {
  const url = new URL(href);
  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARE_SHORT_PARAM, encodeShortSharedDrafts(drafts));

  return url.toString();
}

export function createSharedCharactersData(drafts: CharacterDraft[], href: string): SharedCharactersData {
  const sourceText = joinCharacters(drafts.map((draft) => draft.char));
  const url = createSharedCharactersUrl(drafts, href);

  return {
    title: SHARE_TITLE,
    text: `本次字表：${sourceText}`,
    url,
  };
}

export function getSharedResultRecordFromUrl(href: string): PracticeResultRecord | null {
  try {
    const url = new URL(href);
    const shortValue = url.searchParams.get(SHARE_SHORT_PARAM);
    const practiceValue = url.searchParams.get(SHARE_PRACTICE_PARAM);
    const errorValue = url.searchParams.get(SHARE_ERROR_PARAM);
    const reviewValue = url.searchParams.get(SHARE_REVIEW_PARAM);
    const unansweredValue = url.searchParams.get(SHARE_UNANSWERED_PARAM);

    if (
      !shortValue ||
      (practiceValue === null && errorValue === null && reviewValue === null && unansweredValue === null)
    ) {
      return null;
    }

    const sourceDrafts = decodeShortSharedDrafts(shortValue);
    const sharedIndexes = decodeSharedResultPayload({
      errorValue,
      practiceValue,
      reviewValue,
      total: sourceDrafts.length,
      unansweredValue,
    });

    if (sourceDrafts.length === 0 || sharedIndexes === null) {
      return null;
    }

    const { practiceIndexes, errorIndexes, reviewIndexes, unansweredIndexes } = sharedIndexes;
    const practiceDrafts = getDraftsByIndexes(sourceDrafts, practiceIndexes);
    const results = createSharedResultAssessments(practiceDrafts, errorIndexes, reviewIndexes, unansweredIndexes);
    const normalizedPracticeValue = isFullSequentialIndexes(practiceIndexes, sourceDrafts.length)
      ? ""
      : encodeSharedIndexes(practiceIndexes);
    const id = createSharedResultId(
      shortValue,
      normalizedPracticeValue,
      encodeSharedIndexes(errorIndexes),
      encodeSharedIndexes(reviewIndexes),
      encodeSharedIndexes(unansweredIndexes),
    );
    const now = Date.now();

    return {
      id,
      sessionId: id,
      sourceDrafts,
      practiceDrafts,
      sourceListIdentity: getCharacterListIdentity(sourceDrafts),
      mode: "flashcard",
      round: "main",
      createdAt: now,
      updatedAt: now,
      results,
    };
  } catch {
    return null;
  }
}

export function createSharedResultUrl(record: PracticeResultRecord, href: string): string {
  const url = new URL(href);
  const sourceDrafts = record.sourceDrafts;
  const practiceIndexes = getSharedDraftIndexes(sourceDrafts, record.practiceDrafts);
  const practiceDrafts = practiceIndexes ? record.practiceDrafts : sourceDrafts;
  const errorIndexes = getSharedResultIndexes(practiceDrafts, record, "unknown");
  const reviewIndexes = getSharedResultIndexes(practiceDrafts, record, "review");
  const unansweredIndexes = getSharedUnansweredIndexes(practiceDrafts, record);

  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARE_SHORT_PARAM, encodeShortSharedDrafts(sourceDrafts));

  if (practiceIndexes && !isFullSequentialIndexes(practiceIndexes, sourceDrafts.length)) {
    url.searchParams.set(SHARE_PRACTICE_PARAM, encodeSharedIndexes(practiceIndexes));
  }

  const needsResultMarker = !url.searchParams.has(SHARE_PRACTICE_PARAM) &&
    errorIndexes.length === 0 &&
    reviewIndexes.length === 0 &&
    unansweredIndexes.length === 0;

  setSharedResultIndexes(url, SHARE_ERROR_PARAM, errorIndexes, needsResultMarker);
  setSharedResultIndexes(url, SHARE_REVIEW_PARAM, reviewIndexes);
  setSharedResultIndexes(url, SHARE_UNANSWERED_PARAM, unansweredIndexes);

  return url.toString();
}

export function createSharedResultData(record: PracticeResultRecord, href: string): SharedCharactersData {
  const sourceText = joinCharacters(record.sourceDrafts.map((draft) => draft.char));
  const url = createSharedResultUrl(record, href);

  return {
    title: "识字结果",
    text: `识字结果：${sourceText}`,
    url,
  };
}

function encodeShortSharedDrafts(drafts: CharacterDraft[]): string {
  const bytes = new Uint8Array(drafts.length * BYTES_PER_DRAFT);

  drafts.forEach((draft, index) => {
    const offset = index * BYTES_PER_DRAFT;
    const codePoint = draft.char.codePointAt(0) ?? 0;
    const pinyinIndex = getDraftPinyinIndex(draft);

    bytes[offset] = (codePoint >> 16) & 0xff;
    bytes[offset + 1] = (codePoint >> 8) & 0xff;
    bytes[offset + 2] = codePoint & 0xff;
    bytes[offset + 3] = pinyinIndex > 0 ? pinyinIndex : 0;
  });

  return toBase64Url(bytes);
}

function decodeShortSharedDrafts(value: string): CharacterDraft[] {
  const bytes = fromBase64Url(value);
  const drafts: CharacterDraft[] = [];

  for (let index = 0; index + BYTES_PER_DRAFT - 1 < bytes.length; index += BYTES_PER_DRAFT) {
    const codePoint = (bytes[index] << 16) | (bytes[index + 1] << 8) | bytes[index + 2];
    const char = String.fromCodePoint(codePoint);

    if (!HAN_CHARACTER_RE.test(char)) {
      continue;
    }

    const pinyinIndex = bytes[index + 3];
    const pinyin = pinyinIndex > 0 ? getCharacterPinyinOptions(char)[pinyinIndex] : undefined;

    drafts.push({
      char,
      pinyin,
    });
  }

  return drafts;
}

function getDraftPinyinIndex(draft: CharacterDraft): number {
  const options = getCharacterPinyinOptions(draft.char);

  return draft.pinyin ? options.indexOf(draft.pinyin) : -1;
}

function toBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodeSharedIndexes(indexes: number[]): string {
  return toBase64Url(encodeIndexBytes(indexes));
}

function setSharedResultIndexes(url: URL, param: string, indexes: number[], force = false): void {
  if (indexes.length > 0 || force) {
    url.searchParams.set(param, encodeSharedIndexes(indexes));
  }
}

function decodeSharedIndexes(value: string | null, total: number): number[] | null {
  if (value === null || value === "") {
    return [];
  }

  const indexes = decodeIndexBytes(fromBase64Url(value));

  if (!indexes) {
    return null;
  }

  const seen = new Set<number>();

  for (const index of indexes) {
    if (!Number.isInteger(index) || index < 0 || index >= total || seen.has(index)) {
      return null;
    }

    seen.add(index);
  }

  return indexes;
}

function encodeIndexBytes(indexes: number[]): Uint8Array {
  const bytes: number[] = [];

  for (const index of indexes) {
    let value = index;

    do {
      let byte = value & 0x7f;
      value = Math.floor(value / 128);

      if (value > 0) {
        byte |= 0x80;
      }

      bytes.push(byte);
    } while (value > 0);
  }

  return Uint8Array.from(bytes);
}

function decodeIndexBytes(bytes: Uint8Array): number[] | null {
  const indexes: number[] = [];
  let value = 0;
  let multiplier = 1;

  for (const byte of bytes) {
    value += (byte & 0x7f) * multiplier;

    if ((byte & 0x80) === 0) {
      indexes.push(value);
      value = 0;
      multiplier = 1;
      continue;
    }

    multiplier *= 128;

    if (multiplier > 128 ** 4) {
      return null;
    }
  }

  return multiplier === 1 ? indexes : null;
}

function decodeSharedResultPayload({
  errorValue,
  practiceValue,
  reviewValue,
  total,
  unansweredValue,
}: {
  errorValue: string | null;
  practiceValue: string | null;
  reviewValue: string | null;
  total: number;
  unansweredValue: string | null;
}): SharedResultIndexes | null {
  const practiceIndexes = practiceValue === null
    ? createSequentialIndexes(total)
    : decodeSharedIndexes(practiceValue, total);

  if (!practiceIndexes || practiceIndexes.length === 0) {
    return null;
  }

  return decodeSeparatedResultIndexes({
    errorValue,
    practiceIndexes,
    reviewValue,
    unansweredValue,
  });
}

function decodeSeparatedResultIndexes({
  errorValue,
  practiceIndexes,
  reviewValue,
  unansweredValue,
}: {
  errorValue: string | null;
  practiceIndexes: number[];
  reviewValue: string | null;
  unansweredValue: string | null;
}): SharedResultIndexes | null {
  const total = practiceIndexes.length;
  const errorIndexes = decodeSharedIndexes(errorValue, total);
  const reviewIndexes = decodeSharedIndexes(reviewValue, total);
  const unansweredIndexes = decodeSharedIndexes(unansweredValue, total);

  if (errorIndexes === null || reviewIndexes === null || unansweredIndexes === null) {
    return null;
  }

  return createValidSharedResultIndexes({
    errorIndexes,
    practiceIndexes,
    reviewIndexes,
    unansweredIndexes,
  });
}

function createValidSharedResultIndexes({
  errorIndexes,
  practiceIndexes,
  reviewIndexes,
  unansweredIndexes,
}: SharedResultIndexes): SharedResultIndexes | null {
  if (
    hasOverlappingIndexes(errorIndexes, reviewIndexes) ||
    hasOverlappingIndexes(errorIndexes, unansweredIndexes) ||
    hasOverlappingIndexes(reviewIndexes, unansweredIndexes)
  ) {
    return null;
  }

  return {
    errorIndexes,
    practiceIndexes,
    reviewIndexes,
    unansweredIndexes,
  };
}

function hasOverlappingIndexes(left: number[], right: number[]): boolean {
  const leftSet = new Set(left);
  return right.some((index) => leftSet.has(index));
}

function createSequentialIndexes(total: number): number[] {
  return Array.from({ length: total }, (_, index) => index);
}

function isFullSequentialIndexes(indexes: number[], total: number): boolean {
  return indexes.length === total && indexes.every((index, position) => index === position);
}

function getDraftsByIndexes(sourceDrafts: CharacterDraft[], indexes: number[]): CharacterDraft[] {
  return indexes.map((index) => sourceDrafts[index]).filter(Boolean);
}

function getSharedDraftIndexes(sourceDrafts: CharacterDraft[], targetDrafts: CharacterDraft[]): number[] | null {
  const used = new Set<number>();
  const indexes: number[] = [];

  for (const targetDraft of targetDrafts) {
    const index = sourceDrafts.findIndex(
      (sourceDraft, sourceIndex) => !used.has(sourceIndex) && areEquivalentDrafts(sourceDraft, targetDraft),
    );

    if (index < 0) {
      return null;
    }

    used.add(index);
    indexes.push(index);
  }

  return indexes;
}

function areEquivalentDrafts(left: CharacterDraft, right: CharacterDraft): boolean {
  return (
    left.char === right.char &&
    resolveCharacterPinyin(left.char, left.pinyin) === resolveCharacterPinyin(right.char, right.pinyin)
  );
}

function getSharedResultIndexes(
  practiceDrafts: CharacterDraft[],
  record: PracticeResultRecord,
  assessment: CharacterAssessment,
): number[] {
  return practiceDrafts.reduce<number[]>((indexes, draft, index) => {
    if (record.results[draft.char] === assessment) {
      indexes.push(index);
    }

    return indexes;
  }, []);
}

function getSharedUnansweredIndexes(practiceDrafts: CharacterDraft[], record: PracticeResultRecord): number[] {
  return practiceDrafts.reduce<number[]>((indexes, draft, index) => {
    if (!record.results[draft.char]) {
      indexes.push(index);
    }

    return indexes;
  }, []);
}

function createSharedResultAssessments(
  practiceDrafts: CharacterDraft[],
  errorIndexes: number[],
  reviewIndexes: number[],
  unansweredIndexes: number[],
): PracticeResultRecord["results"] {
  const results: PracticeResultRecord["results"] = {};
  const errorSet = new Set(errorIndexes);
  const reviewSet = new Set(reviewIndexes);
  const unansweredSet = new Set(unansweredIndexes);

  practiceDrafts.forEach((draft, index) => {
    if (unansweredSet.has(index)) {
      return;
    }

    if (errorSet.has(index)) {
      results[draft.char] = "unknown";
      return;
    }

    if (reviewSet.has(index)) {
      results[draft.char] = "review";
      return;
    }

    results[draft.char] = "known";
  });

  return results;
}

function createSharedResultId(
  shortValue: string,
  practiceValue: string,
  errorValue: string,
  reviewValue: string | null,
  unansweredValue: string | null,
): string {
  return `shared-${hashString(`${shortValue}|${practiceValue}|${errorValue}|${reviewValue ?? ""}|${unansweredValue ?? ""}`).toString(36)}`;
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
