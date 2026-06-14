import { BookOpenText, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PracticeMode, PracticeModeConfig } from "../types/mode";

export const MODE_CONFIGS: PracticeModeConfig[] = [
  {
    id: "flashcard",
    label: "大字卡片",
    shortLabel: "卡片",
  },
  {
    id: "find-character",
    label: "找字游戏",
    shortLabel: "找字",
  },
];

export const MODE_ICONS: Record<PracticeMode, LucideIcon> = {
  flashcard: BookOpenText,
  "find-character": Search,
};

export function getModeConfig(mode: PracticeMode): PracticeModeConfig {
  return MODE_CONFIGS.find((item) => item.id === mode) ?? MODE_CONFIGS[0];
}
