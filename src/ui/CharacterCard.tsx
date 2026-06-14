import type { ReactNode } from "react";

type CharacterCardProps = {
  char: string;
  pinyin?: string;
  label?: string;
  action?: ReactNode;
};

export function CharacterCard({ char, pinyin, label, action }: CharacterCardProps) {
  return (
    <section className="character-card" aria-label={char}>
      <div className="character-card-top">
        <div className="character-label">{label ?? "认"}</div>
        <div className="character-card-action">{action}</div>
      </div>
      <div className="character-stage">
        <div className="character-stack">
          <div className="character-reading">
            <span className="character-pinyin">{pinyin ?? ""}</span>
          </div>
          <div className="character-glyph-field">
            <div className="character-glyph">{char}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
