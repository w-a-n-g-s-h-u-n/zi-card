import type { PracticeMode } from "../types/mode";

export type StoredSettings = {
  randomOrder: boolean;
  showPinyin: boolean;
  soundEnabled: boolean;
  mode: PracticeMode;
};

export type StoredData = {
  version: 1;
  recentLists: string[][];
  settings: StoredSettings;
};
