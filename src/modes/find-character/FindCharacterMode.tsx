import { Volume2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CharacterItem } from "../../types/character";
import { Button } from "../../ui/Button";
import { IconButton } from "../../ui/IconButton";
import { CharacterCard } from "../../ui/CharacterCard";
import { createFindCharacterRound } from "./findCharacterLogic";

type FindCharacterModeProps = {
  item?: CharacterItem;
  allItems: CharacterItem[];
  showPinyin: boolean;
  onCorrect: () => void;
  onWrong: (selected: string) => void;
  onUnknown: () => void;
  onSpeak: () => void;
};

export function FindCharacterMode({
  item,
  allItems,
  showPinyin,
  onCorrect,
  onWrong,
  onUnknown,
  onSpeak,
}: FindCharacterModeProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  const options = useMemo(() => {
    if (!item) {
      return [];
    }
    return createFindCharacterRound(item, allItems);
  }, [allItems, item]);

  useEffect(() => {
    setSelected(null);
    setLocked(false);
  }, [item?.id]);

  function handleSelect(char: string, isTarget: boolean) {
    if (locked || !item) {
      return;
    }

    setSelected(char);

    if (isTarget) {
      setLocked(true);
      window.setTimeout(() => {
        onCorrect();
      }, 360);
      return;
    }

    onWrong(char);
  }

  return (
    <>
      <CharacterCard
        char={item?.char ?? ""}
        pinyin={showPinyin ? item?.pinyin : undefined}
        label="找"
        action={
          <IconButton
            icon={Volume2}
            label="读音"
            title="读音"
            variant="quiet"
            onClick={onSpeak}
            disabled={!item}
          />
        }
      />

      <div className="practice-controls find-controls">
        <div className="find-grid" aria-label="备选汉字">
          {options.map((option) => {
            const isSelected = selected === option.char;

            return (
              <button
                className="find-option"
                data-correct={isSelected && option.isTarget ? "true" : "false"}
                data-wrong={isSelected && !option.isTarget ? "true" : "false"}
                key={option.char}
                type="button"
                onClick={() => handleSelect(option.char, option.isTarget)}
              >
                {option.char}
              </button>
            );
          })}
        </div>

        <Button icon={X} variant="danger" size="large" onClick={onUnknown}>
          错误
        </Button>
      </div>
    </>
  );
}
