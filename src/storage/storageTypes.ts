import type { PracticeMode } from "../types/mode";
import type { CharacterDraft } from "../types/character";

export type StoredSettings = {
  randomOrder: boolean;
  showPinyin: boolean;
  soundEnabled: boolean;
  mode: PracticeMode;
};

export type StoredData = {
  version: 2;
  recentLists: CharacterDraft[][];
  settings: StoredSettings;
};
