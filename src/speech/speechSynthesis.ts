let activeUtterance: SpeechSynthesisUtterance | null = null;
let voiceLoadPromise: Promise<void> | null = null;
let speakTimer: number | null = null;

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window) ||
    !("SpeechSynthesisUtterance" in window)
  ) {
    return null;
  }

  return window.speechSynthesis;
}

function getVoices(synth: SpeechSynthesis): SpeechSynthesisVoice[] {
  try {
    return synth.getVoices();
  } catch {
    return [];
  }
}

function waitForVoices(synth: SpeechSynthesis): Promise<void> {
  if (getVoices(synth).length > 0) {
    return Promise.resolve();
  }

  voiceLoadPromise ??= new Promise((resolve) => {
    const finish = () => {
      window.clearTimeout(timeoutId);
      synth.removeEventListener("voiceschanged", finish);
      resolve();
    };
    const timeoutId = window.setTimeout(finish, 700);

    synth.addEventListener("voiceschanged", finish, { once: true });
  });

  return voiceLoadPromise;
}

function isChineseVoice(voice: SpeechSynthesisVoice): boolean {
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();

  return (
    lang.startsWith("zh") ||
    name.includes("chinese") ||
    name.includes("mandarin") ||
    name.includes("putonghua") ||
    name.includes("普通话") ||
    name.includes("中文")
  );
}

function getPreferredChineseVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  const voices = getVoices(synth).filter(isChineseVoice);

  return (
    voices.find((voice) => voice.lang.toLowerCase() === "zh-cn") ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("zh-cn")) ??
    voices.find((voice) => voice.lang.toLowerCase().includes("hans")) ??
    voices[0]
  );
}

function createCharacterUtterance(char: string, synth: SpeechSynthesis): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(char);
  const voice = getPreferredChineseVoice(synth);

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || "zh-CN";
  } else {
    utterance.lang = "zh-CN";
  }

  utterance.rate = 0.82;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.onend = () => {
    activeUtterance = null;
  };
  utterance.onerror = () => {
    activeUtterance = null;
  };

  return utterance;
}

function playCharacter(char: string, synth: SpeechSynthesis): void {
  activeUtterance = createCharacterUtterance(char, synth);

  if (synth.paused) {
    synth.resume();
  }

  synth.speak(activeUtterance);
}

export function prepareSpeechSynthesis(): void {
  const synth = getSpeechSynthesis();

  if (!synth) {
    return;
  }

  if (synth.paused) {
    synth.resume();
  }

  void waitForVoices(synth);
}

export function speakCharacter(char: string): boolean {
  const synth = getSpeechSynthesis();
  const text = char.trim();

  if (!synth || !text) {
    return false;
  }

  if (speakTimer) {
    window.clearTimeout(speakTimer);
    speakTimer = null;
  }

  const speak = () => {
    try {
      playCharacter(text, synth);
    } catch {
      activeUtterance = null;
    }
  };

  const speakAfterCancel = () => {
    synth.cancel();
    speakTimer = window.setTimeout(() => {
      speakTimer = null;
      speak();
    }, 80);
  };

  if (getVoices(synth).length === 0) {
    void waitForVoices(synth).then(() => {
      if (synth.speaking || synth.pending) {
        speakAfterCancel();
        return;
      }

      speak();
    });
    return true;
  }

  if (synth.speaking || synth.pending) {
    speakAfterCancel();
    return true;
  }

  speak();
  return true;
}
