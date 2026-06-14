import type { CharacterItem } from "../types/character";
import type { PracticeSession } from "../types/session";

export function getReviewItems(session: PracticeSession): CharacterItem[] {
  return session.items.filter((item) => {
    const result = session.results[item.char];
    return result === "unknown" || result === "review";
  });
}
