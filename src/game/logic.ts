import {
  BLOCK_H,
  BLOCK_SPEED_BASE,
  BORDER_X,
  CAM_H,
  CAM_W,
  CAM_X,
  CAM_Y,
  CANVAS_H,
  CANVAS_W,
  CLIMBER_HIT_FRAMES,
  CLIMBER_START_FLOOR,
  COLLAPSE_FRAMES,
  GRAVITY,
  GROUND_Y,
  HELI_SHOOT_INTERVAL,
  HELICOPTER_SIZE,
  INITIAL_BLOCK_W,
  MAX_BLOCK_ACCEL,
  MAX_WORKER_GROUPS,
  MAX_WORKERS,
  MISS_FALL_FRAMES,
  OLD_MAN_GROUND_Y,
  PERFECT_FRAMES,
  SHOT_FRAMES,
  WORKER_COST_PER_BLOCK,
  WORKERS_PER_GROUP,
} from "./constants";
import { explode, isSmoke, puffDust, smokeTrail } from "./effects";
import type { Texts } from "./texts";
import type { Block, EndReason, GameData, GameEvents } from "./types";

const pick = <T>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)];

export const floorsBuilt = (g: GameData) => g.blocks.length - 1;
export const topBlock = (g: GameData) => g.blocks[g.blocks.length - 1];
export const isStrike = (g: GameData) => g.convenioTimer > 0 && g.convenioType === "huelga";
export const towerStanding = (g: GameData) => g.collapseTimer === 0 && !g.ended;

export function endGame(g: GameData, reason: EndReason, ev: GameEvents) {
  if (g.ended) return;
  g.ended = true;
  ev.end(reason);
}

function openBorder(g: GameData, frames: number, ev: GameEvents) {
  if (!g.borderOpen) ev.sound("borderOpen");
  g.borderOpen = true;
  g.borderTimer = frames;
}

/** Floors tumble off top first, leaning to one side; the game ends after `COLLAPSE_FRAMES`. */
export function startCollapse(g: GameData, quote: string) {
  const side = Math.random() < 0.5 ? -1 : 1;
  const n = g.blocks.length;
  g.collapseTimer = COLLAPSE_FRAMES;
  g.rubble = 0;
  g.endTimer = 0;
  g.shakeTimer = 30;
  g.targetScrollY = 0;
  if (g.currentBlock && !g.currentBlock.placed) g.currentBlock.falling = true;
  for (let i = 1; i < n; i++) {
    const b = g.blocks[i];
    const height = i / n;
    b.vx = (Math.random() - 0.5) * 1.5 + side * height * 2.5;
    b.vy = 0;
    b.rot = 0;
    b.vr = side * (0.005 + Math.random() * 0.03) * (0.5 + height);
    b.delay = Math.min(60, (n - i) * 2) + 1 + Math.floor(Math.random() * 15);
  }
  const base = g.blocks[0];
  puffDust(g, base.x, base.y - BLOCK_H, base.w, 24);
  g.currentQuote = { text: quote, timer: COLLAPSE_FRAMES, manIndex: Math.floor(Math.random() * g.oldMen.length) };
  g.politicianQuote = null;
  for (const c of g.climbers) c.state = "fleeing";
}

export function damageTower(g: GameData, t: Texts, ev: GameEvents) {
  g.towerHp = Math.max(0, g.towerHp - 1);
  g.shakeTimer = 10;
  ev.sound("hit");
  if (g.towerHp > 0) {
    ev.vibrate(60);
  } else {
    startCollapse(g, t.collapseQuote);
    ev.sound("collapse");
    ev.vibrate([150, 60, 150, 60, 400]);
  }
}

/** Sends a climber down a rope to one of the top floors, alternating sides. */
export function spawnClimber(g: GameData, quote: string) {
  const index = Math.max(1, floorsBuilt(g) - Math.floor(Math.random() * 5));
  const block = g.blocks[index];
  g.climberSide = g.climberSide === 1 ? -1 : 1;
  const side = g.climberSide;
  g.climbers.push({
    side,
    block: index,
    x: side === -1 ? block.x - 13 : block.x + block.w + 13,
    y: -g.scrollY - 40,
    vy: 4,
    state: "descending",
    hitTimer: 0,
    swing: 0,
    quote,
    quoteTimer: 0,
  });
}

