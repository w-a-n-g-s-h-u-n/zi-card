import type { CharacterDraft, CharacterItem } from "./character";
import type { PracticeMode } from "./mode";

export type PracticeResult = "known" | "unknown" | "review";
export type CharacterAssessment = "known" | "unknown" | "review";

export type PracticeAttempt = {
  char: string;
  mode: PracticeMode;
  result: PracticeResult;
  at: number;
};

export type PracticeSession = {
  id: string;
  sourceText: string;
  sourceListIdentity: string;
  sourceDrafts: CharacterDraft[];
  practiceDrafts: CharacterDraft[];
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
  unknownCount: number;
  reviewOnlyCount: number;
  reviewCount: number;
  passedCount: number;
  accuracy: number;
  passRate: number;
  knownChars: string[];
  unknownChars: string[];
  reviewOnlyChars: string[];
  reviewChars: string[];
  unansweredChars: string[];
};
