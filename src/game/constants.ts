export const CANVAS_W = 960;
export const CANVAS_H = 540;
export const GROUND_Y = CANVAS_H - 40;
export const OLD_MAN_GROUND_Y = CANVAS_H - 35;

export const BLOCK_H = 25;
export const INITIAL_BLOCK_W = 200;
export const BLOCK_SPEED_BASE = 1.2;
export const MAX_BLOCK_ACCEL = 2;
export const GRAVITY = 0.5;

export const MAX_TOWER_HP = 5;
export const HELICOPTER_SIZE = 40;
export const HELI_SHOOT_INTERVAL = 150;

export const MAX_WORKERS = 15;
export const INITIAL_WORKERS = 10;
export const WORKER_COST_PER_BLOCK = 1;
export const WORKERS_PER_GROUP = 4;
export const MAX_WORKER_GROUPS = 3;
export const BORDER_X = 860;

export const PERFECT_FRAMES = 40;
export const SHOT_FRAMES = 12;
export const MISS_FALL_FRAMES = 50;
export const COLLAPSE_FRAMES = 150;

export const CLIMBER_START_FLOOR = 12;
export const CLIMBER_HIT_FRAMES = 180;
export const CLIMBER_SCALE = 1.4;

export const LADDER_LEFT_OFFSET = 28;
export const LADDER_RIGHT_OFFSET = 18;

export const CAM_W = 120;
export const CAM_H = 90;
export const CAM_Y = 50;
export const CAM_X = CANVAS_W - CAM_W - 15;

export const PLACE_BTN_W = 170;
export const PLACE_BTN_H = 76;
const PLACE_BTN_MARGIN = 16;
export const PLACE_BUTTONS = [
  { x: PLACE_BTN_MARGIN, y: CANVAS_H - PLACE_BTN_H - PLACE_BTN_MARGIN },
  { x: CANVAS_W - PLACE_BTN_W - PLACE_BTN_MARGIN, y: CANVAS_H - PLACE_BTN_H - PLACE_BTN_MARGIN },
];
