import type { CharacterDraft } from "./character";
import type { PracticeMode } from "./mode";
import type { CharacterAssessment } from "./session";

export type PracticeResultRecord = {
  id: string;
  sessionId: string;
  sourceListIdentity: string;
  sourceDrafts: CharacterDraft[];
  practiceDrafts: CharacterDraft[];
  mode: PracticeMode;
  round: "main" | "review";
  createdAt: number;
  updatedAt: number;
  results: Record<string, CharacterAssessment>;
};
