export function speakCharacter(char: string): void {
  if (!("speechSynthesis" in window) || !char) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(char);
  utterance.lang = "zh-CN";
  utterance.rate = 0.78;
  window.speechSynthesis.speak(utterance);
}
