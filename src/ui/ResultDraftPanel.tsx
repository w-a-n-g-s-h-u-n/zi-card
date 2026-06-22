import type { CharacterDraft } from "../types/character";
import type { CharacterChipTone } from "./CharacterChip";
import { ResultCharacterChipList } from "./ResultCharacterChipList";

type ResultDraftPanelProps = {
  className?: string;
  drafts: CharacterDraft[];
  emptyText: string;
  kicker: string;
  label: string;
  showPinyin: boolean;
  title: string;
  tone?: CharacterChipTone;
  onReorder?: (fromIndex: number, toIndex: number) => void;
};

export function ResultDraftPanel({
  className = "",
  drafts,
  emptyText,
  kicker,
  label,
  showPinyin,
  title,
  tone = "neutral",
  onReorder,
}: ResultDraftPanelProps) {
  return (
    <details className={`result-panel result-draft-panel ${className}`.trim()}>
      <summary className="result-draft-summary">
        <div>
          <p className="result-section-kicker">{kicker}</p>
          <h2>{title} {drafts.length}</h2>
        </div>
        <span aria-hidden="true" className="result-draft-disclosure" />
      </summary>
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
    </details>
  );
}
