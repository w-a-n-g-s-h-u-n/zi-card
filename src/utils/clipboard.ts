import copyTextToClipboard from "copy-text-to-clipboard";

export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Some Android browsers expose Clipboard API but reject writes.
    }
  }

  try {
    return copyTextToClipboard(text);
  } catch {
    return false;
  }
}
