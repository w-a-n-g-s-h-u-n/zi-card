import type { CharacterDraft, CharacterItem } from "../types/character";
import type { PracticeMode } from "../types/mode";
import type { PracticeResultRecord } from "../types/result";
import type { CharacterAssessment, PracticeResult, PracticeSession } from "../types/session";
import { createCharacterItemsFromDrafts } from "./characters";
import { createDraftsFromItems, getCharacterListIdentity } from "./resultHistory";
import { orderItems } from "./shuffle";

type CreateSessionInput = {
  sourceText: string;
  sourceDrafts: CharacterDraft[];
  items: CharacterItem[];
  mode: PracticeMode;
  randomOrder: boolean;
  round?: PracticeSession["round"];
  sourceListIdentity?: string;
};

export function createPracticeSession(input: CreateSessionInput): PracticeSession {
  const sourceListIdentity = input.sourceListIdentity ?? getCharacterListIdentity(input.sourceDrafts);

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
    sourceText: input.sourceText,
    sourceListIdentity,
    sourceDrafts: input.sourceDrafts,
    practiceDrafts: createDraftsFromItems(input.items),
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

export function createPracticeSessionFromResultRecord(record: PracticeResultRecord): PracticeSession {
  const items = createCharacterItemsFromDrafts(record.practiceDrafts);
  const results = pickResultsForItems(record.results, items);

  return syncLegacyBuckets({
    id: record.id,
    sourceText: record.sourceDrafts.map((draft) => draft.char).join(""),
    sourceListIdentity: record.sourceListIdentity,
    sourceDrafts: record.sourceDrafts,
    practiceDrafts: record.practiceDrafts,
    items,
    queue: items,
    currentIndex: getLastAnsweredIndex(items, results),
    mode: record.mode,
    round: record.round,
    known: [],
    unknown: [],
    mistakes: [],
    results,
    attempts: [],
    createdAt: record.createdAt,
  });
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

export function goToIndex(session: PracticeSession, index: number): PracticeSession {
  return {
    ...session,
    currentIndex: Math.min(Math.max(index, 0), Math.max(session.queue.length - 1, 0)),
  };
}

export function prepareSessionForAnswerEditing(session: PracticeSession): PracticeSession {
  return {
    ...session,
    currentIndex: getLastAnsweredIndex(session.queue, session.results, session.currentIndex),
  };
}

export function getCurrentResult(session: PracticeSession): CharacterAssessment | undefined {
  const item = getCurrentItem(session);
  return item ? session.results[item.char] : undefined;
}

export function recordAttempt(
  session: PracticeSession,
  result: PracticeResult,
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
        at: Date.now(),
      },
    ],
  };

  const syncedSession = syncLegacyBuckets(nextSession);
  const shouldAdvance = options.advance ?? true;

  if (!shouldAdvance) {
    return syncedSession;
  }

  return goToNext(syncedSession);
}

export function getNextCharacterAssessment(
  current?: CharacterAssessment,
): CharacterAssessment | undefined {
  if (!current) {
    return "known";
  }

  if (current === "known") {
    return "unknown";
  }

  if (current === "unknown") {
    return "review";
  }

  return undefined;
}

export function setCharacterAssessment(
  session: PracticeSession,
  char: string,
  assessment?: CharacterAssessment,
): PracticeSession {
  const item = session.items.find((candidate) => candidate.char === char);

  if (!item) {
    return session;
  }

  const results = { ...session.results };

  if (assessment) {
    results[item.char] = assessment;
  } else {
    delete results[item.char];
  }

  return syncLegacyBuckets({
    ...session,
    results,
    attempts: assessment
      ? [
          ...session.attempts,
          {
            char: item.char,
            mode: session.mode,
            result: assessment,
            at: Date.now(),
          },
        ]
      : session.attempts,
  });
}

export function cycleCharacterAssessment(session: PracticeSession, char: string): PracticeSession {
  return setCharacterAssessment(session, char, getNextCharacterAssessment(session.results[char]));
}

