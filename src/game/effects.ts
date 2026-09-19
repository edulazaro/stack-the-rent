import { BLOCK_H } from "./constants";
import type { GameData, Spark } from "./types";

export const isSmoke = (p: Spark) => p.kind === "smoke" || p.kind === "trail";

/** Dust puffs over a `w` wide area of a floor (tower coordinates). */
export function puffDust(g: GameData, x: number, y: number, w: number, count: number) {
  for (let k = 0; k < count; k++) {
    g.dust.push({
      x: x + Math.random() * w,
      y: y + Math.random() * BLOCK_H,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 1.2,
      life: 50 + Math.random() * 40,
      size: 4 + Math.random() * 6,
    });
  }
}

/** Flash, fire and smoke in screen space. `power` 1 = helicopter, less for bombs. */
export function explode(g: GameData, x: number, y: number, power: number) {
  g.sparks.push({ kind: "flash", tone: 0, x, y, vx: 0, vy: 0, life: 8, maxLife: 8, size: 22 * power });
  for (let i = 0; i < 14 * power; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (1 + Math.random() * 3) * power;
    g.sparks.push({
      kind: "fire",
      tone: i,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 20 + Math.random() * 15,
      maxLife: 35,
      size: 2 + Math.random() * 3 * power,
    });
  }
  for (let i = 0; i < 6 * power; i++) {
    g.sparks.push({
      kind: "smoke",
      tone: 0,
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -Math.random(),
      life: 40 + Math.random() * 30,
      maxLife: 70,
      size: 4 + Math.random() * 4,
    });
  }
}

/** Smoke left behind by a falling helicopter wreck. */
export function smokeTrail(g: GameData, x: number, y: number) {
  g.sparks.push({
    kind: "trail",
    tone: 0,
    x,
    y,
    vx: (Math.random() - 0.5) * 0.6,
    vy: -0.4,
    life: 45,
    maxLife: 45,
    size: 4 + Math.random() * 3,
  });
}
