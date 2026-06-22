import type { CharacterFont } from "../storage/storageTypes";

const characterFontPromises: Partial<Record<CharacterFont, Promise<unknown>>> = {};

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
    return import("lxgw-wenkai-screen-webfont/lxgwwenkaiscreenr.css");
  }

  return import("lxgw-wenkai-screen-webfont/lxgwwenkaigbscreen.css");
}
