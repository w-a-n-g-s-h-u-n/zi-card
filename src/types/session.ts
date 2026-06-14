import type { CharacterItem } from "./character";
import type { PracticeMode } from "./mode";

export type PracticeResult = "known" | "unknown" | "review" | "correct" | "wrong";
export type CharacterAssessment = "known" | "unknown" | "review";

export type PracticeAttempt = {
  char: string;
  mode: PracticeMode;
  result: PracticeResult;
  selected?: string;
  at: number;
};

export type PracticeSession = {
  id: string;
  sourceText: string;
  items: CharacterItem[];
  queue: CharacterItem[];
  currentIndex: number;
  mode: PracticeMode;
  round: "main" | "review";
  known: string[];
  unknown: string[];
  mistakes: string[];
  results: Record<string, CharacterAssessment>;
  attempts: PracticeAttempt[];
  createdAt: number;
};

export type SessionStats = {
  total: number;
  practiced: number;
  knownCount: number;
  reviewCount: number;
  accuracy: number;
  knownChars: string[];
  reviewChars: string[];
};
