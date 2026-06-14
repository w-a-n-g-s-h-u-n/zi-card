import type { CharacterDraft, CharacterItem, CharacterPreviewItem } from "../types/character";
import { extractUniqueCharacters, normalizeInput } from "../utils/text";
import { getCharacterPinyinOptions, resolveCharacterPinyin } from "./pinyin";

export function createCharacterItemsFromDrafts(drafts: CharacterDraft[]): CharacterItem[] {
  return drafts.map((draft, index) => ({
    id: `${draft.char}-${index}`,
    char: draft.char,
    pinyin: resolveCharacterPinyin(draft.char, draft.pinyin),
  }));
}

export function getCharacterPreview(sourceText: string): string[] {
  return extractUniqueCharacters(normalizeInput(sourceText));
}

export function createCharacterDrafts(sourceText: string, selectedPinyins: Record<string, string> = {}): CharacterDraft[] {
  return getCharacterPreview(sourceText).map((char) => ({
    char,
    pinyin: selectedPinyins[char],
  }));
}

export function createCharacterPreviewItems(
  sourceText: string,
  selectedPinyins: Record<string, string> = {},
): CharacterPreviewItem[] {
  return getCharacterPreview(sourceText).map((char) => {
    const pinyinOptions = getCharacterPinyinOptions(char);
    const defaultPinyin = pinyinOptions[0];
    const selectedPinyin = resolveCharacterPinyin(char, selectedPinyins[char]);

    return {
      char,
      defaultPinyin,
      pinyin: selectedPinyin,
      pinyinOptions,
      selectedPinyin,
    };
  });
}

export function getSelectedPinyinMap(drafts: CharacterDraft[]): Record<string, string> {
  return drafts.reduce<Record<string, string>>((result, draft) => {
    if (draft.pinyin) {
      result[draft.char] = draft.pinyin;
    }

    return result;
  }, {});
}
