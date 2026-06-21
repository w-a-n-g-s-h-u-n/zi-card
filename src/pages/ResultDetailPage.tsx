import { AlertCircle, ArrowLeft, BookOpenText, Check, RotateCcw, Share2, Target, Trash2 } from "lucide-react";
import { getResultRecordDraftGroups, getResultRecordStats } from "../core/resultHistory";
import { resolveCharacterPinyin } from "../core/pinyin";
import type { CharacterDraft } from "../types/character";
import type { PracticeResultRecord } from "../types/result";
import { Button } from "../ui/Button";
import { ResultBadge } from "../ui/ResultBadge";

type ResultDetailPageProps = {
  actionStatus: string | null;
  record: PracticeResultRecord;
  onBack: () => void;
  onDelete: (record: PracticeResultRecord) => void;
  onPracticeList: (drafts: CharacterDraft[]) => void;
  onShareResult: (record: PracticeResultRecord) => void;
};

export function ResultDetailPage({
  actionStatus,
  record,
  onBack,
  onDelete,
  onPracticeList,
  onShareResult,
}: ResultDetailPageProps) {
  const stats = getResultRecordStats(record);
  const groups = getResultRecordDraftGroups(record);

  return (
    <main className="result-detail-page">
      <section className="result-summary" aria-labelledby="result-detail-title">
        <div>
          <p className="result-eyebrow">本轮复盘</p>
          <h1 id="result-detail-title">识字结果详情</h1>
          <p className="result-progress">
            已练 {stats.practiced} / 共 {stats.total}
          </p>
        </div>
        <div className="result-rate" aria-label={`通过率 ${stats.passRate}%`}>
          <strong>{stats.passRate}%</strong>
          <span>通过率</span>
        </div>
      </section>

      <section className="result-grid" aria-label="结果统计">
        <ResultBadge icon={AlertCircle} label="错误" tone="red" value={stats.unknownCount} />
        <ResultBadge icon={Target} label="巩固" tone="yellow" value={stats.reviewOnlyCount} />
        <ResultBadge icon={Check} label="正确" tone="green" value={stats.knownCount} />
      </section>

      <section className="result-actions" aria-label="结果操作">
        <Button icon={ArrowLeft} variant="quiet" size="large" onClick={onBack}>
          返回历史
        </Button>
        <Button icon={Share2} size="large" onClick={() => onShareResult(record)}>
          分享识字结果
        </Button>
        {groups.reviewDrafts.length > 0 ? (
          <Button icon={RotateCcw} size="large" onClick={() => onPracticeList(groups.reviewDrafts)}>
            练待巩固字
          </Button>
        ) : null}
        <Button icon={BookOpenText} variant="quiet" size="large" onClick={() => onPracticeList(record.sourceDrafts)}>
          练原字表
        </Button>
        <Button icon={Trash2} variant="danger" size="large" onClick={() => onDelete(record)}>
          删除记录
        </Button>
        <p className="result-action-status" aria-live="polite">
          {actionStatus ?? ""}
        </p>
      </section>

      <section className="result-panel result-review-panel" aria-labelledby="detail-review-title">
        <header className="result-panel-header">
          <div>
            <p className="result-section-kicker">本轮结果</p>
            <h2 id="detail-review-title">需要关注 {stats.reviewCount}</h2>
          </div>
        </header>
        <ResultDraftGroup drafts={groups.unknownDrafts} emptyText="没有错误字" label="错误" tone="red" />
        <ResultDraftGroup drafts={groups.reviewOnlyDrafts} emptyText="没有巩固字" label="巩固" tone="yellow" />
        {groups.unansweredDrafts.length > 0 ? (
          <ResultDraftGroup drafts={groups.unansweredDrafts} emptyText="" label="未练" tone="neutral" />
        ) : null}
      </section>

      <section className="result-panel result-known-panel" aria-labelledby="detail-known-title">
        <div>
          <p className="result-section-kicker">已经通过</p>
          <h2 id="detail-known-title">正确字 {stats.knownCount}</h2>
        </div>
        <ResultDraftGroup drafts={groups.knownDrafts} emptyText="还没有正确字" label="正确" tone="green" />
      </section>

      <section className="result-panel detail-source-panel" aria-labelledby="detail-source-title">
        <div>
          <p className="result-section-kicker">原始字表</p>
          <h2 id="detail-source-title">全部 {record.sourceDrafts.length}</h2>
        </div>
        <ResultDraftGroup drafts={record.sourceDrafts} emptyText="原始字表为空" label="原始" tone="neutral" />
      </section>

      <section className="result-panel detail-practice-panel" aria-labelledby="detail-practice-title">
        <div>
          <p className="result-section-kicker">本轮练习字</p>
          <h2 id="detail-practice-title">本轮 {record.practiceDrafts.length}</h2>
        </div>
        <ResultDraftGroup drafts={record.practiceDrafts} emptyText="本轮字表为空" label="本轮" tone="neutral" />
      </section>
    </main>
  );
}

function ResultDraftGroup({
  drafts,
  emptyText,
  label,
  tone,
}: {
  drafts: CharacterDraft[];
  emptyText: string;
  label: string;
  tone: "red" | "yellow" | "green" | "neutral";
}) {
  return (
    <div className="result-character-group" data-tone={tone}>
      <div className="result-group-title">
        <span>{label}</span>
        <strong>{drafts.length}</strong>
      </div>
      <div className="result-chip-row">
        {drafts.length === 0 ? (
          <span className="empty-preview">{emptyText}</span>
        ) : (
          drafts.map((draft) => {
            const pinyin = resolveCharacterPinyin(draft.char, draft.pinyin);

            return (
              <span className="result-char-chip result-char-chip--with-pinyin" data-tone={tone} key={`${draft.char}-${pinyin ?? ""}`}>
                <small>{pinyin ?? ""}</small>
                <span>{draft.char}</span>
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