// ─── Player actions ──────────────────────────────────────

/** Drops the moving block onto the tower, trimming whatever overhangs. */
export function placeBlock(g: GameData, t: Texts, ev: GameEvents) {
  const current = g.currentBlock;
  if (!current || current.placed || current.falling || g.ended || g.collapseTimer > 0) return;

  const top = topBlock(g);
  const overlapLeft = Math.max(current.x, top.x);
  const overlapRight = Math.min(current.x + current.w, top.x + top.w);
  const overlapW = overlapRight - overlapLeft;

  if (overlapW <= 0) {
    current.falling = true;
    current.vy = 0;
    g.endTimer = MISS_FALL_FRAMES;
    ev.sound("miss");
    ev.vibrate(150);
    return;
  }

  if (g.workers <= 0 && g.convenioTimer <= 0) {
    ev.sound("miss");
    return;
  }

  const isPerfect = overlapW >= Math.min(current.w, top.w) * 0.97;
  if (isPerfect) {
    current.x = top.x;
    current.w = top.w;
  } else {
    if (current.x < overlapLeft) {
      g.debris.push({ x: current.x, y: current.y, w: overlapLeft - current.x, vy: 0, golden: current.golden });
    }
    if (current.x + current.w > overlapRight) {
      g.debris.push({
        x: overlapRight,
        y: current.y,
        w: current.x + current.w - overlapRight,
        vy: 0,
        golden: current.golden,
      });
    }
    current.x = overlapLeft;
    current.w = overlapW;
  }

  current.placed = true;
  g.blocks.push(current);
  g.blockTimer = 0;

  if (isPerfect) {
    ev.sound("perfect");
    g.perfectTimer = PERFECT_FRAMES;
    g.currentQuote = { text: "FATALITY!", timer: 90, manIndex: Math.floor(Math.random() * g.oldMen.length) };
  }

  // Union rep block: strike (helicopters leave) or agreement (border opens with extra workers)
  if (current.golden) {
    g.convenioTimer = 600;
    if (g.blocks.length % 2 === 0) {
      g.convenioType = "huelga";
    } else {
      g.convenioType = "convenio";
      openBorder(g, 300, ev);
      g.workers = Math.min(MAX_WORKERS, g.workers + 5);
      g.workerGroups.push({ x: CANVAS_W + 20, speed: 2.5, arrived: false, count: 5 });
    }
  }

  if (g.convenioTimer <= 0) g.workers = Math.max(0, g.workers - WORKER_COST_PER_BLOCK);
  ev.sound("place");

  const floors = floorsBuilt(g);
  if (g.blocks.length > 8) g.targetScrollY = (g.blocks.length - 8) * BLOCK_H;
  g.speed = BLOCK_SPEED_BASE + floors * 0.08;
  g.level = Math.floor(floors / 10) + 1;

  if (floors >= 10 && floors % 8 === 0) {
    const count = Math.min(Math.floor((floors - 10) / 15) + 1, 3);
    for (let i = 0; i < count; i++) {
      g.helicopters.push({
        x: -HELICOPTER_SIZE - i * 80,
        y: 30 + Math.random() * 120,
        dx: 0.8 + Math.random() * 0.4 + floors * 0.01,
        active: true,
        shootTimer: 120 + Math.floor(Math.random() * 80),
      });
    }
    g.politicianQuote = { text: pick(t.polQuotes), timer: 180 };
  }

  if (floors % 3 === 0) {
    g.currentQuote = { text: pick(t.quotes), timer: 150, manIndex: Math.floor(Math.random() * g.oldMen.length) };
  }

  // Every 10 floors a full-width platform resets the width
  const isReset = floors > 0 && floors % 10 === 0;
  const isUnionRep = !isReset && floors > 8 && floors % 7 !== 0 && Math.random() < 0.06 && g.convenioTimer <= 0;
  const nextW = isReset ? INITIAL_BLOCK_W : isUnionRep ? Math.min(current.w + 40, INITIAL_BLOCK_W) : current.w;
  g.currentBlock = {
    x: 0,
    y: current.y - BLOCK_H,
    w: nextW,
    placed: false,
    falling: false,
    vy: 0,
    price: isUnionRep ? t.unionBlock : t.prices[Math.min(floors, t.prices.length - 1)],
    golden: isUnionRep,
  };

  if (isReset) {
    const platform: Block = {
      x: current.x + current.w / 2 - INITIAL_BLOCK_W / 2,
      y: current.y - BLOCK_H,
      w: INITIAL_BLOCK_W,
      placed: true,
      falling: false,
      vy: 0,
      price: `--- ${t.floor} ${g.level} ---`,
    };
    g.blocks.push(platform);
    g.currentBlock.y = platform.y - BLOCK_H;
    if (g.blocks.length > 8) g.targetScrollY = (g.blocks.length - 8) * BLOCK_H;
  }
}

