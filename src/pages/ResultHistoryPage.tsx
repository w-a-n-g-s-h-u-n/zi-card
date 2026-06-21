import { AlertCircle, ArrowLeft, BookOpenText, Check, ClipboardList, Eye, Target, Trash2 } from "lucide-react";
import { getResultRecordStats } from "../core/resultHistory";
import type { CharacterDraft } from "../types/character";
import type { PracticeResultRecord } from "../types/result";
import { Button } from "../ui/Button";
import { ResultBadge } from "../ui/ResultBadge";
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

            return (
              <article className="history-record" key={record.id}>
                <div className="history-record-main">
                  <div>
                    <p className="history-record-date">{formatDateTime(record.updatedAt)}</p>
                    <p className="history-record-meta">
                      已练 {stats.practiced}/{stats.total}
                    </p>
                  </div>
                  <div className="history-record-rate">{stats.passRate}%</div>
                </div>
                <div className="history-record-stats" aria-label="结果统计">
                  <ResultBadge icon={AlertCircle} label="错误" tone="red" value={stats.unknownCount} />
                  <ResultBadge icon={Target} label="巩固" tone="yellow" value={stats.reviewOnlyCount} />
                  <ResultBadge icon={Check} label="正确" tone="green" value={stats.knownCount} />
                </div>
                <div className="history-record-actions">
                  <Button icon={Eye} variant="quiet" onClick={() => onOpenRecord(record)}>
                    查看详情
                  </Button>
                  <Button icon={Trash2} variant="danger" onClick={() => onDeleteRecord(record)}>
                    删除
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function formatDateTime(value: number): string {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
