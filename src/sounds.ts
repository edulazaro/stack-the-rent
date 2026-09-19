import type { SoundLayer } from "./shell/audio";
import { playLayers } from "./shell/audio";

export type SoundName =
  | "place"
  | "miss"
  | "hit"
  | "perfect"
  | "heliDestroy"
  | "collapse"
  | "borderOpen"
  | "shot"
  | "pick"
  | "boing";

/** Every sound in the game. Play them with `playSound(name)`. */
const SOUNDS: Record<SoundName, readonly SoundLayer[]> = {
  place: [{ kind: "tone", from: 440, to: 880, glide: 0.05, duration: 0.15, volume: 0.15 }],
  miss: [{ kind: "tone", wave: "sawtooth", from: 300, to: 80, duration: 0.3, volume: 0.15 }],
  hit: [
    { kind: "tone", wave: "square", from: 150, to: 50, duration: 0.2, volume: 0.1 },
    { kind: "noise", lowpass: 700, duration: 0.25, volume: 0.18 },
  ],
  perfect: [
    { kind: "tone", from: 523, duration: 0.5, volume: 0.12 },
    { kind: "tone", from: 659, duration: 0.5, volume: 0.12, delay: 0.08 },
    { kind: "tone", from: 784, duration: 0.5, volume: 0.12, delay: 0.16 },
  ],
  heliDestroy: [
    { kind: "tone", wave: "sawtooth", from: 600, to: 100, duration: 0.4, volume: 0.12 },
    { kind: "noise", lowpass: 900, duration: 0.45, volume: 0.25 },
  ],
  collapse: [
    { kind: "tone", wave: "sawtooth", from: 110, to: 30, duration: 1.6, volume: 0.14 },
    { kind: "noise", lowpass: 400, duration: 1.6, volume: 0.35 },
  ],
  shot: [
    { kind: "noise", lowpass: 2500, duration: 0.09, volume: 0.18 },
    { kind: "tone", wave: "square", from: 900, to: 180, duration: 0.07, volume: 0.05 },
  ],
  pick: [
    { kind: "noise", lowpass: 4000, duration: 0.05, volume: 0.08 },
    { kind: "tone", wave: "square", from: 1400, to: 900, duration: 0.05, volume: 0.03 },
  ],
  boing: [{ kind: "tone", wave: "triangle", from: 160, to: 720, glide: 0.25, duration: 0.35, volume: 0.14 }],
  borderOpen: [
    { kind: "noise", lowpass: 1500, duration: 0.18, volume: 0.06 },
    { kind: "tone", wave: "triangle", from: 523, duration: 0.14, volume: 0.1 },
    { kind: "tone", wave: "triangle", from: 784, duration: 0.25, volume: 0.1, delay: 0.1 },
  ],
};

export const playSound = (name: SoundName) => playLayers(SOUNDS[name]);
