import type { CharacterPreviewItem } from "../../types/character";
import { CharacterChip } from "../../ui/CharacterChip";

type PolyphonicReadingEditorProps = {
  getPinyinOrigin?: (pinyin: string) => "local" | "shared" | undefined;
  item: CharacterPreviewItem;
  showPinyin: boolean;
  onPinyinChange: (char: string, pinyin: string) => void;
};

export function PolyphonicReadingEditor({
  getPinyinOrigin,
  item,
  showPinyin,
  onPinyinChange,
}: PolyphonicReadingEditorProps) {
  return (
    <div className="polyphonic-reading-editor">
      <CharacterChip char={item.char} pinyin={item.selectedPinyin} showPinyin={showPinyin} />
      <div className="pinyin-choice-row" aria-label={`${item.char} 的读音`}>
        {item.pinyinOptions.map((pinyin) => (
          <button
            className="pinyin-choice"
            data-selected={item.selectedPinyin === pinyin}
            data-origin={getPinyinOrigin?.(pinyin)}
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
