import { Pencil, Play, Share2 } from "lucide-react";
import type { ChangeEvent } from "react";
import type { StoredSettings } from "../../storage/storageTypes";
import type { CharacterPreviewItem } from "../../types/character";
import type { OcrPreviewImage, OcrUiState } from "../../types/ocr";
import { Button } from "../../ui/Button";
import { DisplaySettingsButton } from "../../ui/DisplaySettingsButton";
import { PracticeGeneralSettings } from "../../ui/PracticeGeneralSettings";
import { CharacterPreviewList } from "./CharacterPreviewList";
import { ImageOcrPanel } from "./ImageOcrPanel";

type CharacterInputPanelProps = {
  editingRecentKey: string | null;
  inputText: string;
  ocrPreviewImages: OcrPreviewImage[];
  ocrState: OcrUiState;
  isOcrAvailable: boolean;
  isEditingSelectedRecent: boolean;
  previewItems: CharacterPreviewItem[];
  settings: StoredSettings;
  shareStatus: string | null;
  showPinyinChoices: boolean;
  onClearOcr: () => void;
  onConfirmOcr: () => void;
  onImageFilesSelected: (files: File[]) => void;
  onInputChange: (value: string) => void;
  onOcrCandidateChange: (value: string) => void;
  onPinyinChange: (char: string, pinyin: string) => void;
  onEditSelectedRecent: () => void;
  onPrepareOcr: () => void;
  onReorderPreviewItems: (fromIndex: number, toIndex: number) => void;
  onRetryOcr: () => void;
  onSettingsChange: (settings: StoredSettings) => void;
  onShare: () => void;
  onTogglePinyinEdit: () => void;
  onStart: () => void;
};

export function CharacterInputPanel({
  editingRecentKey,
  inputText,
  ocrPreviewImages,
  ocrState,
  isOcrAvailable,
  isEditingSelectedRecent,
  previewItems,
  settings,
  shareStatus,
  showPinyinChoices,
  onClearOcr,
  onConfirmOcr,
  onImageFilesSelected,
  onInputChange,
  onOcrCandidateChange,
  onPinyinChange,
  onEditSelectedRecent,
  onPrepareOcr,
  onReorderPreviewItems,
  onRetryOcr,
  onSettingsChange,
  onShare,
  onTogglePinyinEdit,
  onStart,
}: CharacterInputPanelProps) {
  const canStart = previewItems.length > 0;
  const hasPreview = previewItems.length > 0;
  const isRecentSelected = Boolean(editingRecentKey);
  const showInputEditor = !isRecentSelected || isEditingSelectedRecent;
  const canEditPreview = showInputEditor;
  const polyphonicPreviewCount = previewItems.filter((item) => item.pinyinOptions.length > 1).length;
  const hasPolyphonicPreview = polyphonicPreviewCount > 0;
  const effectiveShowPinyinChoices = hasPolyphonicPreview && showPinyinChoices;
  const previewCountLabel = effectiveShowPinyinChoices
    ? `${polyphonicPreviewCount} 个多音字`
    : `${previewItems.length} 个字`;

  return (
    <div className="input-panel">
      {showInputEditor ? (
        <div className="character-input-shell">
          <label className="field-label" htmlFor="character-input">
            {editingRecentKey ? "编辑历史字表" : "本次字表"}
          </label>

          <ImageOcrPanel
            isOcrAvailable={isOcrAvailable}
            ocrPreviewImages={ocrPreviewImages}
            ocrState={ocrState}
            onClearOcr={onClearOcr}
            onConfirmOcr={onConfirmOcr}
            onImageFilesSelected={onImageFilesSelected}
            onOcrCandidateChange={onOcrCandidateChange}
            onPrepareOcr={onPrepareOcr}
            onRetryOcr={onRetryOcr}
          />

          <textarea
            className="character-input"
            id="character-input"
            inputMode="text"
            placeholder="日 月 山 水 火"
            value={inputText}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onInputChange(event.target.value)}
          />
        </div>
      ) : null}

      {hasPreview ? (
        <div className="preview-panel">
          <div className="preview-heading">
            <span>字表预览</span>
            <strong>{previewCountLabel}</strong>
            <DisplaySettingsButton>
              <PracticeGeneralSettings
                settings={settings}
                showRandomOrder
                onSettingsChange={onSettingsChange}
              />
              {isRecentSelected && !showInputEditor ? (
                <button
                  className="preview-edit-toggle"
                  type="button"
                  onClick={onEditSelectedRecent}
                >
                  <Pencil aria-hidden="true" size={17} />
                  <span>编辑字表</span>
                </button>
              ) : null}
              {hasPolyphonicPreview ? (
                <button
                  className="preview-edit-toggle"
                  data-active={effectiveShowPinyinChoices}
                  type="button"
                  onClick={onTogglePinyinEdit}
                >
                  <Pencil aria-hidden="true" size={17} />
                  <span>{effectiveShowPinyinChoices ? "收起读音" : "编辑读音"}</span>
                </button>
              ) : null}
            </DisplaySettingsButton>
          </div>
          <CharacterPreviewList
            previewItems={previewItems}
            showPinyin={settings.showPinyin}
            showPinyinChoices={effectiveShowPinyinChoices}
            onPinyinChange={onPinyinChange}
            onReorder={canEditPreview ? onReorderPreviewItems : undefined}
          />
        </div>
      ) : null}

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
