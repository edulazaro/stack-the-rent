import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CAM_X,
  CAM_Y,
  CLIMBER_HIT_FRAMES,
  CLIMBER_START_FLOOR,
  COLLAPSE_FRAMES,
  INITIAL_BLOCK_W,
  MAX_TOWER_HP,
  MAX_WORKERS,
  MISS_FALL_FRAMES,
} from "./constants";
import { damageTower, floorsBuilt, placeBlock, shoot, topBlock, update } from "./logic";
import { createGame, resetGame } from "./state";
import { TEXT } from "./texts";
import type { GameData, GameEvents } from "./types";

const t = TEXT.es;

function setup() {
  const g = createGame();
  resetGame(g, t);
  const ev = { sound: vi.fn(), vibrate: vi.fn(), end: vi.fn() } satisfies GameEvents;
  return { g, ev };
}

function moving(g: GameData) {
  if (!g.currentBlock) throw new Error("no moving block");
  return g.currentBlock;
}

/** Drops the moving block `offset` px to the right of the top floor. */
function dropAt(g: GameData, ev: GameEvents, offset = 0) {
  moving(g).x = topBlock(g).x + offset;
  placeBlock(g, t, ev);
}

/** Stacks perfect floors, topping up workers so the border never gets in the way. */
function build(g: GameData, ev: GameEvents, floors: number) {
  for (let i = 0; floorsBuilt(g) < floors; i++) {
    if (i > floors) throw new Error(`stuck at floor ${floorsBuilt(g)}`);
    g.workers = MAX_WORKERS;
    dropAt(g, ev);
  }
}

function run(g: GameData, ev: GameEvents, ticks: number) {
  for (let i = 0; i < ticks; i++) update(g, t, ev);
}

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.5);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("placeBlock", () => {
  it("keeps the full width on a perfect drop", () => {
    const { g, ev } = setup();
    dropAt(g, ev, 2);
    expect(floorsBuilt(g)).toBe(1);
    expect(g.blocks[1]).toMatchObject({ x: g.blocks[0].x, w: INITIAL_BLOCK_W });
    expect(ev.sound).toHaveBeenCalledWith("perfect");
  });

  it("trims the overhang and drops it as debris", () => {
    const { g, ev } = setup();
    dropAt(g, ev, 50);
    expect(g.blocks[1].w).toBe(INITIAL_BLOCK_W - 50);
    expect(g.debris).toHaveLength(1);
    expect(g.debris[0].w).toBe(50);
  });

  it("ends the game once a missed block has fallen", () => {
    const { g, ev } = setup();
    moving(g).x = 0;
    placeBlock(g, t, ev);
    expect(moving(g).falling).toBe(true);
    run(g, ev, MISS_FALL_FRAMES - 1);
    expect(ev.end).not.toHaveBeenCalled();
    run(g, ev, 1);
    expect(ev.end).toHaveBeenCalledWith("miss");
  });

  it("can't build without workers", () => {
    const { g, ev } = setup();
    g.workers = 0;
    dropAt(g, ev);
    expect(floorsBuilt(g)).toBe(0);
    expect(ev.sound).toHaveBeenCalledWith("miss");
  });

  it("adds a full-width platform every 10 floors", () => {
    const { g, ev } = setup();
    build(g, ev, 10);
    expect(g.blocks).toHaveLength(12);
    expect(topBlock(g).price).toContain(t.floor);
    expect(moving(g).w).toBe(INITIAL_BLOCK_W);
  });
});

describe("tower damage", () => {
  it("collapses at 0 hit points and ends the game when the rubble settles", () => {
    const { g, ev } = setup();
    build(g, ev, 3);
    for (let i = 0; i < MAX_TOWER_HP; i++) damageTower(g, t, ev);
    expect(g.collapseTimer).toBe(COLLAPSE_FRAMES);
    expect(ev.sound).toHaveBeenCalledWith("collapse");
    run(g, ev, COLLAPSE_FRAMES);
    expect(ev.end).toHaveBeenCalledWith("collapse");
  });
});

describe("shoot", () => {
  it("brings down a helicopter it hits", () => {
    const { g, ev } = setup();
    g.helicopters.push({ x: 300, y: 100, dx: 1, active: true, shootTimer: 999 });
    shoot(g, 320, 122, 0, ev);
    expect(g.helicopters[0].active).toBe(false);
    expect(g.wrecks).toHaveLength(1);
    expect(ev.sound).toHaveBeenCalledWith("heliDestroy");
  });

  it("opens the border when it hits the camera instead of firing", () => {
    const { g, ev } = setup();
    shoot(g, CAM_X + 10, CAM_Y + 10, 0, ev);
    expect(g.borderOpen).toBe(true);
    expect(g.shots).toHaveLength(0);
    expect(ev.sound).toHaveBeenCalledWith("borderOpen");
  });
});

describe("climbers", () => {
  function withClimber() {
    const { g, ev } = setup();
    build(g, ev, CLIMBER_START_FLOOR);
    g.climberTimer = 1;
    run(g, ev, 1);
    expect(g.climbers).toHaveLength(1);
    return { g, ev, climber: g.climbers[0] };
  }

  it("take one hit point every few seconds while hacking the wall", () => {
    const { g, ev, climber } = withClimber();
    for (let i = 0; i < 600 && climber.state !== "working"; i++) update(g, t, ev);
    expect(climber.state).toBe("working");
    run(g, ev, CLIMBER_HIT_FRAMES);
    expect(g.towerHp).toBe(MAX_TOWER_HP - 1);
  });

  it("bounce away when shot", () => {
    const { g, ev, climber } = withClimber();
    shoot(g, climber.x, climber.y + g.scrollY + 10, 0, ev);
    expect(climber.state).toBe("fleeing");
    expect(ev.sound).toHaveBeenCalledWith("boing");
  });
});