/** Click/tap at a screen point: hits helicopters or climbers, else opens the border camera, else just fires. */
export function shoot(g: GameData, x: number, y: number, pad: number, ev: GameEvents) {
  const hitHeli = (margin: number) => {
    for (const heli of g.helicopters) {
      if (
        heli.active &&
        x > heli.x - 16 - margin &&
        x < heli.x + HELICOPTER_SIZE + margin &&
        y > heli.y - margin &&
        y < heli.y + HELICOPTER_SIZE + margin
      ) {
        heli.active = false;
        g.wrecks.push({
          x: heli.x,
          y: heli.y,
          vx: heli.dx * 0.6,
          vy: -1.5,
          rot: 0.1,
          vr: (Math.random() < 0.5 ? -1 : 1) * (0.06 + Math.random() * 0.06),
        });
        explode(g, heli.x + 20, heli.y + 22, 1);
        g.shakeTimer = Math.max(g.shakeTimer, 6);
        ev.sound("heliDestroy");
        ev.vibrate(40);
        return true;
      }
    }
    return false;
  };
  const hitClimber = (margin: number) => {
    for (const c of g.climbers) {
      if (c.state === "fleeing") continue;
      const sy = c.y + g.scrollY;
      const onBody = x > c.x - 14 - margin && x < c.x + 14 + margin && y > sy - 6 - margin && y < sy + 45 + margin;
      const onRope = Math.abs(x - c.x) < 6 + margin / 3 && y > 0 && y < sy;
      if (onBody || onRope) {
        c.state = "fleeing";
        c.vy = -3;
        ev.sound("boing");
        return true;
      }
    }
    return false;
  };

  const hit = hitHeli(0) || hitClimber(0);
  const onCamera = x > CAM_X - 10 && x < CAM_X + CAM_W + 10 && y > CAM_Y - 20 && y < CAM_Y + CAM_H + 30;
  if (!hit && onCamera) {
    openBorder(g, 60, ev);
    return;
  }
  g.shots.push({ x, y, life: SHOT_FRAMES });
  ev.sound("shot");
  if (!hit && !hitHeli(pad)) hitClimber(pad);
}

// ─── Simulation ──────────────────────────────────────────

/** Advances the game one fixed 60 Hz tick. */
export function update(g: GameData, t: Texts, ev: GameEvents) {
  g.frame++;
  g.scrollY += (g.targetScrollY - g.scrollY) * 0.08;

  updateMovingBlock(g);
  updateFallingPieces(g, ev);
  updateParticles(g);
  updateHelicopters(g, t, ev);
  updateClimbers(g, t, ev);
  updateBorder(g);
  updateSpectators(g);

  if (g.shakeTimer > 0) g.shakeTimer--;
  if (g.convenioTimer > 0) g.convenioTimer--;
  if (g.perfectTimer > 0) g.perfectTimer--;
  if (g.endTimer > 0) {
    g.endTimer--;
    if (g.endTimer === 0) endGame(g, "miss", ev);
  }
}

