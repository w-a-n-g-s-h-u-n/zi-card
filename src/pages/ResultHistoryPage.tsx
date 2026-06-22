import { ArrowLeft, BookOpenText, ClipboardList, Eye, Trash2 } from "lucide-react";
import { getResultRecordDraftGroups, getResultRecordStats } from "../core/resultHistory";
import type { CharacterDraft } from "../types/character";
import type { PracticeResultRecord } from "../types/result";
import { Button } from "../ui/Button";
import { CharacterChip, type CharacterChipTone } from "../ui/CharacterChip";
import { joinCharacters } from "../utils/text";

type ResultHistoryPageProps = {
  drafts: CharacterDraft[];
  records: PracticeResultRecord[];
  onBack: () => void;
  onDeleteRecord: (record: PracticeResultRecord) => void;
  onOpenRecord: (record: PracticeResultRecord) => void;
  onPracticeList: (drafts: CharacterDraft[]) => void;
};

export function ResultHistoryPage({
  drafts,
  records,
  onBack,
  onDeleteRecord,
  onOpenRecord,
  onPracticeList,
}: ResultHistoryPageProps) {
  const titleText = joinCharacters(drafts.map((draft) => draft.char));

  return (
    <main className="result-history-page">
      <section className="history-hero" aria-labelledby="history-title">
        <Button icon={ArrowLeft} variant="quiet" onClick={onBack}>
          返回
        </Button>
        <div>
          <p className="result-eyebrow">识字结果历史</p>
          <h1 id="history-title">{records.length} 条记录</h1>
          <p className="history-source">{titleText || "当前字表"}</p>
        </div>
        <Button icon={BookOpenText} variant="quiet" onClick={() => onPracticeList(drafts)}>
          练原字表
        </Button>
      </section>

      {records.length === 0 ? (
        <section className="history-empty">
          <ClipboardList aria-hidden="true" size={28} />
          <span>暂无识字结果</span>
        </section>
      ) : (
        <section className="history-list" aria-label="识字结果历史">
          {records.map((record) => {
            const stats = getResultRecordStats(record);
            const previewItems = getHistoryPreviewItems(record);

            return (
              <article className="history-record" key={record.id}>
                <button
                  aria-label={`查看 ${formatDateTime(record.updatedAt)} 的识字结果详情`}
                  className="history-card-action"
                  title="查看详情"
                  type="button"
                  onClick={() => onOpenRecord(record)}
                />
                <div className="history-record-main">
                  <div>
                    <p className="history-record-date">{formatDateTime(record.updatedAt)}</p>
                    <p className="history-record-meta">
                      已练 {stats.practiced}/{stats.total}
                    </p>
                  </div>
                  <div className="history-record-rate">{stats.passRate}%</div>
                </div>
                <div className="history-record-preview" aria-label="待关注预览">
                  {previewItems.items.length > 0 ? (
                    <>
                      {previewItems.items.map((item) => (
                        <CharacterChip
                          char={item.draft.char}
                          key={`${item.tone}-${item.draft.char}`}
                          pinyin={item.draft.pinyin}
                          showPinyin={false}
                          tone={item.tone}
                          variant="result"
                        />
                      ))}
                      {previewItems.hiddenCount > 0 ? (
                        <span className="history-preview-more">+{previewItems.hiddenCount}</span>
                      ) : null}
                    </>
                  ) : (
                    <span className="history-preview-empty">没有待关注字</span>
                  )}
                </div>
                <div className="history-record-footer">
                  <div className="history-record-stats" aria-label="结果统计">
                    <span data-tone="red">错 {stats.unknownCount}</span>
                    <span data-tone="yellow">巩固 {stats.reviewOnlyCount}</span>
                    <span data-tone="green">对 {stats.knownCount}</span>
                  </div>
                  <div className="history-record-actions">
                    <button
                      aria-label={`查看 ${formatDateTime(record.updatedAt)} 的识字结果详情`}
                      className="recent-icon-action"
                      title="查看详情"
                      type="button"
                      onClick={() => onOpenRecord(record)}
                    >
                      <Eye aria-hidden="true" size={18} />
                    </button>
                    <button
                      aria-label={`删除 ${formatDateTime(record.updatedAt)} 的识字结果`}
                      className="recent-icon-action recent-icon-action--danger"
                      title="删除"
                      type="button"
                      onClick={() => onDeleteRecord(record)}
                    >
                      <Trash2 aria-hidden="true" size={18} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

const HISTORY_PREVIEW_LIMIT = 6;

type HistoryPreviewItem = {
  draft: CharacterDraft;
  tone: CharacterChipTone;
};

function getHistoryPreviewItems(record: PracticeResultRecord): {
  hiddenCount: number;
  items: HistoryPreviewItem[];
} {
  const groups = getResultRecordDraftGroups(record);
  const unknownItems = groups.unknownDrafts.map<HistoryPreviewItem>((draft) => ({ draft, tone: "red" }));
  const reviewItems = groups.reviewOnlyDrafts.map<HistoryPreviewItem>((draft) => ({ draft, tone: "yellow" }));
  const allItems = [...unknownItems, ...reviewItems];

  return {
    hiddenCount: Math.max(allItems.length - HISTORY_PREVIEW_LIMIT, 0),
    items: allItems.slice(0, HISTORY_PREVIEW_LIMIT),
  };
}

function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
