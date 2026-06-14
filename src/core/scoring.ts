import type { PracticeSession, SessionStats } from "../types/session";

function uniqueChars(chars: string[]): string[] {
  return Array.from(new Set(chars));
}

export function getSessionStats(session: PracticeSession): SessionStats {
  const knownChars = session.items
    .filter((item) => session.results[item.char] === "known")
    .map((item) => item.char);
  const reviewChars = session.items
    .filter((item) => {
      const result = session.results[item.char];
      return result === "unknown" || result === "review";
    })
    .map((item) => item.char);
  const answered = uniqueChars(Object.keys(session.results));

  return {
    total: session.queue.length,
    practiced: answered.length,
    knownCount: knownChars.length,
    reviewCount: reviewChars.length,
    accuracy: answered.length === 0 ? 0 : Math.round((knownChars.length / answered.length) * 100),
    knownChars,
    reviewChars,
  };
}
