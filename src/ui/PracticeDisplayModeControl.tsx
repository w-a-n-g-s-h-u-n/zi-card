import { Grid2X2, Square } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PracticeDisplayMode } from "../storage/storageTypes";
import { SegmentedControl } from "./SegmentedControl";

const PRACTICE_DISPLAY_MODE_OPTIONS = [
  { value: "single", label: "单字", icon: Square },
  { value: "multi", label: "多字", icon: Grid2X2 },
] satisfies Array<{
  value: PracticeDisplayMode;
  label: string;
  icon: LucideIcon;
}>;

type PracticeDisplayModeControlProps = {
  value: PracticeDisplayMode;
  onChange: (value: PracticeDisplayMode) => void;
};

export function PracticeDisplayModeControl({ value, onChange }: PracticeDisplayModeControlProps) {
  return (
    <SegmentedControl<PracticeDisplayMode>
      label="练习展示"
      options={PRACTICE_DISPLAY_MODE_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
