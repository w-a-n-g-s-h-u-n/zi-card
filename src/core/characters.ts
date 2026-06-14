import type { CharacterItem } from "../types/character";
import { extractUniqueCharacters, normalizeInput } from "../utils/text";
import { getCharacterPinyin } from "./pinyin";

export function createCharacterItems(sourceText: string): CharacterItem[] {
  return extractUniqueCharacters(sourceText).map((char, index) => ({
    id: `${char}-${index}`,
    char,
    pinyin: getCharacterPinyin(char),
  }));
}

export function getCharacterPreview(sourceText: string): string[] {
  return extractUniqueCharacters(normalizeInput(sourceText));
}
