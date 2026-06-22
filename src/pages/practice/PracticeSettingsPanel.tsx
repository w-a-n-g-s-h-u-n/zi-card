import { Pencil, X } from "lucide-react";
import type { CharacterPreviewItem } from "../../types/character";
import type { StoredSettings } from "../../storage/storageTypes";
import { IconButton } from "../../ui/IconButton";
import { PracticeGeneralSettings } from "../../ui/PracticeGeneralSettings";
import { CharacterPreviewList } from "../setup/CharacterPreviewList";

type PracticeSettingsPanelProps = {
  open: boolean;
  previewItems: CharacterPreviewItem[];
  settings: StoredSettings;
  showPinyinChoices: boolean;
  onClose: () => void;
  onPinyinChange: (char: string, pinyin: string) => void;
  onReorderDrafts: (fromIndex: number, toIndex: number) => void;
  onSettingsChange: (settings: StoredSettings) => void;
  onTogglePinyinEdit: () => void;
};

export function PracticeSettingsPanel({
  open,
  previewItems,
  settings,
  showPinyinChoices,
  onClose,
  onPinyinChange,
  onReorderDrafts,
  onSettingsChange,
  onTogglePinyinEdit,
}: PracticeSettingsPanelProps) {
  if (!open) {
    return null;
  }

  const polyphonicPreviewCount = previewItems.filter((item) => item.pinyinOptions.length > 1).length;
  const hasPolyphonicPreview = polyphonicPreviewCount > 0;
  const effectiveShowPinyinChoices = hasPolyphonicPreview && showPinyinChoices;
  const previewCountLabel = effectiveShowPinyinChoices
    ? `${polyphonicPreviewCount} 个多音字`
    : `${previewItems.length} 个字`;

  return (
    <div className="practice-settings-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-labelledby="practice-settings-title"
        aria-modal="true"
        className="practice-settings-sheet"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="practice-settings-header">
          <h2 id="practice-settings-title">练习设置</h2>
          <IconButton icon={X} label="关闭" title="关闭" variant="quiet" onClick={onClose} />
        </header>

        <PracticeGeneralSettings settings={settings} onSettingsChange={onSettingsChange} />

        <div className="practice-draft-editor">
          <div className="preview-heading">
            <span>当前字表</span>
            <strong>{previewCountLabel}</strong>
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
          </div>
          <CharacterPreviewList
            previewItems={previewItems}
            showPinyin={settings.showPinyin}
            showPinyinChoices={effectiveShowPinyinChoices}
            onPinyinChange={onPinyinChange}
            onReorder={onReorderDrafts}
          />
        </div>
      </section>
    </div>
  );
}
