import type { SoundName } from "../sounds";

export type EndReason = "miss" | "collapse";

/** Side effects the game logic asks the shell to perform. */
export interface GameEvents {
  sound: (name: SoundName) => void;
  vibrate: (pattern: number | number[]) => void;
  end: (reason: EndReason) => void;
}

export interface Block {
  x: number;
  y: number;
  w: number;
  placed: boolean;
  falling: boolean;
  vy: number;
  price: string;
  golden?: boolean;
  vx?: number;
  rot?: number;
  vr?: number;
  delay?: number;
  landed?: boolean;
}

export interface Debris {
  x: number;
  y: number;
  w: number;
  vy: number;
  golden?: boolean;
}

export interface Dust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

export interface Helicopter {
  x: number;
  y: number;
  dx: number;
  active: boolean;
  shootTimer: number;
}

export interface Wreck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
}

export interface Bomb {
  x: number;
  y: number;
  vy: number;
  active: boolean;
}

export type SparkKind = "flash" | "fire" | "smoke" | "trail";

export interface Spark {
  kind: SparkKind;
  tone: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface Shot {
  x: number;
  y: number;
  life: number;
}

export interface Climber {
  side: 1 | -1;
  block: number;
  x: number;
  y: number;
  vy: number;
  state: "descending" | "working" | "fleeing";
  hitTimer: number;
  swing: number;
  quote: string;
  quoteTimer: number;
}

export interface WorkerGroup {
  x: number;
  speed: number;
  arrived: boolean;
  count: number;
}

export interface OldMan {
  currentY: number;
}

/** Whole mutable game state. World entities use tower coordinates, the rest screen coordinates. */
export interface GameData {
  frame: number;
  ended: boolean;
  scrollY: number;
  targetScrollY: number;
  shakeTimer: number;

  blocks: Block[];
  currentBlock: Block | null;
  speed: number;
  direction: number;
  blockTimer: number;
  level: number;
  perfectTimer: number;
  endTimer: number;
  collapseTimer: number;
  rubble: number;
  towerHp: number;
  debris: Debris[];
  dust: Dust[];

  helicopters: Helicopter[];
  wrecks: Wreck[];
  bombs: Bomb[];
  sparks: Spark[];
  shots: Shot[];
  aim: { x: number; y: number; visible: boolean };

  climbers: Climber[];
  climberTimer: number;
  climberSide: 1 | -1;
  climbersSeen: boolean;
  climberHint: number;

  workers: number;
  workerGroups: WorkerGroup[];
  workerSpawnTimer: number;
  borderOpen: boolean;
  borderTimer: number;
  convenioTimer: number;
  convenioType: "huelga" | "convenio";

  oldMen: OldMan[];
  currentQuote: { text: string; timer: number; manIndex: number } | null;
  politicianQuote: { text: string; timer: number } | null;
}
