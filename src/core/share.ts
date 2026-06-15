import type { CharacterDraft } from "../types/character";
import { joinCharacters } from "../utils/text";
import { getCharacterPinyinOptions } from "./pinyin";

const SHARE_WORDS_PARAM = "w";
const SHARE_SHORT_PARAM = "s";
const SHARE_TITLE = "识字小练习";
const BYTES_PER_DRAFT = 4;
const HAN_CHARACTER_RE = /\p{Script=Han}/u;

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

    const readableValue = url.searchParams.get(SHARE_WORDS_PARAM);

    if (readableValue) {
      return decodeReadableSharedDrafts(readableValue);
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

function decodeReadableSharedDrafts(value: string): CharacterDraft[] {
  const chars = Array.from(value);
  const drafts: CharacterDraft[] = [];

  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];

    if (!HAN_CHARACTER_RE.test(char)) {
      continue;
    }

    const nextChar = chars[index + 1];
    const displayIndex = nextChar ? Number.parseInt(nextChar, 36) : 1;
    const pinyin = displayIndex > 1 ? getCharacterPinyinOptions(char)[displayIndex - 1] : undefined;

    if (pinyin) {
      index += 1;
    }

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
