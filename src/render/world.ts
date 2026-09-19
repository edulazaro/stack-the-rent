import {
  BLOCK_H,
  CANVAS_H,
  CANVAS_W,
  GROUND_Y,
  LADDER_LEFT_OFFSET,
  LADDER_RIGHT_OFFSET,
  OLD_MAN_GROUND_Y,
} from "../game/constants";
import { topBlock } from "../game/logic";
import type { Block, GameData } from "../game/types";
import { drawClimber } from "./actors";
import { BUBBLE_NORMAL, drawBubble } from "./primitives";
import { FONTS, OLD_MAN, rgba, TOWER, WORLD } from "./theme";

const MOUNTAIN_PEAKS: readonly [number, number][] = [
  [0, 30],
  [0.06, 120],
  [0.13, 60],
  [0.19, 150],
  [0.25, 80],
  [0.31, 130],
  [0.38, 70],
  [0.5, 140],
  [0.63, 60],
  [0.75, 110],
  [0.88, 50],
  [1, 90],
];

/** X of the left and right ladders, fixed to the base floor. */
export function ladderXs(g: GameData): [number, number] {
  const base = g.blocks[0];
  return [base.x - LADDER_LEFT_OFFSET, base.x + base.w + LADDER_RIGHT_OFFSET];
}

