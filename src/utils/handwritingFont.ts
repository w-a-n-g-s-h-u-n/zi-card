let handwritingFontPromise: Promise<unknown> | null = null;

export function loadHandwritingFont(): Promise<unknown> {
  if (!handwritingFontPromise) {
    handwritingFontPromise = import("lxgw-wenkai-screen-webfont/lxgwwenkaigbscreen.css").catch((error) => {
      handwritingFontPromise = null;
      throw error;
    });
  }

  return handwritingFontPromise;
}
