import { pinyin } from "pinyin-pro";

export function getCharacterPinyin(char: string): string | undefined {
  const [value] = pinyin(char, {
    toneType: "symbol",
    type: "array",
  });

  return value || undefined;
}
