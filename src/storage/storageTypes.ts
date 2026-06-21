import type { PracticeMode } from "../types/mode";
import type { CharacterDraft } from "../types/character";
import type { PracticeResultRecord } from "../types/result";

export type CharacterFont = "sans" | "kai" | "handwriting";

export type StoredSettings = {
  characterFont: CharacterFont;
  randomOrder: boolean;
  showPinyin: boolean;
  soundEnabled: boolean;
  mode: PracticeMode;
};

export type StoredData = {
  version: 2;
  recentLists: CharacterDraft[][];
  resultHistoriesByListIdentity: Record<string, PracticeResultRecord[]>;
  settings: StoredSettings;
};
