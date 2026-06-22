import { AlertCircle, ArrowLeft, BookOpenText, Check, PencilLine, RotateCcw, Share2, Target, Trash2 } from "lucide-react";
import { moveItem, reorderWithinCharacterSubset } from "../core/draftList";
import { getResultRecordDraftGroups, getResultRecordStats } from "../core/resultHistory";
import type { CharacterDraft } from "../types/character";
import type { PracticeResultRecord } from "../types/result";
import type { StoredSettings } from "../storage/storageTypes";
import { Button } from "../ui/Button";
import type { CharacterChipTone } from "../ui/CharacterChip";
import { DisplaySettingsButton } from "../ui/DisplaySettingsButton";
import { PracticeGeneralSettings } from "../ui/PracticeGeneralSettings";
import { ResultCharacterChipList } from "../ui/ResultCharacterChipList";
import { ResultBadge } from "../ui/ResultBadge";
import { ResultDraftPanel } from "../ui/ResultDraftPanel";

type ResultDetailPageProps = {
  actionStatus: string | null;
  record: PracticeResultRecord;
  settings: StoredSettings;
  onBack: () => void;
  onDelete: (record: PracticeResultRecord) => void;
  onEditAnswers: (record: PracticeResultRecord) => void;
  onPracticeList: (drafts: CharacterDraft[]) => void;
  onReorderPracticeDrafts: (record: PracticeResultRecord, drafts: CharacterDraft[]) => void;
  onSettingsChange: (settings: StoredSettings) => void;
  onShareResult: (record: PracticeResultRecord) => void;
};

export function ResultDetailPage({
  actionStatus,
  record,
  settings,
  onBack,
  onDelete,
  onEditAnswers,
  onPracticeList,
  onReorderPracticeDrafts,
  onSettingsChange,
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
        <div className="result-summary-side">
          <DisplaySettingsButton>
            <PracticeGeneralSettings settings={settings} onSettingsChange={onSettingsChange} />
          </DisplaySettingsButton>
          <div className="result-rate" aria-label={`通过率 ${stats.passRate}%`}>
            <strong>{stats.passRate}%</strong>
            <span>通过率</span>
          </div>
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
        {stats.practiced > 0 ? (
          <Button icon={PencilLine} size="large" onClick={() => onEditAnswers(record)}>
            修改答案
          </Button>
        ) : null}
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
        <ResultDraftGroup
          drafts={groups.unknownDrafts}
          emptyText="没有错误字"
          label="错误"
          showPinyin={settings.showPinyin}
          tone="red"
          onReorder={(fromIndex, toIndex) =>
            onReorderPracticeDrafts(
              record,
              reorderResultDrafts(record.practiceDrafts, groups.unknownDrafts, fromIndex, toIndex),
            )
          }
        />
        <ResultDraftGroup
          drafts={groups.reviewOnlyDrafts}
          emptyText="没有巩固字"
          label="巩固"
          showPinyin={settings.showPinyin}
          tone="yellow"
          onReorder={(fromIndex, toIndex) =>
            onReorderPracticeDrafts(
              record,
              reorderResultDrafts(record.practiceDrafts, groups.reviewOnlyDrafts, fromIndex, toIndex),
            )
          }
        />
        {groups.unansweredDrafts.length > 0 ? (
          <ResultDraftGroup
            drafts={groups.unansweredDrafts}
            emptyText=""
            label="未练"
            showPinyin={settings.showPinyin}
            tone="neutral"
            onReorder={(fromIndex, toIndex) =>
              onReorderPracticeDrafts(
                record,
                reorderResultDrafts(record.practiceDrafts, groups.unansweredDrafts, fromIndex, toIndex),
              )
            }
          />
        ) : null}
      </section>

      <section className="result-panel result-known-panel" aria-labelledby="detail-known-title">
        <div>
          <p className="result-section-kicker">已经通过</p>
          <h2 id="detail-known-title">正确字 {stats.knownCount}</h2>
        </div>
        <ResultDraftGroup
          drafts={groups.knownDrafts}
          emptyText="还没有正确字"
          label="正确"
          showPinyin={settings.showPinyin}
          tone="green"
          onReorder={(fromIndex, toIndex) =>
            onReorderPracticeDrafts(
              record,
              reorderResultDrafts(record.practiceDrafts, groups.knownDrafts, fromIndex, toIndex),
            )
          }
        />
      </section>

      <ResultDraftPanel
        className="result-practice-list-panel"
        drafts={record.practiceDrafts}
        emptyText="本轮字表为空"
        kicker="本轮字表"
        label="本轮"
        showPinyin={settings.showPinyin}
        title="本轮"
        onReorder={(fromIndex, toIndex) =>
          onReorderPracticeDrafts(record, moveItem(record.practiceDrafts, fromIndex, toIndex))
        }
      />

      <ResultDraftPanel
        className="result-source-list-panel"
        drafts={record.sourceDrafts}
        emptyText="完整字表为空"
        kicker="完整字表"
        label="完整"
        showPinyin={settings.showPinyin}
        title="全部"
      />

    </main>
  );
}

function ResultDraftGroup({
  drafts,
  emptyText,
  label,
  onReorder,
  showPinyin,
  tone,
}: {
  drafts: CharacterDraft[];
  emptyText: string;
  label: string;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  showPinyin: boolean;
  tone: CharacterChipTone;
}) {
  return (
    <div className="result-character-group" data-tone={tone}>
      <div className="result-group-title">
        <span>{label}</span>
        <strong>{drafts.length}</strong>
      </div>
      <ResultCharacterChipList
        drafts={drafts}
        emptyText={emptyText}
        showPinyin={showPinyin}
        tone={tone}
        onReorder={onReorder}
      />
    </div>
  );
}

function reorderResultDrafts(
  allDrafts: CharacterDraft[],
  groupDrafts: CharacterDraft[],
  fromIndex: number,
  toIndex: number,
): CharacterDraft[] {
  return reorderWithinCharacterSubset(
    allDrafts,
    groupDrafts.map((draft) => draft.char),
    fromIndex,
    toIndex,
  );
}
