import { Trash2 } from "lucide-react";
import type { CharacterDraft } from "../../types/character";
import type { PracticeResultRecord } from "../../types/result";
import { RecentListsPanel } from "./RecentListsPanel";

type SettingsPanelProps = {
  editingRecentKey: string | null;
  recentLists: CharacterDraft[][];
  resultHistoriesByListIdentity: Record<string, PracticeResultRecord[]>;
  onDeleteRecent: (drafts: CharacterDraft[]) => void;
  onEditRecent: (drafts: CharacterDraft[]) => void;
  onOpenRecentHistory: (drafts: CharacterDraft[]) => void;
  onClearAllCache: () => void;
  onShareRecent: (drafts: CharacterDraft[]) => void;
};

export function SettingsPanel({
  editingRecentKey,
  recentLists,
  resultHistoriesByListIdentity,
  onDeleteRecent,
  onEditRecent,
  onOpenRecentHistory,
  onClearAllCache,
  onShareRecent,
}: SettingsPanelProps) {
  return (
    <aside className="settings-panel">
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
