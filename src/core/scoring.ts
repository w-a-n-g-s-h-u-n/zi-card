import type { PracticeSession, SessionStats } from "../types/session";

function uniqueChars(chars: string[]): string[] {
  return Array.from(new Set(chars));
}

export function getSessionStats(session: PracticeSession): SessionStats {
  const total = session.queue.length;
  const knownChars = session.items
    .filter((item) => session.results[item.char] === "known")
    .map((item) => item.char);
  const unknownChars = session.items
    .filter((item) => session.results[item.char] === "unknown")
    .map((item) => item.char);
  const reviewOnlyChars = session.items
    .filter((item) => session.results[item.char] === "review")
    .map((item) => item.char);
  const reviewChars = [...unknownChars, ...reviewOnlyChars];
  const unansweredChars = session.items
    .filter((item) => !session.results[item.char])
    .map((item) => item.char);
  const answered = uniqueChars(Object.keys(session.results));
  const passedCount = knownChars.length + reviewOnlyChars.length;
  const passRate = total === 0 ? 0 : Math.round((passedCount / total) * 100);

  return {
    total,
    practiced: answered.length,
    knownCount: knownChars.length,
    unknownCount: unknownChars.length,
    reviewOnlyCount: reviewOnlyChars.length,
    reviewCount: reviewChars.length,
    passedCount,
    accuracy: passRate,
    passRate,
    knownChars,
    unknownChars,
    reviewOnlyChars,
    reviewChars,
    unansweredChars,
  };
}
