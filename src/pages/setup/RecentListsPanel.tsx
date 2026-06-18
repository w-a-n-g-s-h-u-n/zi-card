import { BookOpenText, CheckCircle2, ListRestart, Pencil, Share2, Trash2 } from "lucide-react";
import type { CharacterDraft } from "../../types/character";
import { getRecentListKey } from "../../storage/localStorage";
import { joinCharacters } from "../../utils/text";

type RecentListsPanelProps = {
  editingRecentKey: string | null;
  recentLists: CharacterDraft[][];
  onDeleteRecent: (drafts: CharacterDraft[]) => void;
  onEditRecent: (drafts: CharacterDraft[]) => void;
  onShareRecent: (drafts: CharacterDraft[]) => void;
  onUseRecent: (drafts: CharacterDraft[]) => void;
};

export function RecentListsPanel({
  editingRecentKey,
  recentLists,
  onDeleteRecent,
  onEditRecent,
  onShareRecent,
  onUseRecent,
}: RecentListsPanelProps) {
  return (
    <div className="recent-panel">
      <div className="section-heading">
        <ListRestart aria-hidden="true" size={20} />
        <span>最近字表</span>
      </div>
      {recentLists.length === 0 ? (
        <div className="empty-recent">
          <BookOpenText aria-hidden="true" size={22} />
          <span>暂无记录</span>
        </div>
      ) : (
        <div className="recent-list">
          {recentLists.map((drafts) => {
            const key = getRecentListKey(drafts);
            const text = joinCharacters(drafts.map((draft) => draft.char));

            return (
              <div className="recent-item" data-editing={editingRecentKey === key} key={key}>
                <button className="recent-main-action" title="使用" type="button" onClick={() => onUseRecent(drafts)}>
                  <CheckCircle2 aria-hidden="true" size={18} />
                  <span>{text}</span>
                </button>
                <div className="recent-row-actions">
                  <button
                    aria-label={`编辑字表 ${text}`}
                    className="recent-icon-action"
                    title="编辑"
                    type="button"
                    onClick={() => onEditRecent(drafts)}
                  >
                    <Pencil aria-hidden="true" size={18} />
                  </button>
                  <button
                    aria-label={`分享字表 ${text}`}
                    className="recent-icon-action"
                    title="分享"
                    type="button"
                    onClick={() => onShareRecent(drafts)}
                  >
                    <Share2 aria-hidden="true" size={18} />
                  </button>
                  <button
                    aria-label={`删除字表 ${text}`}
                    className="recent-icon-action recent-icon-action--danger"
                    title="删除"
                    type="button"
                    onClick={() => onDeleteRecent(drafts)}
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
