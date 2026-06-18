import { BookOpenText, Brush, Dice5, Eye, Type, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MODE_CONFIGS, MODE_ICONS } from "../../modes";
import type { CharacterDraft } from "../../types/character";
import type { PracticeMode } from "../../types/mode";
import type { CharacterFont, StoredSettings } from "../../storage/storageTypes";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { Toggle } from "../../ui/Toggle";
import { RecentListsPanel } from "./RecentListsPanel";

const CHARACTER_FONT_OPTIONS: Array<{ value: CharacterFont; label: string; icon: LucideIcon }> = [
  { value: "sans", label: "标准", icon: Type },
  { value: "kai", label: "楷体", icon: BookOpenText },
  { value: "handwriting", label: "手写", icon: Brush },
];

type SettingsPanelProps = {
  editingRecentKey: string | null;
  recentLists: CharacterDraft[][];
  settings: StoredSettings;
  onDeleteRecent: (drafts: CharacterDraft[]) => void;
  onEditRecent: (drafts: CharacterDraft[]) => void;
  onSettingsChange: (settings: StoredSettings) => void;
  onShareRecent: (drafts: CharacterDraft[]) => void;
  onUseRecent: (drafts: CharacterDraft[]) => void;
};

export function SettingsPanel({
  editingRecentKey,
  recentLists,
  settings,
  onDeleteRecent,
  onEditRecent,
  onSettingsChange,
  onShareRecent,
  onUseRecent,
}: SettingsPanelProps) {
  function updateSettings(patch: Partial<StoredSettings>) {
    onSettingsChange({
      ...settings,
      ...patch,
    });
  }

  return (
    <aside className="settings-panel">
      <SegmentedControl<PracticeMode>
        label="练习模式"
        value={settings.mode}
        onChange={(mode) => updateSettings({ mode })}
        options={MODE_CONFIGS.map((config) => ({
          value: config.id,
          label: config.shortLabel,
          icon: MODE_ICONS[config.id],
        }))}
      />

      <div className="toggle-group">
        <Toggle
          checked={settings.randomOrder}
          icon={<Dice5 aria-hidden="true" size={21} />}
          label="随机"
          onCheckedChange={(randomOrder) => updateSettings({ randomOrder })}
        />
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

      <RecentListsPanel
        editingRecentKey={editingRecentKey}
        recentLists={recentLists}
        onDeleteRecent={onDeleteRecent}
        onEditRecent={onEditRecent}
        onShareRecent={onShareRecent}
        onUseRecent={onUseRecent}
      />
    </aside>
  );
}
