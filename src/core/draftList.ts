import type { CharacterDraft, CharacterItem } from "../types/character";

type CharacterLike = Pick<CharacterDraft, "char">;

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }

  const result = [...items];
  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);

  return result;
}

export function preservePinyinsForOrder(
  orderDrafts: CharacterDraft[],
  pinyinDrafts: CharacterDraft[],
): CharacterDraft[] {
  const pinyinByChar = new Map(pinyinDrafts.map((draft) => [draft.char, draft.pinyin]));

  return orderDrafts.map((draft) => ({
    ...draft,
    pinyin: pinyinByChar.has(draft.char) ? pinyinByChar.get(draft.char) : draft.pinyin,
  }));
}

export function reorderWithinCharacterSubset<T extends CharacterLike>(
  allItems: T[],
  subsetChars: string[],
  fromSubsetIndex: number,
  toSubsetIndex: number,
): T[] {
  const reorderedSubsetChars = moveItem(subsetChars, fromSubsetIndex, toSubsetIndex);

  if (reorderedSubsetChars === subsetChars) {
    return allItems;
  }

  const subsetCharSet = new Set(subsetChars);
  const itemByChar = new Map(allItems.map((item) => [item.char, item]));
  const targetPositions = allItems
    .map((item, index) => (subsetCharSet.has(item.char) ? index : -1))
    .filter((index) => index >= 0);

  if (targetPositions.length !== reorderedSubsetChars.length) {
    return allItems;
  }

  const result = [...allItems];

  targetPositions.forEach((position, index) => {
    const nextItem = itemByChar.get(reorderedSubsetChars[index]);

    if (nextItem) {
      result[position] = nextItem;
    }
  });

  return result;
}

export function createDraftsFromCharacterItems(items: CharacterItem[]): CharacterDraft[] {
  return items.map((item) => ({
    char: item.char,
    pinyin: item.pinyin,
  }));
}
