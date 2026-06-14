const HAN_CHARACTER_RE = /\p{Script=Han}/u;

export function normalizeInput(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function extractUniqueCharacters(value: string): string[] {
  const seen = new Set<string>();
  const chars: string[] = [];

  for (const char of value) {
    if (!HAN_CHARACTER_RE.test(char) || seen.has(char)) {
      continue;
    }
    seen.add(char);
    chars.push(char);
  }

  return chars;
}

export function joinCharacters(chars: string[]): string {
  return chars.join(" ");
}
