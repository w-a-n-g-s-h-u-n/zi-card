let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const AudioContextConstructor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextConstructor) {
    return null;
  }

  audioContext ??= new AudioContextConstructor();
  return audioContext;
}

export function playTone(type: "success" | "soft"): void {
  const context = getAudioContext();

  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.value = type === "success" ? 660 : 330;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.24);
}
