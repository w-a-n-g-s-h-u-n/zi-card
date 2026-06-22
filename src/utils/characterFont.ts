import type { CharacterFont } from "../storage/storageTypes";

const characterFontPromises: Partial<Record<CharacterFont, Promise<unknown>>> = {};
const CHARACTER_FONT_LOAD_SAMPLE = "字一二三四五六七八九十日月山水火长乐行";

export function loadCharacterFont(characterFont: CharacterFont): Promise<unknown> {
  if (characterFont === "sans") {
    return Promise.resolve();
  }

  if (!characterFontPromises[characterFont]) {
    characterFontPromises[characterFont] = importCharacterFont(characterFont).catch((error) => {
      characterFontPromises[characterFont] = undefined;
      throw error;
    });
  }

  return characterFontPromises[characterFont];
}

function importCharacterFont(characterFont: Exclude<CharacterFont, "sans">): Promise<unknown> {
  if (characterFont === "kai") {
    return import("lxgw-wenkai-screen-webfont/lxgwwenkaiscreenr.css").then(() =>
      loadFontFace("LXGW WenKai Screen R"),
    );
  }

  return import("lxgw-wenkai-screen-webfont/lxgwwenkaigbscreen.css").then(() =>
    loadFontFace("LXGW WenKai Screen"),
  );
}

function loadFontFace(fontFamily: string): Promise<unknown> {
  if (typeof document === "undefined" || !document.fonts?.load) {
    return Promise.resolve();
  }

  return document.fonts.load(`1em "${fontFamily}"`, CHARACTER_FONT_LOAD_SAMPLE);
}
