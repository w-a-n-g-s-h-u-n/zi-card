import { Check, Clipboard, Home, RotateCcw, Sparkles, Target } from "lucide-react";
import type { SessionStats } from "../types/session";
import { Button } from "../ui/Button";
import { ResultBadge } from "../ui/ResultBadge";
import { joinCharacters } from "../utils/text";

type ResultPageProps = {
  stats: SessionStats;
  sourceChars: string[];
  canReview: boolean;
  onReview: () => void;
  onRestart: () => void;
  onCopy: () => void;
};

export function ResultPage({
  stats,
  sourceChars,
  canReview,
  onReview,
  onRestart,
  onCopy,
}: ResultPageProps) {
  return (
    <main className="result-page">
      <section className="result-header">
        <div className="result-mark" aria-hidden="true">
          <Sparkles size={34} />
        </div>
        <div>
          <h1>本轮完成</h1>
          <p>{stats.total} 个字</p>
        </div>
      </section>

      <section className="result-grid">
        <ResultBadge icon={Check} label="正确" tone="green" value={stats.knownCount} />
        <ResultBadge icon={Target} label="待巩固" tone="yellow" value={stats.reviewCount} />
        <ResultBadge icon={Sparkles} label="正确率" tone="blue" value={`${stats.accuracy}%`} />
      </section>

      <section className="result-lists">
        <CharacterList title="正确" chars={stats.knownChars} emptyText="还没有标记" />
        <CharacterList title="待巩固" chars={stats.reviewChars} emptyText="没有待巩固字" />
      </section>

      <section className="result-actions">
        <Button icon={RotateCcw} size="large" disabled={!canReview} onClick={onReview}>
          巩固这些字
        </Button>
        <Button icon={Clipboard} variant="secondary" size="large" onClick={onCopy}>
          复制字表
        </Button>
        <Button icon={Home} variant="quiet" size="large" onClick={onRestart}>
          重新录入
        </Button>
      </section>

      <p className="source-line">{joinCharacters(sourceChars)}</p>
    </main>
  );
}

function CharacterList({
  title,
  chars,
  emptyText,
}: {
  title: string;
  chars: string[];
  emptyText: string;
}) {
  return (
    <div className="character-list-panel">
      <h2>{title}</h2>
      <div className="preview-row">
        {chars.length === 0 ? (
          <span className="empty-preview">{emptyText}</span>
        ) : (
          chars.map((char) => (
            <span className="character-chip" key={char}>
              {char}
            </span>
          ))
        )}
      </div>
    </div>
  );
}
