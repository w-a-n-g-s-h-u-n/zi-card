let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeAudio: HTMLAudioElement | null = null;
let voiceLoadPromise: Promise<void> | null = null;
let speakTimer: number | null = null;
let speechFallbackTimer: number | null = null;

const SPEECH_START_TIMEOUT_MS = 900;
const YOUDAO_TTS_ENDPOINT = "https://dict.youdao.com/dictvoice";

type SpeakOptions = {
  pinyin?: string;
};

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

function getYoudaoAudioUrl(text: string): string {
  const url = new URL(YOUDAO_TTS_ENDPOINT);
  url.searchParams.set("audio", text);
  url.searchParams.set("le", "zh");

  return url.toString();
}

function getRemoteAudioUrls(char: string): string[] {
  return [getYoudaoAudioUrl(char)];
}

function clearSpeechTimers(): void {
  if (speakTimer) {
    window.clearTimeout(speakTimer);
    speakTimer = null;
  }

  if (speechFallbackTimer) {
    window.clearTimeout(speechFallbackTimer);
    speechFallbackTimer = null;
  }
}

function stopActiveAudio(): void {
  if (!activeAudio) {
    return;
  }

  activeAudio.pause();
  activeAudio.removeAttribute("src");
  activeAudio.load();
  activeAudio = null;
}

function stopActivePlayback(): void {
  clearSpeechTimers();
  stopActiveAudio();
  getSpeechSynthesis()?.cancel();
  activeUtterance = null;
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

async function playRemoteAudio(char: string, options: SpeakOptions = {}): Promise<boolean> {
  if (typeof window.Audio !== "function") {
    return false;
  }

  stopActiveAudio();

  for (const url of getRemoteAudioUrls(char)) {
    const audio = new Audio(url);
    activeAudio = audio;

    audio.onended = () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
    };
    audio.onerror = () => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
    };

    try {
      await audio.play();
      return true;
    } catch {
      if (activeAudio === audio) {
        stopActiveAudio();
      }
    }
  }

  return false;
}

function playSpeechWithStartCheck(char: string, synth: SpeechSynthesis): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    activeUtterance = createCharacterUtterance(char, synth);

    const settle = (started: boolean) => {
      if (settled) {
        return;
      }

      settled = true;

      if (speechFallbackTimer) {
        window.clearTimeout(speechFallbackTimer);
        speechFallbackTimer = null;
      }

      resolve(started);
    };

    activeUtterance.onstart = () => {
      settle(true);
    };
    activeUtterance.onend = () => {
      activeUtterance = null;
    };
    activeUtterance.onerror = () => {
      activeUtterance = null;
      settle(false);
    };

    if (synth.paused) {
      synth.resume();
    }

    try {
      synth.speak(activeUtterance);
      speechFallbackTimer = window.setTimeout(() => {
        synth.cancel();
        activeUtterance = null;
        settle(false);
      }, SPEECH_START_TIMEOUT_MS);
    } catch {
      activeUtterance = null;
      settle(false);
    }
  });
}

async function speakWithRemoteAudioFirst(char: string, options: SpeakOptions = {}): Promise<void> {
  const played = await playRemoteAudio(char, options);

  if (played) {
    return;
  }

  const synth = getSpeechSynthesis();

  if (!synth) {
    return;
  }

  await waitForVoices(synth);
  await playSpeechWithStartCheck(char, synth);
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

export function speakCharacter(char: string, options: SpeakOptions = {}): boolean {
  const text = char.trim();

  if (!text) {
    return false;
  }

  stopActivePlayback();

  speakTimer = window.setTimeout(() => {
    speakTimer = null;
    void speakWithRemoteAudioFirst(text, options);
  }, 80);

  return true;
}
