import type { CharacterPreviewItem } from "../../types/character";
import { PolyphonicReadingCharacterChip, SingleReadingCharacterChip } from "./CharacterReadingChip";

type CharacterPreviewListProps = {
  previewItems: CharacterPreviewItem[];
  showPinyinChoices: boolean;
  onPinyinChange: (char: string, pinyin: string) => void;
};

export function CharacterPreviewList({
  previewItems,
  showPinyinChoices,
  onPinyinChange,
}: CharacterPreviewListProps) {
  return (
    <div className="preview-row" aria-label="字表预览">
      {previewItems.length === 0 ? (
        <span className="empty-preview">等待录入</span>
      ) : (
        previewItems.map((item) => {
          if (showPinyinChoices && item.pinyinOptions.length > 1) {
            return <PolyphonicReadingCharacterChip item={item} key={item.char} onPinyinChange={onPinyinChange} />;
          }

          return <SingleReadingCharacterChip item={item} key={item.char} />;
        })
      )}
    </div>
  );
}
