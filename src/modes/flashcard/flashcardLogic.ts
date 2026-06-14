import type { CharacterItem } from "../../types/character";

export function getFlashcardPrompt(item: CharacterItem | undefined): string {
  return item ? item.char : "";
}
