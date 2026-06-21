import type { CharacterDraft, CharacterPreviewItem } from "../types/character";
import type { StoredSettings } from "../storage/storageTypes";
import type { OcrPreviewImage, OcrUiState } from "../types/ocr";
import type { PracticeResultRecord } from "../types/result";
import { CharacterInputPanel } from "./setup/CharacterInputPanel";
import { SettingsPanel } from "./setup/SettingsPanel";

type SetupPageProps = {
  inputText: string;
  ocrPreviewImages: OcrPreviewImage[];
  ocrState: OcrUiState;
  settings: StoredSettings;
  recentLists: CharacterDraft[][];
  resultHistoriesByListIdentity: Record<string, PracticeResultRecord[]>;
  previewItems: CharacterPreviewItem[];
  showPinyinChoices: boolean;
  onInputChange: (value: string) => void;
  onPinyinChange: (char: string, pinyin: string) => void;
  onSettingsChange: (settings: StoredSettings) => void;
  onUseRecent: (drafts: CharacterDraft[]) => void;
  onEditRecent: (drafts: CharacterDraft[]) => void;
  onDeleteRecent: (drafts: CharacterDraft[]) => void;
  onOpenRecentHistory: (drafts: CharacterDraft[]) => void;
  onClearOcr: () => void;
  onConfirmOcr: () => void;
  onImageFilesSelected: (files: File[]) => void;
  onOcrCandidateChange: (value: string) => void;
  onPrepareOcr: () => void;
  onRetryOcr: () => void;
  onShareRecent: (drafts: CharacterDraft[]) => void;
  editingRecentKey: string | null;
  shareStatus: string | null;
  onShare: () => void;
  onStart: () => void;
};

export function SetupPage({
  inputText,
  ocrPreviewImages,
  ocrState,
  settings,
  recentLists,
  resultHistoriesByListIdentity,
  previewItems,
  showPinyinChoices,
  onInputChange,
  onPinyinChange,
  onSettingsChange,
  onUseRecent,
  onEditRecent,
  onOpenRecentHistory,
  onImageFilesSelected,
  onClearOcr,
  onConfirmOcr,
  onDeleteRecent,
  onOcrCandidateChange,
  onPrepareOcr,
  onRetryOcr,
  onShareRecent,
  editingRecentKey,
  shareStatus,
  onShare,
  onStart,
}: SetupPageProps) {
  return (
    <main className="setup-page">
      <section className="setup-hero">
        <div className="brand-mark" aria-hidden="true">
          字
        </div>
        <div>
          <h1>识字小练习</h1>
          <p>{previewItems.length > 0 ? `${previewItems.length} 个字` : "录入本次字表"}</p>
        </div>
      </section>

      <section className="setup-grid">
        <CharacterInputPanel
          editingRecentKey={editingRecentKey}
          inputText={inputText}
          ocrPreviewImages={ocrPreviewImages}
          ocrState={ocrState}
          previewItems={previewItems}
          shareStatus={shareStatus}
          showPinyinChoices={showPinyinChoices}
          onClearOcr={onClearOcr}
          onConfirmOcr={onConfirmOcr}
          onImageFilesSelected={onImageFilesSelected}
          onInputChange={onInputChange}
          onOcrCandidateChange={onOcrCandidateChange}
          onPinyinChange={onPinyinChange}
          onPrepareOcr={onPrepareOcr}
          onRetryOcr={onRetryOcr}
          onShare={onShare}
          onStart={onStart}
        />

        <SettingsPanel
          editingRecentKey={editingRecentKey}
          recentLists={recentLists}
          resultHistoriesByListIdentity={resultHistoriesByListIdentity}
          settings={settings}
          onDeleteRecent={onDeleteRecent}
          onEditRecent={onEditRecent}
          onOpenRecentHistory={onOpenRecentHistory}
          onSettingsChange={onSettingsChange}
          onShareRecent={onShareRecent}
          onUseRecent={onUseRecent}
        />
      </section>
    </main>
  );
}
