import { Dice5, Trash2 } from "lucide-react";
import { MODE_CONFIGS, MODE_ICONS } from "../../modes";
import type { CharacterDraft } from "../../types/character";
import type { PracticeResultRecord } from "../../types/result";
import type { PracticeMode } from "../../types/mode";
import type { StoredSettings } from "../../storage/storageTypes";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { Toggle } from "../../ui/Toggle";
import { RecentListsPanel } from "./RecentListsPanel";

type SettingsPanelProps = {
  editingRecentKey: string | null;
  recentLists: CharacterDraft[][];
  resultHistoriesByListIdentity: Record<string, PracticeResultRecord[]>;
  settings: StoredSettings;
  onDeleteRecent: (drafts: CharacterDraft[]) => void;
  onEditRecent: (drafts: CharacterDraft[]) => void;
  onOpenRecentHistory: (drafts: CharacterDraft[]) => void;
  onClearAllCache: () => void;
  onSettingsChange: (settings: StoredSettings) => void;
  onShareRecent: (drafts: CharacterDraft[]) => void;
};

export function SettingsPanel({
  editingRecentKey,
  recentLists,
  resultHistoriesByListIdentity,
  settings,
  onDeleteRecent,
  onEditRecent,
  onOpenRecentHistory,
  onClearAllCache,
  onSettingsChange,
  onShareRecent,
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
      </div>

      <RecentListsPanel
        editingRecentKey={editingRecentKey}
        recentLists={recentLists}
        resultHistoriesByListIdentity={resultHistoriesByListIdentity}
        onDeleteRecent={onDeleteRecent}
        onEditRecent={onEditRecent}
        onOpenRecentHistory={onOpenRecentHistory}
        onShareRecent={onShareRecent}
      />

      <button
        className="clear-cache-button"
        title="清理全部缓存"
        type="button"
        onClick={onClearAllCache}
      >
        <Trash2 aria-hidden="true" size={19} />
        <span>清理全部缓存</span>
      </button>
    </aside>
  );
}