function updateMovingBlock(g: GameData) {
  const cb = g.currentBlock;
  if (!cb || cb.placed) return;
  if (cb.falling) {
    cb.vy += GRAVITY;
    cb.y += cb.vy;
    return;
  }
  g.blockTimer++;
  const accel = Math.min(MAX_BLOCK_ACCEL, 1 + g.blockTimer * 0.002);
  cb.x += g.speed * accel * g.direction;
  if (cb.x + cb.w > CANVAS_W) g.direction = -1;
  if (cb.x < 0) g.direction = 1;
}

function updateFallingPieces(g: GameData, ev: GameEvents) {
  for (const d of g.debris) {
    d.vy += GRAVITY;
    d.y += d.vy;
  }
  g.debris = g.debris.filter((d) => d.y + g.scrollY < CANVAS_H + 50);

  for (const w of g.wrecks) {
    w.vy += 0.2;
    w.x += w.vx;
    w.y += w.vy;
    w.rot += w.vr;
    if (g.frame % 3 === 0) smokeTrail(g, w.x + 20, w.y + 22);
  }
  g.wrecks = g.wrecks.filter((w) => w.y < CANVAS_H + 60);

  if (g.collapseTimer === 0) return;
  for (let i = 1; i < g.blocks.length; i++) {
    const b = g.blocks[i];
    const delay = b.delay ?? 0;
    if (delay > 0) {
      b.delay = delay - 1;
      if (b.delay === 0) puffDust(g, b.x, b.y, b.w, 3);
      continue;
    }
    if (b.landed) continue;
    b.vy += GRAVITY * 0.5;
    b.x += b.vx ?? 0;
    b.y += b.vy;
    b.rot = (b.rot ?? 0) + (b.vr ?? 0);
    const restY = GROUND_Y - BLOCK_H - Math.min(45, g.rubble * 3);
    if (b.y >= restY) {
      b.y = restY;
      b.landed = true;
      b.rot = (b.rot ?? 0) * 0.5;
      g.rubble++;
      puffDust(g, b.x, b.y, b.w, 4);
    }
  }
  if (g.collapseTimer > COLLAPSE_FRAMES - 60) g.shakeTimer = Math.max(g.shakeTimer, 6);
  g.collapseTimer--;
  if (g.collapseTimer === 0) endGame(g, "collapse", ev);
}

function updateParticles(g: GameData) {
  for (const p of g.sparks) {
    const smoke = isSmoke(p);
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.93;
    p.vy = p.vy * 0.93 + (smoke ? -0.03 : 0.06);
    if (smoke) p.size += 0.3;
    p.life--;
  }
  g.sparks = g.sparks.filter((p) => p.life > 0);

  for (const shot of g.shots) shot.life--;
  g.shots = g.shots.filter((shot) => shot.life > 0);

  for (const p of g.dust) {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.97;
    p.vy -= 0.01;
    p.size += 0.25;
    p.life--;
  }
  g.dust = g.dust.filter((p) => p.life > 0);
}

function updateHelicopters(g: GameData, t: Texts, ev: GameEvents) {
  const strike = isStrike(g);
  for (const h of g.helicopters) {
    if (!h.active) continue;
    if (strike) {
      h.x += 3;
      if (h.x > CANVAS_W + 100) h.active = false;
      continue;
    }
    h.x += h.dx;
    if (h.x > CANVAS_W + 50) h.x = -HELICOPTER_SIZE;
    h.shootTimer--;
    if (h.shootTimer <= 0 && g.blocks.length > 2) {
      h.shootTimer = HELI_SHOOT_INTERVAL + Math.floor(Math.random() * 40);
      g.bombs.push({ x: h.x + HELICOPTER_SIZE / 2, y: h.y + HELICOPTER_SIZE, vy: 2, active: true });
    }
  }

  for (const bomb of g.bombs) {
    if (!bomb.active) continue;
    bomb.vy += 0.1;
    bomb.y += bomb.vy;
    // Bombs live in screen space, blocks in tower space
    const worldY = bomb.y - g.scrollY;
    if (towerStanding(g)) {
      const hit = g.blocks.some((b) => bomb.x > b.x && bomb.x < b.x + b.w && worldY > b.y && worldY < b.y + BLOCK_H);
      if (hit) {
        bomb.active = false;
        explode(g, bomb.x, bomb.y, 0.6);
        damageTower(g, t, ev);
      }
    }
    if (bomb.y > CANVAS_H + 50) bomb.active = false;
  }

  g.bombs = g.bombs.filter((b) => b.active);
  g.helicopters = g.helicopters.filter((h) => h.active);
}

