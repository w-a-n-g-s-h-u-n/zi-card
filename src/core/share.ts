import type { CharacterDraft } from "../types/character";

const SHARE_LIST_PARAM = "list";

export function getSharedCharacterDraftsFromUrl(href: string): CharacterDraft[] {
  try {
    const url = new URL(href);
    const value = url.searchParams.get(SHARE_LIST_PARAM);

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value) as CharacterDraft[];
    return Array.isArray(parsed) ? parsed.filter(isCharacterDraft) : [];
  } catch {
    return [];
  }
}

export function createSharedCharactersUrl(drafts: CharacterDraft[], href: string): string {
  const url = new URL(href);

  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARE_LIST_PARAM, JSON.stringify(drafts));

  return url.toString();
}

function isCharacterDraft(value: unknown): value is CharacterDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Partial<CharacterDraft>;
  return typeof draft.char === "string" && (draft.pinyin === undefined || typeof draft.pinyin === "string");
}
