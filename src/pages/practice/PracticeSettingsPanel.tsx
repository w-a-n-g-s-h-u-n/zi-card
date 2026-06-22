import { BookOpenText, Brush, Eye, Pencil, Type, Volume2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CharacterPreviewItem } from "../../types/character";
import type { CharacterFont, StoredSettings } from "../../storage/storageTypes";
import { IconButton } from "../../ui/IconButton";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { Toggle } from "../../ui/Toggle";
import { CharacterPreviewList } from "../setup/CharacterPreviewList";

const CHARACTER_FONT_OPTIONS: Array<{ value: CharacterFont; label: string; icon: LucideIcon }> = [
  { value: "sans", label: "标准", icon: Type },
  { value: "kai", label: "楷体", icon: BookOpenText },
  { value: "handwriting", label: "手写", icon: Brush },
];

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

  const hasPolyphonicPreview = previewItems.some((item) => item.pinyinOptions.length > 1);

  function updateSettings(patch: Partial<StoredSettings>) {
    onSettingsChange({
      ...settings,
      ...patch,
    });
  }

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

        <div className="toggle-group practice-toggle-group">
          <Toggle
            checked={settings.showPinyin}
            icon={<Eye aria-hidden="true" size={21} />}
            label="拼音"
            onCheckedChange={(showPinyin) => updateSettings({ showPinyin })}
          />
          <Toggle
            checked={settings.soundEnabled}
            icon={<Volume2 aria-hidden="true" size={21} />}
            label="音效"
            onCheckedChange={(soundEnabled) => updateSettings({ soundEnabled })}
          />
        </div>

        <SegmentedControl<CharacterFont>
          label="汉字字形"
          value={settings.characterFont}
          onChange={(characterFont) => updateSettings({ characterFont })}
          options={CHARACTER_FONT_OPTIONS}
        />

        <div className="practice-draft-editor">
          <div className="preview-heading">
            <span>当前字表</span>
            <strong>{previewItems.length} 个字</strong>
            {hasPolyphonicPreview ? (
              <button
                className="preview-edit-toggle"
                data-active={showPinyinChoices}
                type="button"
                onClick={onTogglePinyinEdit}
              >
                <Pencil aria-hidden="true" size={17} />
                <span>{showPinyinChoices ? "收起读音" : "编辑读音"}</span>
              </button>
            ) : null}
          </div>
          <CharacterPreviewList
            previewItems={previewItems}
            showPinyinChoices={showPinyinChoices}
            onPinyinChange={onPinyinChange}
            onReorder={onReorderDrafts}
          />
        </div>
      </section>
    </div>
  );
}
