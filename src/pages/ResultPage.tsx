import { AlertCircle, Check, Home, ListChecks, PencilLine, RotateCcw, Share2, Target } from "lucide-react";
import { createDraftsFromCharacterItems, reorderWithinCharacterSubset } from "../core/draftList";
import type { CharacterDraft, CharacterItem } from "../types/character";
import type { SessionStats } from "../types/session";
import type { StoredSettings } from "../storage/storageTypes";
import { Button } from "../ui/Button";
import type { CharacterChipTone } from "../ui/CharacterChip";
import { DisplaySettingsButton } from "../ui/DisplaySettingsButton";
import { PracticeGeneralSettings } from "../ui/PracticeGeneralSettings";
import { ResultCharacterChipList } from "../ui/ResultCharacterChipList";
import { ResultBadge } from "../ui/ResultBadge";

type ResultPageProps = {
  actionStatus: string | null;
  canContinue: boolean;
  items: CharacterItem[];
  settings: StoredSettings;
  stats: SessionStats;
  onContinue: () => void;
  onEditAnswers: () => void;
  onRestart: () => void;
  onReview: () => void;
  onReorderItems: (drafts: CharacterDraft[]) => void;
  onSettingsChange: (settings: StoredSettings) => void;
  onShareResult: () => void;
};

export function ResultPage({
  actionStatus,
  canContinue,
  items,
  settings,
  stats,
  onContinue,
  onEditAnswers,
  onRestart,
  onReview,
  onReorderItems,
  onSettingsChange,
  onShareResult,
}: ResultPageProps) {
  const headline = getResultHeadline(stats, canContinue);
  const primaryAction = getPrimaryAction(stats, canContinue, onContinue, onReview, onRestart);
  const pinyinByChar = new Map(items.map((item) => [item.char, item.pinyin]));

  return (
    <main className="result-page">
      <section className="result-summary" aria-labelledby="result-title">
        <div>
          <p className="result-eyebrow">本轮复盘</p>
          <h1 id="result-title">{headline}</h1>
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

      <section className="result-actions" aria-label="下一步">
        <Button icon={primaryAction.icon} size="large" onClick={primaryAction.onClick}>
          {primaryAction.label}
        </Button>
        {primaryAction.kind === "restart" ? null : (
          <Button icon={Home} variant="quiet" size="large" onClick={onRestart}>
            回到字表
          </Button>
        )}
        {stats.practiced > 0 && !canContinue ? (
          <Button icon={PencilLine} variant="quiet" size="large" onClick={onEditAnswers}>
            修改答案
          </Button>
        ) : null}
        <Button icon={Share2} variant="quiet" size="large" onClick={onShareResult}>
          分享识字结果
        </Button>
        <p className="result-action-status" aria-live="polite">
          {actionStatus ?? ""}
        </p>
      </section>

      <section className="result-panel result-review-panel" aria-labelledby="review-title">
        <header className="result-panel-header">
          <div>
            <p className="result-section-kicker">下一轮重点</p>
            <h2 id="review-title">待练字 {stats.reviewCount}</h2>
          </div>
        </header>
        <ResultCharacterGroup
          chars={stats.unknownChars}
          emptyText="没有错误字"
          label="错误"
          pinyinByChar={pinyinByChar}
          showPinyin={settings.showPinyin}
          tone="red"
          onReorder={(fromIndex, toIndex) =>
            onReorderItems(reorderResultDrafts(items, stats.unknownChars, fromIndex, toIndex))
          }
        />
        <ResultCharacterGroup
          chars={stats.reviewOnlyChars}
          emptyText="没有巩固字"
          label="巩固"
          pinyinByChar={pinyinByChar}
          showPinyin={settings.showPinyin}
          tone="yellow"
          onReorder={(fromIndex, toIndex) =>
            onReorderItems(reorderResultDrafts(items, stats.reviewOnlyChars, fromIndex, toIndex))
          }
        />
        {stats.unansweredChars.length > 0 ? (
          <ResultCharacterGroup
            chars={stats.unansweredChars}
            emptyText=""
            label="未练"
            pinyinByChar={pinyinByChar}
            showPinyin={settings.showPinyin}
            tone="neutral"
            onReorder={(fromIndex, toIndex) =>
              onReorderItems(reorderResultDrafts(items, stats.unansweredChars, fromIndex, toIndex))
            }
          />
        ) : null}
      </section>

      <section className="result-panel result-known-panel" aria-labelledby="known-title">
        <div>
          <p className="result-section-kicker">已经通过</p>
          <h2 id="known-title">正确字 {stats.knownCount}</h2>
        </div>
        <ResultCharacterGroup
          chars={stats.knownChars}
          emptyText="还没有正确字"
          label="正确"
          pinyinByChar={pinyinByChar}
          showPinyin={settings.showPinyin}
          tone="green"
          onReorder={(fromIndex, toIndex) =>
            onReorderItems(reorderResultDrafts(items, stats.knownChars, fromIndex, toIndex))
          }
        />
      </section>
    </main>
  );
}

function getResultHeadline(stats: SessionStats, canContinue: boolean): string {
  if (canContinue) {
    return "还有字没练完";
  }

  if (stats.reviewCount > 0) {
    return `${stats.reviewCount} 个字需要巩固`;
  }

  return "本轮全部通过";
}

function getPrimaryAction(
  stats: SessionStats,
  canContinue: boolean,
  onContinue: () => void,
  onReview: () => void,
  onRestart: () => void,
) {
  if (canContinue) {
    return {
      icon: ListChecks,
      kind: "continue",
      label: "继续练习",
      onClick: onContinue,
    };
  }

  if (stats.reviewCount > 0) {
    return {
      icon: RotateCcw,
      kind: "review",
      label: `巩固 ${stats.reviewCount} 个字`,
      onClick: onReview,
    };
  }

  return {
    icon: Home,
    kind: "restart",
    label: "回到字表",
    onClick: onRestart,
  };
}

function ResultCharacterGroup({
  chars,
  emptyText,
  label,
  onReorder,
  pinyinByChar,
  showPinyin,
  tone,
}: {
  chars: string[];
  emptyText: string;
  label: string;
  onReorder: (fromIndex: number, toIndex: number) => void;
  pinyinByChar: Map<string, string | undefined>;
  showPinyin: boolean;
  tone: CharacterChipTone;
}) {
  const drafts = chars.map((char) => ({
    char,
    pinyin: pinyinByChar.get(char),
  }));

  return (
    <div className="result-character-group" data-tone={tone}>
      <div className="result-group-title">
        <span>{label}</span>
        <strong>{chars.length}</strong>
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
  items: CharacterItem[],
  chars: string[],
  fromIndex: number,
  toIndex: number,
): CharacterDraft[] {
  return createDraftsFromCharacterItems(reorderWithinCharacterSubset(items, chars, fromIndex, toIndex));
}
