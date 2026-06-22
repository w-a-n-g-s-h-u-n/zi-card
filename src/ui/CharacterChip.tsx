export type CharacterChipTone = "red" | "yellow" | "green" | "neutral";
export type CharacterChipVariant = "preview" | "result";

type CharacterChipProps = {
  char: string;
  pinyin?: string;
  showPinyin?: boolean;
  tone?: CharacterChipTone;
  variant?: CharacterChipVariant;
};

export function CharacterChip({
  char,
  pinyin,
  showPinyin,
  tone = "neutral",
  variant = "preview",
}: CharacterChipProps) {
  const shouldShowPinyin = showPinyin ?? Boolean(pinyin);
  const ariaLabel = shouldShowPinyin && pinyin ? `${char} ${pinyin}` : char;

  return (
    <div
      aria-label={ariaLabel}
      className="character-chip"
      data-tone={tone}
      data-variant={variant}
      data-with-pinyin={shouldShowPinyin ? "true" : "false"}
    >
      <div className="character-chip-main">
        {shouldShowPinyin ? <span className="character-chip-pinyin">{pinyin ?? ""}</span> : null}
        <span className="character-chip-char">{char}</span>
      </div>
    </div>
  );
}
