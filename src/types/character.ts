export type CharacterDraft = {
  char: string;
  pinyin?: string;
};

export type CharacterPreviewItem = CharacterDraft & {
  defaultPinyin?: string;
  pinyinOptions: string[];
  selectedPinyin?: string;
};

export type CharacterItem = {
  id: string;
  char: string;
  pinyin?: string;
  words?: string[];
};
