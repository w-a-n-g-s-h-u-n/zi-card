import type { CharacterItem } from "../types/character";
import type { PracticeMode } from "../types/mode";
import type { CharacterAssessment, PracticeResult, PracticeSession } from "../types/session";
import { orderItems } from "./shuffle";

type CreateSessionInput = {
  sourceText: string;
  items: CharacterItem[];
  mode: PracticeMode;
  randomOrder: boolean;
  round?: PracticeSession["round"];
};

export function createPracticeSession(input: CreateSessionInput): PracticeSession {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    sourceText: input.sourceText,
    items: input.items,
    queue: orderItems(input.items, input.randomOrder),
    currentIndex: 0,
    mode: input.mode,
    round: input.round ?? "main",
    known: [],
    unknown: [],
    mistakes: [],
    results: {},
    attempts: [],
    createdAt: Date.now(),
  };
}

export function getCurrentItem(session: PracticeSession): CharacterItem | undefined {
  return session.queue[session.currentIndex];
}

export function isSessionComplete(session: PracticeSession): boolean {
  return session.currentIndex >= session.queue.length;
}

export function goToNext(session: PracticeSession): PracticeSession {
  return {
    ...session,
    currentIndex: Math.min(session.currentIndex + 1, session.queue.length),
  };
}

export function goToPrevious(session: PracticeSession): PracticeSession {
  return {
    ...session,
    currentIndex: Math.max(session.currentIndex - 1, 0),
  };
}

export function getCurrentResult(session: PracticeSession): CharacterAssessment | undefined {
  const item = getCurrentItem(session);
  return item ? session.results[item.char] : undefined;
}

export function recordAttempt(
  session: PracticeSession,
  result: PracticeResult,
  selected?: string,
  options: { advance?: boolean } = {},
): PracticeSession {
  const item = getCurrentItem(session);

  if (!item) {
    return session;
  }

  const nextSession: PracticeSession = {
    ...session,
    results: {
      ...session.results,
      [item.char]: toAssessment(result),
    },
    attempts: [
      ...session.attempts,
      {
        char: item.char,
        mode: session.mode,
        result,
        selected,
        at: Date.now(),
      },
    ],
  };

  const syncedSession = syncLegacyBuckets(nextSession);
  const shouldAdvance = options.advance ?? true;

  if (result === "wrong" || !shouldAdvance) {
    return syncedSession;
  }

  return goToNext(syncedSession);
}

export function createReviewSession(
  source: PracticeSession,
  items: CharacterItem[],
  mode: PracticeMode,
  randomOrder: boolean,
): PracticeSession {
  return createPracticeSession({
    sourceText: source.sourceText,
    items,
    mode,
    randomOrder,
    round: "review",
  });
}

function addUnique(items: string[], char: string): string[] {
  return items.includes(char) ? items : [...items, char];
}

function toAssessment(result: PracticeResult): CharacterAssessment {
  if (result === "known" || result === "correct") {
    return "known";
  }

  if (result === "unknown") {
    return "unknown";
  }

  return "review";
}

function syncLegacyBuckets(session: PracticeSession): PracticeSession {
  const known: string[] = [];
  const unknown: string[] = [];
  const mistakes: string[] = [];

  for (const item of session.items) {
    const result = session.results[item.char];

    if (result === "known") {
      known.push(item.char);
    }

    if (result === "unknown") {
      unknown.push(item.char);
    }

    if (result === "review") {
      mistakes.push(item.char);
    }
  }

  return {
    ...session,
    known,
    unknown,
    mistakes,
  };
}
