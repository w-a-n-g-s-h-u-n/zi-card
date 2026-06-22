import type { ReactNode } from "react";

type CharacterCardProps = {
  char: string;
  pinyin?: string;
  header?: ReactNode;
  action?: ReactNode;
};

export function CharacterCard({ char, pinyin, header, action }: CharacterCardProps) {
  const hasTopContent = Boolean(header || action);

  return (
    <section className="character-card" aria-label={char} data-with-top={hasTopContent ? "true" : "false"}>
      {hasTopContent ? (
        <div className="character-card-top">
          <div className="character-card-context">{header}</div>
          <div className="character-card-action">{action}</div>
        </div>
      ) : null}
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
