import type { CharacterDraft } from "../types/character";
import { getCharacterPinyinOptions } from "./pinyin";

const SHARE_WORDS_PARAM = "w";
const HAN_CHARACTER_RE = /\p{Script=Han}/u;

export function getSharedCharacterDraftsFromUrl(href: string): CharacterDraft[] {
  try {
    const url = new URL(href);
    const value = url.searchParams.get(SHARE_WORDS_PARAM);

    if (!value) {
      return [];
    }

    return decodeSharedDrafts(value);
  } catch {
    return [];
  }
}

export function createSharedCharactersUrl(drafts: CharacterDraft[], href: string): string {
  const url = new URL(href);
  const encodedDrafts = encodeSharedDrafts(drafts);
  const query = `${SHARE_WORDS_PARAM}=${encodedDrafts}`;

  return `${url.origin}${url.pathname}?${query}`;
}

function encodeSharedDrafts(drafts: CharacterDraft[]): string {
  return drafts.map((draft) => {
    const options = getCharacterPinyinOptions(draft.char);
    const pinyinIndex = draft.pinyin ? options.indexOf(draft.pinyin) : -1;
    const displayIndex = pinyinIndex + 1;

    if (displayIndex > 1) {
      return `${draft.char}${displayIndex.toString(36)}`;
    }

    return draft.char;
  }).join("");
}

function decodeSharedDrafts(value: string): CharacterDraft[] {
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
