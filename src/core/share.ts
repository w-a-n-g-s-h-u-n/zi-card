import { extractUniqueCharacters } from "../utils/text";

const SHARE_CHARS_PARAM = "chars";

export function getSharedCharactersFromUrl(href: string): string[] {
  try {
    const url = new URL(href);
    const value = url.searchParams.get(SHARE_CHARS_PARAM);

    return value ? extractUniqueCharacters(value) : [];
  } catch {
    return [];
  }
}

export function createSharedCharactersUrl(chars: string[], href: string): string {
  const url = new URL(href);

  url.search = "";
  url.hash = "";
  url.searchParams.set(SHARE_CHARS_PARAM, chars.join(""));

  return url.toString();
}
