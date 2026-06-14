import type { CharacterItem } from "../types/character";
import { shuffleArray } from "../utils/random";

export function orderItems(items: CharacterItem[], randomOrder: boolean): CharacterItem[] {
  return randomOrder ? shuffleArray(items) : [...items];
}
