import {
  BLOCK_H,
  BLOCK_SPEED_BASE,
  CANVAS_W,
  GROUND_Y,
  INITIAL_BLOCK_W,
  INITIAL_WORKERS,
  MAX_TOWER_HP,
  OLD_MAN_GROUND_Y,
} from "./constants";
import type { Texts } from "./texts";
import type { GameData } from "./types";

export function createGame(): GameData {
  return {
    frame: 0,
    ended: false,
    scrollY: 0,
    targetScrollY: 0,
    shakeTimer: 0,

    blocks: [],
    currentBlock: null,
    speed: BLOCK_SPEED_BASE,
    direction: 1,
    blockTimer: 0,
    level: 1,
    perfectTimer: 0,
    endTimer: 0,
    collapseTimer: 0,
    rubble: 0,
    towerHp: MAX_TOWER_HP,
    debris: [],
    dust: [],

    helicopters: [],
    wrecks: [],
    bombs: [],
    sparks: [],
    shots: [],
    aim: { x: 0, y: 0, visible: false },

    climbers: [],
    climberTimer: 180,
    climberSide: 1,
    climbersSeen: false,
    climberHint: 0,

    workers: INITIAL_WORKERS,
    workerGroups: [],
    workerSpawnTimer: 80,
    borderOpen: false,
    borderTimer: 0,
    convenioTimer: 0,
    convenioType: "huelga",

    oldMen: [],
    currentQuote: null,
    politicianQuote: null,
  };
}

/** Puts `g` back to the first floor of a new game. Keeps the aim so the crosshair doesn't jump. */
export function resetGame(g: GameData, t: Texts) {
  const aim = g.aim;
  Object.assign(g, createGame(), { aim });

  g.blocks.push({
    x: CANVAS_W / 2 - INITIAL_BLOCK_W / 2,
    y: GROUND_Y - BLOCK_H,
    w: INITIAL_BLOCK_W,
    placed: true,
    falling: false,
    vy: 0,
    price: t.prices[0],
  });
  g.currentBlock = {
    x: 0,
    y: GROUND_Y - BLOCK_H * 2,
    w: INITIAL_BLOCK_W,
    placed: false,
    falling: false,
    vy: 0,
    price: t.prices[1],
  };
  g.oldMen = [{ currentY: OLD_MAN_GROUND_Y }, { currentY: OLD_MAN_GROUND_Y }];
}
