import { pinyin } from "pinyin-pro";

export function getCharacterPinyinOptions(char: string): string[] {
  const values = pinyin(char, {
    multiple: true,
    toneType: "symbol",
    type: "array",
  });

  return [...new Set(values)].filter(Boolean);
}

export function resolveCharacterPinyin(char: string, selectedPinyin?: string): string | undefined {
  const options = getCharacterPinyinOptions(char);

  if (selectedPinyin && options.includes(selectedPinyin)) {
    return selectedPinyin;
  }

  return options[0] || undefined;
}