function updateClimbers(g: GameData, t: Texts, ev: GameEvents) {
  const floors = floorsBuilt(g);
  if (floors >= CLIMBER_START_FLOOR && towerStanding(g) && g.endTimer === 0) {
    g.climberTimer--;
    if (g.climberTimer <= 0) {
      const maxClimbers = floors < 20 ? 1 : floors < 30 ? 2 : 3;
      if (g.climbers.filter((c) => c.state !== "fleeing").length < maxClimbers) {
        spawnClimber(g, pick(t.climberQuotes));
        if (!g.climbersSeen) {
          g.climbersSeen = true;
          g.climberHint = 240;
        }
      }
      g.climberTimer = Math.max(240, 660 - floors * 10);
    }
  }
  if (g.climberHint > 0) g.climberHint--;

  for (const c of g.climbers) {
    if (c.state === "fleeing") {
      c.vy -= 0.8;
      c.y += c.vy;
      continue;
    }
    const target = g.blocks[c.block];
    const restY = target.y + BLOCK_H / 2 - 20;
    c.vy = Math.max(-14, Math.min(14, (c.vy + (restY - c.y) * 0.01) * 0.92));
    c.y += c.vy;
    if (c.state === "descending" && Math.abs(restY - c.y) < 3 && Math.abs(c.vy) < 0.6) {
      c.state = "working";
      c.hitTimer = CLIMBER_HIT_FRAMES;
      c.quoteTimer = 120;
    }
    if (c.state !== "working" || g.collapseTimer > 0) continue;
    const wallX = c.x - c.side * 13;
    c.swing++;
    if (c.quoteTimer > 0) c.quoteTimer--;
    if (c.swing % 30 === 15) {
      puffDust(g, wallX - 2, target.y, 4, 1);
      ev.sound("pick");
    }
    c.hitTimer--;
    if (c.hitTimer <= 0) {
      c.hitTimer = CLIMBER_HIT_FRAMES;
      puffDust(g, wallX - 6, target.y, 12, 5);
      damageTower(g, t, ev);
    }
  }
  g.climbers = g.climbers.filter((c) => c.state !== "fleeing" || c.y + g.scrollY > -80);
}

function updateBorder(g: GameData) {
  g.workerSpawnTimer--;
  if (g.workerSpawnTimer <= 0) {
    if (g.workerGroups.length < MAX_WORKER_GROUPS) {
      g.workerGroups.push({
        x: CANVAS_W + 20,
        speed: 1.5 + Math.random() * 0.8,
        arrived: false,
        count: WORKERS_PER_GROUP,
      });
    }
    g.workerSpawnTimer = 300 + Math.floor(Math.random() * 200);
  }

  for (const wg of g.workerGroups) {
    if (wg.arrived) continue;
    wg.x -= wg.speed;
    if (wg.x > BORDER_X + 10) continue;
    if (g.borderOpen) {
      wg.arrived = true;
      g.workers = Math.min(MAX_WORKERS, g.workers + wg.count);
    } else {
      wg.x = BORDER_X + 10;
    }
  }

  if (g.borderOpen) {
    g.borderTimer--;
    if (g.borderTimer <= 0) g.borderOpen = false;
  }
  g.workerGroups = g.workerGroups.filter((wg) => !wg.arrived && wg.x > -50);
}

function updateSpectators(g: GameData) {
  // The old men climb slowly towards the top floor, and slide back down if the tower collapses
  const collapsing = g.collapseTimer > 0;
  const targetY = collapsing ? OLD_MAN_GROUND_Y : topBlock(g).y + g.scrollY + BLOCK_H + 15;
  for (const man of g.oldMen) man.currentY += (targetY - man.currentY) * (collapsing ? 0.08 : 0.02);

  if (g.currentQuote && --g.currentQuote.timer <= 0) g.currentQuote = null;
  if (g.politicianQuote && --g.politicianQuote.timer <= 0) g.politicianQuote = null;
}