export function createReviewSession(
  source: PracticeSession,
  items: CharacterItem[],
  mode: PracticeMode,
  randomOrder: boolean,
): PracticeSession {
  return createPracticeSession({
    sourceText: source.sourceText,
    sourceDrafts: source.sourceDrafts,
    sourceListIdentity: source.sourceListIdentity,
    items,
    mode,
    randomOrder,
    round: "review",
  });
}

export function updateSessionDrafts(
  session: PracticeSession,
  drafts: CharacterDraft[],
  options: { preserveQueueOrder?: boolean } = {},
): PracticeSession {
  const items = createCharacterItemsFromDrafts(drafts);
  const itemByChar = new Map(items.map((item) => [item.char, item]));
  const currentChar = getCurrentItem(session)?.char;
  const queue = options.preserveQueueOrder ? preserveQueueOrder(session.queue, items) : items;
  const fallbackIndex = Math.min(session.currentIndex, Math.max(queue.length - 1, 0));
  const currentIndex = currentChar ? queue.findIndex((item) => item.char === currentChar) : -1;
  const results = Object.fromEntries(Object.entries(session.results).filter(([char]) => itemByChar.has(char)));

  return syncLegacyBuckets({
    ...session,
    sourceText: drafts.map((draft) => draft.char).join(""),
    sourceListIdentity: getCharacterListIdentity(drafts),
    sourceDrafts: drafts,
    practiceDrafts: createDraftsFromItems(items),
    items,
    queue,
    currentIndex: currentIndex >= 0 ? currentIndex : fallbackIndex,
    results,
    attempts: session.attempts.filter((attempt) => itemByChar.has(attempt.char)),
  });
}

export function updateSessionPracticeDrafts(session: PracticeSession, drafts: CharacterDraft[]): PracticeSession {
  const items = createCharacterItemsFromDrafts(drafts);
  const itemByChar = new Map(items.map((item) => [item.char, item]));
  const currentItem = getCurrentItem(session);
  const isComplete = isSessionComplete(session);
  const currentIndex = currentItem ? items.findIndex((item) => item.char === currentItem.char) : -1;
  const results = Object.fromEntries(Object.entries(session.results).filter(([char]) => itemByChar.has(char)));

  return syncLegacyBuckets({
    ...session,
    practiceDrafts: createDraftsFromItems(items),
    items,
    queue: items,
    currentIndex: isComplete
      ? items.length
      : currentIndex >= 0
        ? currentIndex
        : Math.min(session.currentIndex, Math.max(items.length - 1, 0)),
    results,
    attempts: session.attempts.filter((attempt) => itemByChar.has(attempt.char)),
  });
}

function addUnique(items: string[], char: string): string[] {
  return items.includes(char) ? items : [...items, char];
}

function toAssessment(result: PracticeResult): CharacterAssessment {
  return result;
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

function preserveQueueOrder(queue: CharacterItem[], items: CharacterItem[]): CharacterItem[] {
  const itemByChar = new Map(items.map((item) => [item.char, item]));
  const queuedItems = queue.flatMap((item) => {
    const nextItem = itemByChar.get(item.char);
    return nextItem ? [nextItem] : [];
  });
  const queuedChars = new Set(queuedItems.map((item) => item.char));

  return [...queuedItems, ...items.filter((item) => !queuedChars.has(item.char))];
}

function getLastAnsweredIndex(
  queue: CharacterItem[],
  results: Record<string, CharacterAssessment>,
  fallbackIndex = 0,
): number {
  if (queue.length === 0) {
    return 0;
  }

  for (let index = queue.length - 1; index >= 0; index -= 1) {
    if (results[queue[index].char]) {
      return index;
    }
  }

  return Math.min(Math.max(fallbackIndex, 0), queue.length - 1);
}

function pickResultsForItems(
  results: Record<string, CharacterAssessment>,
  items: CharacterItem[],
): Record<string, CharacterAssessment> {
  const itemChars = new Set(items.map((item) => item.char));

  return Object.fromEntries(Object.entries(results).filter(([char]) => itemChars.has(char)));
}
