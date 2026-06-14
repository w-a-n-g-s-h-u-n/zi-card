import type { StoredData, StoredSettings } from "./storageTypes";

const STORAGE_KEY = "character-practice:v1";

export const DEFAULT_SETTINGS: StoredSettings = {
  randomOrder: false,
  showPinyin: true,
  soundEnabled: true,
  mode: "flashcard",
};

const DEFAULT_DATA: StoredData = {
  version: 1,
  recentLists: [],
  settings: DEFAULT_SETTINGS,
};

export function readStoredData(): StoredData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_DATA;
    }

    const parsed = JSON.parse(raw) as Partial<StoredData>;

    if (parsed.version !== 1) {
      return DEFAULT_DATA;
    }

    return {
      version: 1,
      recentLists: Array.isArray(parsed.recentLists) ? parsed.recentLists.slice(0, 6) : [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {}),
      },
    };
  } catch {
    return DEFAULT_DATA;
  }
}

export function writeStoredData(data: StoredData): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveSettings(settings: StoredSettings): void {
  const current = readStoredData();
  writeStoredData({
    ...current,
    settings,
  });
}

export function saveRecentList(chars: string[], replaceKey?: string): void {
  const current = readStoredData();
  const key = getRecentListKey(chars);
  const recentLists = [
    chars,
    ...current.recentLists.filter((item) => {
      const itemKey = getRecentListKey(item);
      return itemKey !== key && itemKey !== replaceKey;
    }),
  ].slice(0, 6);

  writeStoredData({
    ...current,
    recentLists,
  });
}

export function deleteRecentList(key: string): void {
  const current = readStoredData();

  writeStoredData({
    ...current,
    recentLists: current.recentLists.filter((item) => getRecentListKey(item) !== key),
  });
}

export function getRecentListKey(chars: string[]): string {
  return chars.join("");
}
