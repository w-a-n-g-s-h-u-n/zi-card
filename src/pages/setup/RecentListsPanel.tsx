import { BookOpenText, History, ListRestart, Share2, Trash2 } from "lucide-react";
import { getCharacterListIdentity, getResultRecordStats } from "../../core/resultHistory";
import type { CharacterDraft } from "../../types/character";
import type { PracticeResultRecord } from "../../types/result";
import { joinCharacters } from "../../utils/text";

type RecentListsPanelProps = {
  editingRecentKey: string | null;
  recentLists: CharacterDraft[][];
  resultHistoriesByListIdentity: Record<string, PracticeResultRecord[]>;
  onDeleteRecent: (drafts: CharacterDraft[]) => void;
  onEditRecent: (drafts: CharacterDraft[]) => void;
  onOpenRecentHistory: (drafts: CharacterDraft[]) => void;
  onShareRecent: (drafts: CharacterDraft[]) => void;
};

export function RecentListsPanel({
  editingRecentKey,
  recentLists,
  resultHistoriesByListIdentity,
  onDeleteRecent,
  onEditRecent,
  onOpenRecentHistory,
  onShareRecent,
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
            const key = getCharacterListIdentity(drafts);
            const text = joinCharacters(drafts.map((draft) => draft.char));
            const historySummary = getHistorySummary(resultHistoriesByListIdentity[key] ?? []);
            const previewDrafts = drafts.slice(0, 12);
            const hiddenCount = drafts.length - previewDrafts.length;

            return (
              <div className="recent-item" data-editing={editingRecentKey === key} key={key}>
                <button
                  className="recent-main-action"
                  title="选择编辑"
                  type="button"
                  onClick={() => onEditRecent(drafts)}
                >
                  <BookOpenText aria-hidden="true" size={18} />
                  <span className="recent-main-copy">
                    <span className="recent-main-title">
                      <strong>字表</strong>
                      <small>{drafts.length} 个字</small>
                    </span>
                    <span className="recent-preview-strip" aria-label={text}>
                      {previewDrafts.map((draft) => (
                        <span className="recent-preview-char" key={draft.char}>
                          {draft.char}
                        </span>
                      ))}
                      {hiddenCount > 0 ? <span className="recent-preview-more">+{hiddenCount}</span> : null}
                    </span>
                    <small>{historySummary}</small>
                  </span>
                </button>
                <div className="recent-row-actions">
                  <button
                    aria-label={`查看字表 ${text} 的识字结果历史`}
                    className="recent-icon-action"
                    title="历史"
                    type="button"
                    onClick={() => onOpenRecentHistory(drafts)}
                  >
                    <History aria-hidden="true" size={18} />
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

function getHistorySummary(records: PracticeResultRecord[]): string {
  if (records.length === 0) {
    return "暂无识字结果";
  }

  const latest = records[0];
  const stats = getResultRecordStats(latest);

  return `${records.length} 条结果 · 最近 ${stats.passRate}%`;
}
