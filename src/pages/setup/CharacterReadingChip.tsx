import type { CharacterPreviewItem } from "../../types/character";

type SingleReadingCharacterChipProps = {
  item: CharacterPreviewItem;
};

type PolyphonicReadingCharacterChipProps = {
  item: CharacterPreviewItem;
  onPinyinChange: (char: string, pinyin: string) => void;
};

function CharacterReadingMain({ item }: SingleReadingCharacterChipProps) {
  return (
    <div className="character-chip-main">
      <span className="character-chip-pinyin">{item.selectedPinyin}</span>
      <span className="character-chip-char">{item.char}</span>
    </div>
  );
}

export function SingleReadingCharacterChip({ item }: SingleReadingCharacterChipProps) {
  return (
    <div className="character-chip">
      <CharacterReadingMain item={item} />
    </div>
  );
}

export function PolyphonicReadingCharacterChip({ item, onPinyinChange }: PolyphonicReadingCharacterChipProps) {
  return (
    <div className="character-chip" data-polyphonic="true">
      <CharacterReadingMain item={item} />
      <div className="pinyin-choice-row" aria-label={`${item.char} 的读音`}>
        {item.pinyinOptions.map((pinyin) => (
          <button
            className="pinyin-choice"
            data-selected={item.selectedPinyin === pinyin}
            key={pinyin}
            type="button"
            onClick={() => onPinyinChange(item.char, pinyin)}
          >
            {pinyin}
          </button>
        ))}
      </div>
    </div>
  );
}
