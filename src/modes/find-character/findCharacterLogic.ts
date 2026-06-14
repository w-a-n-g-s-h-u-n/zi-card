import type { CharacterItem } from "../../types/character";
import { shuffleArray, takeRandom } from "../../utils/random";

export type FindCharacterOption = {
  char: string;
  isTarget: boolean;
};

export function createFindCharacterRound(
  target: CharacterItem,
  allItems: CharacterItem[],
  optionCount = 6,
): FindCharacterOption[] {
  const distractors = takeRandom(
    allItems.map((item) => item.char),
    Math.max(optionCount - 1, 0),
    [target.char],
  );

  return shuffleArray([
    {
      char: target.char,
      isTarget: true,
    },
    ...distractors.map((char) => ({
      char,
      isTarget: false,
    })),
  ]);
}