export function drawBackground(ctx: CanvasRenderingContext2D, g: GameData) {
  const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  sky.addColorStop(0, WORLD.skyTop);
  sky.addColorStop(1, WORLD.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = WORLD.mountains;
  ctx.beginPath();
  for (const [i, [fx, height]] of MOUNTAIN_PEAKS.entries()) {
    if (i === 0) ctx.moveTo(fx * CANVAS_W, CANVAS_H - height);
    else ctx.lineTo(fx * CANVAS_W, CANVAS_H - height);
  }
  ctx.lineTo(CANVAS_W, CANVAS_H);
  ctx.lineTo(0, CANVAS_H);
  ctx.fill();

  ctx.fillStyle = WORLD.ground;
  ctx.fillRect(0, GROUND_Y + g.scrollY, CANVAS_W, 40);
}

/** Floors, falling pieces and climbers, drawn in tower coordinates (`ctx` already scrolled). */
export function drawTower(ctx: CanvasRenderingContext2D, g: GameData) {
  g.blocks.forEach((b, i) => {
    if (b.y + g.scrollY <= CANVAS_H) drawFloor(ctx, g, b, i);
  });

  for (const d of g.debris) {
    ctx.fillStyle = d.golden ? TOWER.goldDebris : TOWER.moving;
    ctx.fillRect(d.x, d.y, d.w, BLOCK_H - 1);
  }

  for (const p of g.dust) {
    ctx.fillStyle = rgba(WORLD.dust, Math.min(0.5, p.life / 120));
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  const cb = g.currentBlock;
  if (cb && !cb.placed) drawMovingBlock(ctx, g, cb);

  for (const c of g.climbers) drawClimber(ctx, c, -g.scrollY);
}

function drawFloor(ctx: CanvasRenderingContext2D, g: GameData, b: Block, i: number) {
  const tumbling = !!b.rot;
  if (tumbling) {
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + BLOCK_H / 2);
    ctx.rotate(b.rot ?? 0);
    ctx.translate(-(b.x + b.w / 2), -(b.y + BLOCK_H / 2));
  }

  // Higher floors get darker
  const shade = Math.max(40, 200 - i * 8);
  if (b.golden) {
    const shine = Math.sin(g.frame * 0.1 + i) * 20;
    ctx.fillStyle = `rgb(${220 + shine}, ${180 + shine}, 50)`;
    ctx.fillRect(b.x, b.y, b.w, BLOCK_H - 1);
    ctx.strokeStyle = TOWER.goldBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x, b.y, b.w, BLOCK_H - 1);
  } else {
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 20})`;
    ctx.fillRect(b.x, b.y, b.w, BLOCK_H - 1);
  }

  ctx.fillStyle = i % 2 === 0 ? TOWER.windowLit : TOWER.windowSky;
  for (let wx = b.x + 8; wx < b.x + b.w - 8; wx += 14) {
    ctx.fillRect(wx, b.y + 5, 6, 10);
    ctx.fillRect(wx, b.y + 18, 6, 5);
  }

  if (i > 0) {
    ctx.fillStyle = shade < 120 ? TOWER.priceOnDark : TOWER.priceOnLight;
    ctx.font = FONTS.price;
    ctx.textAlign = "center";
    ctx.fillText(b.price, b.x + b.w / 2, b.y + BLOCK_H / 2 + 3);
  }
  if (tumbling) ctx.restore();
}

function drawMovingBlock(ctx: CanvasRenderingContext2D, g: GameData, cb: Block) {
  if (cb.golden) {
    const shine = Math.sin(g.frame * 0.15) * 30;
    ctx.fillStyle = `rgb(${230 + shine}, ${190 + shine}, 40)`;
    ctx.fillRect(cb.x, cb.y, cb.w, BLOCK_H - 1);
    ctx.strokeStyle = TOWER.movingGoldBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(cb.x, cb.y, cb.w, BLOCK_H - 1);
  } else {
    ctx.fillStyle = TOWER.moving;
    ctx.fillRect(cb.x, cb.y, cb.w, BLOCK_H - 1);
  }
  ctx.fillStyle = cb.golden ? TOWER.movingGoldText : TOWER.movingText;
  ctx.font = cb.golden ? FONTS.movingGoldPrice : FONTS.movingPrice;
  ctx.textAlign = "center";
  ctx.fillText(cb.price, cb.x + cb.w / 2, cb.y + BLOCK_H / 2 + 3);
}

/** Scaffolding ladders and the old men climbing them, with their comments. Screen coordinates. */
export function drawSpectators(ctx: CanvasRenderingContext2D, g: GameData) {
  const xs = ladderXs(g);
  if (g.collapseTimer === 0) drawLadders(ctx, g, xs);

  g.oldMen.forEach((man, mi) => {
    drawOldMan(ctx, xs[mi] - 2, Math.min(man.currentY, OLD_MAN_GROUND_Y), g.frame, mi);
  });

  const q = g.currentQuote;
  if (q) {
    const speaker = g.oldMen[q.manIndex] ?? g.oldMen[0];
    const top = Math.max(56, Math.min(speaker.currentY, OLD_MAN_GROUND_Y) - 58);
    drawBubble(ctx, q.text, (xs[q.manIndex] ?? xs[0]) + 5, top, BUBBLE_NORMAL, Math.min(1, q.timer / 30));
  }
}

function drawLadders(ctx: CanvasRenderingContext2D, g: GameData, xs: [number, number]) {
  const ladderTop = topBlock(g).y + g.scrollY;
  const ladderBottom = GROUND_Y + g.scrollY;
  // First rung inside the screen, keeping the 12px spacing
  const firstRung = ladderBottom - Math.max(0, Math.floor((ladderBottom - CANVAS_H) / 12)) * 12;
  ctx.strokeStyle = WORLD.ladder;
  for (const lx of xs) {
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, ladderBottom);
    ctx.lineTo(lx, ladderTop);
    ctx.moveTo(lx + 10, ladderBottom);
    ctx.lineTo(lx + 10, ladderTop);
    ctx.stroke();
    ctx.lineWidth = 1;
    for (let ry = firstRung; ry > ladderTop; ry -= 12) {
      ctx.beginPath();
      ctx.moveTo(lx, ry);
      ctx.lineTo(lx + 10, ry);
      ctx.stroke();
    }
  }
}

function drawOldMan(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, index: number) {
  ctx.strokeStyle = OLD_MAN.skin;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 12);
  ctx.lineTo(x + 1, y - 16 + Math.sin(frame * 0.08) * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 10, y - 12);
  ctx.lineTo(x + 13, y - 16 - Math.sin(frame * 0.08) * 2);
  ctx.stroke();

  ctx.fillStyle = OLD_MAN.legs;
  const legOffset = Math.sin(frame * 0.08 + index * 2) * 4;
  ctx.fillRect(x + 2, y - 5, 4, 7 + legOffset);
  ctx.fillRect(x + 8, y - 5, 4, 7 - legOffset);

  ctx.fillStyle = OLD_MAN.coat;
  ctx.fillRect(x + 2, y - 18, 10, 13);

  ctx.fillStyle = OLD_MAN.skin;
  ctx.beginPath();
  ctx.arc(x + 7, y - 23, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = OLD_MAN.beret;
  ctx.beginPath();
  ctx.ellipse(x + 7, y - 27, 6, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
}
