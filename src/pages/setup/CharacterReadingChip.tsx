import type { CharacterPreviewItem } from "../../types/character";
import { CharacterChip } from "../../ui/CharacterChip";

type SingleReadingCharacterChipProps = {
  item: CharacterPreviewItem;
  showPinyin: boolean;
};

export function SingleReadingCharacterChip({ item, showPinyin }: SingleReadingCharacterChipProps) {
  return <CharacterChip char={item.char} pinyin={item.selectedPinyin} showPinyin={showPinyin} />;
}
