import { BookOpenText, Brush, Dice5, Type, Volume2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CharacterFont, StoredSettings } from "../storage/storageTypes";
import { PinyinVisibilityToggle } from "./PinyinVisibilityToggle";
import { PracticeDisplayModeControl } from "./PracticeDisplayModeControl";
import { SegmentedControl } from "./SegmentedControl";
import { Toggle } from "./Toggle";

const CHARACTER_FONT_OPTIONS: Array<{ value: CharacterFont; label: string; icon: LucideIcon }> = [
  { value: "sans", label: "标准", icon: Type },
  { value: "kai", label: "楷体", icon: BookOpenText },
  { value: "handwriting", label: "手写", icon: Brush },
];

type PracticeGeneralSettingsProps = {
  settings: StoredSettings;
  showRandomOrder?: boolean;
  onSettingsChange: (settings: StoredSettings) => void;
};

export function PracticeGeneralSettings({
  settings,
  showRandomOrder = false,
  onSettingsChange,
}: PracticeGeneralSettingsProps) {
  function updateSettings(patch: Partial<StoredSettings>) {
    onSettingsChange({
      ...settings,
      ...patch,
    });
  }

  return (
    <div className="practice-general-settings">
      <div className="toggle-group practice-toggle-group">
        <PinyinVisibilityToggle
          checked={settings.showPinyin}
          onCheckedChange={(showPinyin) => updateSettings({ showPinyin })}
        />
        {showRandomOrder ? (
          <Toggle
            checked={settings.randomOrder}
            icon={<Dice5 aria-hidden="true" size={21} />}
            label="随机"
            onCheckedChange={(randomOrder) => updateSettings({ randomOrder })}
          />
        ) : null}
        <Toggle
          checked={settings.showCharacterProgress}
          icon={<BookOpenText aria-hidden="true" size={21} />}
          label="字卡进度"
          onCheckedChange={(showCharacterProgress) => updateSettings({ showCharacterProgress })}
        />
        <Toggle
          checked={settings.soundEnabled}
          icon={<Volume2 aria-hidden="true" size={21} />}
          label="音效"
          onCheckedChange={(soundEnabled) => updateSettings({ soundEnabled })}
        />
      </div>

      <PracticeDisplayModeControl
        value={settings.practiceDisplayMode}
        onChange={(practiceDisplayMode) => updateSettings({ practiceDisplayMode })}
      />

      <SegmentedControl<CharacterFont>
        label="汉字字形"
        value={settings.characterFont}
        onChange={(characterFont) => updateSettings({ characterFont })}
        options={CHARACTER_FONT_OPTIONS}
      />
    </div>
  );
}
