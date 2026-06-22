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
            const records = resultHistoriesByListIdentity[key] ?? [];
            const historySummary = getHistorySummary(records);

            return (
              <div className="recent-item" data-editing={editingRecentKey === key} key={key}>
                <button
                  aria-label={`编辑字表 ${text}`}
                  className="recent-card-action"
                  title="编辑字表"
                  type="button"
                  onClick={() => onEditRecent(drafts)}
                />
                <span className="recent-characters" aria-label={text}>
                  {text}
                </span>
                <small className="recent-meta">
                  <span>{drafts.length} 字</span>
                  {historySummary ? <span>{historySummary}</span> : null}
                </small>
                <div className="recent-row-actions">
                  {records.length > 0 ? (
                    <button
                      aria-label={`查看字表 ${text} 的识字结果历史`}
                      className="recent-icon-action"
                      title="历史"
                      type="button"
                      onClick={() => onOpenRecentHistory(drafts)}
                    >
                      <History aria-hidden="true" size={18} />
                    </button>
                  ) : null}
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

function getHistorySummary(records: PracticeResultRecord[]): string | null {
  if (records.length === 0) {
    return null;
  }

  const latest = records[0];
  const stats = getResultRecordStats(latest);

  return `${records.length} 次 · ${stats.passRate}%`;
}
