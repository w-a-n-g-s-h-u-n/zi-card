import { Play, Share2 } from "lucide-react";
import type { ChangeEvent } from "react";
import type { CharacterPreviewItem } from "../../types/character";
import type { OcrPreviewImage, OcrUiState } from "../../types/ocr";
import { Button } from "../../ui/Button";
import { CharacterPreviewList } from "./CharacterPreviewList";
import { ImageOcrPanel } from "./ImageOcrPanel";

type CharacterInputPanelProps = {
  editingRecentKey: string | null;
  inputText: string;
  ocrPreviewImages: OcrPreviewImage[];
  ocrState: OcrUiState;
  previewItems: CharacterPreviewItem[];
  shareStatus: string | null;
  showPinyinChoices: boolean;
  onClearOcr: () => void;
  onConfirmOcr: () => void;
  onImageFilesSelected: (files: File[]) => void;
  onInputChange: (value: string) => void;
  onOcrCandidateChange: (value: string) => void;
  onPinyinChange: (char: string, pinyin: string) => void;
  onPrepareOcr: () => void;
  onRetryOcr: () => void;
  onShare: () => void;
  onStart: () => void;
};

export function CharacterInputPanel({
  editingRecentKey,
  inputText,
  ocrPreviewImages,
  ocrState,
  previewItems,
  shareStatus,
  showPinyinChoices,
  onClearOcr,
  onConfirmOcr,
  onImageFilesSelected,
  onInputChange,
  onOcrCandidateChange,
  onPinyinChange,
  onPrepareOcr,
  onRetryOcr,
  onShare,
  onStart,
}: CharacterInputPanelProps) {
  const canStart = previewItems.length > 0;

  return (
    <div className="input-panel">
      <label className="field-label" htmlFor="character-input">
        {editingRecentKey ? "编辑历史字表" : "本次字表"}
      </label>
      <textarea
        className="character-input"
        id="character-input"
        inputMode="text"
        placeholder="日 月 山 水 火"
        value={inputText}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onInputChange(event.target.value)}
      />

      <ImageOcrPanel
        ocrPreviewImages={ocrPreviewImages}
        ocrState={ocrState}
        onClearOcr={onClearOcr}
        onConfirmOcr={onConfirmOcr}
        onImageFilesSelected={onImageFilesSelected}
        onOcrCandidateChange={onOcrCandidateChange}
        onPrepareOcr={onPrepareOcr}
        onRetryOcr={onRetryOcr}
      />

      <CharacterPreviewList
        previewItems={previewItems}
        showPinyinChoices={showPinyinChoices}
        onPinyinChange={onPinyinChange}
      />

      <div className="input-actions">
        <Button icon={Play} size="large" disabled={!canStart} onClick={onStart}>
          开始
        </Button>
        <Button icon={Share2} variant="quiet" size="large" disabled={!canStart} onClick={onShare}>
          分享
        </Button>
      </div>
      <div className="share-status" aria-live="polite">
        {shareStatus ?? ""}
      </div>
    </div>
  );
}
