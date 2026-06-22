import { BookOpenText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PracticeMode, PracticeModeConfig } from "../types/mode";

export const MODE_CONFIGS: PracticeModeConfig[] = [
  {
    id: "flashcard",
    label: "识字模式",
    shortLabel: "识字",
  },
];

export const MODE_ICONS: Record<PracticeMode, LucideIcon> = {
  flashcard: BookOpenText,
};

export function getModeConfig(mode: PracticeMode): PracticeModeConfig {
  return MODE_CONFIGS.find((item) => item.id === mode) ?? MODE_CONFIGS[0];
}
