/**
 * Lightweight Web Audio brush: fabric-like noise plus bell partials. It is
 * synthesized at runtime, so no audio asset needs downloading on mobile.
 */
let context: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let lastBrushAt = 0;
let lastBellAt = 0;

function getContext() {
  if (typeof window === "undefined") return null;
  if (context) return context;
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  context = new AudioContextClass();
  master = context.createGain();
  master.gain.value = 0.85;
  master.connect(context.destination);

  noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
  return context;
}

function playSilentKick(audio: AudioContext) {
  const source = audio.createBufferSource();
  source.buffer = audio.createBuffer(1, 1, audio.sampleRate);
  source.connect(audio.destination);
  source.start();
}

async function resumeAudio() {
  const audio = getContext();
  if (!audio) return false;
  try {
    if (audio.state !== "running") await audio.resume();
    if (audio.state !== "running") return false;
    playSilentKick(audio);
    return true;
  } catch {
    return false;
  }
}

/** Call directly from a click, tap, or pointer-down gesture. */
export function unlockCurtainAudio() {
  void resumeAudio();
}

export function playCurtainBrush(intensity: number) {
  const audio = getContext();
  if (!audio || !master || !noiseBuffer) return;
  if (audio.state !== "running") {
    void resumeAudio().then((unlocked) => {
      if (unlocked) playCurtainBrush(intensity);
    });
    return;
  }

  const now = performance.now();
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (now - lastBrushAt < (isCoarsePointer ? 125 : 70)) return;
  lastBrushAt = now;

  const amount = Math.min(1, Math.max(0, intensity));
  const time = audio.currentTime;
  const swish = audio.createBufferSource();
  swish.buffer = noiseBuffer;
  swish.playbackRate.value = 0.85 + Math.random() * 0.3;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1400 + amount * 1800 + Math.random() * 500;
  filter.Q.value = 1.4;
  const swishGain = audio.createGain();
  swishGain.gain.setValueAtTime(0, time);
  swishGain.gain.linearRampToValueAtTime(0.05 + amount * 0.12, time + 0.012);
  swishGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
  swish.connect(filter);
  filter.connect(swishGain);
  swishGain.connect(master);
  swish.start(time, Math.random() * 0.5, 0.25);
  swish.stop(time + 0.3);

  // Limit long-lived bell voices on touch devices: it keeps the same character
  // while avoiding dozens of overlapping oscillators during a swipe.
  if (amount <= 0.08 || now - lastBellAt < (isCoarsePointer ? 220 : 100)) return;
  lastBellAt = now;
  const notes = [1567.98, 1760, 2093, 2349.3, 2637, 3135.96];
  const fundamental = notes[Math.floor(Math.random() * notes.length)];
  const detune = 1 + (Math.random() - 0.5) * 0.015;
  const strike = 0.05 + amount * 0.09;
  const partials = [
    { ratio: 1, gain: 1, decay: 0.9 },
    { ratio: 2.32, gain: 0.55, decay: 0.55 },
    { ratio: 4.25, gain: 0.28, decay: 0.32 },
    { ratio: 6.63, gain: 0.14, decay: 0.18 },
  ];

  (isCoarsePointer ? partials.slice(0, 3) : partials).forEach((partial) => {
    const oscillator = audio.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = fundamental * partial.ratio * detune;
    const gain = audio.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(strike * partial.gain, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + partial.decay);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(time);
    oscillator.stop(time + partial.decay + 0.05);
  });

  if (Math.random() >= (isCoarsePointer ? 0.16 : 0.35)) return;
  const echoDelay = 0.06 + Math.random() * 0.08;
  const echo = audio.createOscillator();
  echo.type = "sine";
  echo.frequency.value = notes[Math.floor(Math.random() * notes.length)] * detune;
  const echoGain = audio.createGain();
  echoGain.gain.setValueAtTime(0, time + echoDelay);
  echoGain.gain.linearRampToValueAtTime(strike * 0.5, time + echoDelay + 0.003);
  echoGain.gain.exponentialRampToValueAtTime(0.0001, time + echoDelay + 0.6);
  echo.connect(echoGain);
  echoGain.connect(master);
  echo.start(time + echoDelay);
  echo.stop(time + echoDelay + 0.65);
}
