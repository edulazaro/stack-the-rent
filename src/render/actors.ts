import { CLIMBER_SCALE, SHOT_FRAMES } from "../game/constants";
import { isSmoke } from "../game/effects";
import { isStrike } from "../game/logic";
import type { Climber, GameData, Spark } from "../game/types";
import { BUBBLE_SMALL, drawBubble } from "./primitives";
import { BOMB, CLIMBER, FONTS, HELICOPTER, PARTICLES, rgba, SHOT } from "./theme";

const CROSS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** Helicopters, wrecks, bombs, explosions and shots. Screen coordinates. */
export function drawAirborne(ctx: CanvasRenderingContext2D, g: GameData) {
  const strike = isStrike(g);
  for (const h of g.helicopters) {
    if (!h.active) continue;
    const bob = Math.sin(g.frame * 0.08 + h.x * 0.01) * 2;
    const tilt = strike ? 0.25 : 0.12 + Math.sin(g.frame * 0.05 + h.x) * 0.03;
    drawHelicopter(ctx, h.x, h.y + bob, g.frame, tilt);
    drawTarget(ctx, h.x + 20, h.y + 22 + bob);
  }

  for (const w of g.wrecks) drawHelicopter(ctx, w.x, w.y, g.frame, w.rot, true);

  for (const bomb of g.bombs) {
    if (!bomb.active) continue;
    ctx.fillStyle = BOMB.body;
    ctx.fillRect(bomb.x - 4, bomb.y - 9, 8, 2);
    ctx.fillRect(bomb.x - 1, bomb.y - 9, 2, 4);
    ctx.beginPath();
    ctx.ellipse(bomb.x, bomb.y, 3.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BOMB.nose;
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y + 4, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const p of g.sparks) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife) * (isSmoke(p) ? 0.5 : 1);
    ctx.fillStyle = sparkColor(p);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const shot of g.shots) drawShot(ctx, shot.x, shot.y, shot.life);
}

function sparkColor(p: Spark) {
  switch (p.kind) {
    case "flash":
      return PARTICLES.flash;
    case "fire":
      return PARTICLES.fire[p.tone % PARTICLES.fire.length];
    case "smoke":
      return PARTICLES.smoke;
    case "trail":
      return PARTICLES.trail;
  }
}

function drawTarget(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.strokeStyle = HELICOPTER.target;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, 27, 0, Math.PI * 2);
  for (const [dx, dy] of CROSS) {
    ctx.moveTo(cx + dx * 23, cy + dy * 23);
    ctx.lineTo(cx + dx * 31, cy + dy * 31);
  }
  ctx.stroke();
}

/** Impact star, ring and flash that fade over `SHOT_FRAMES`. */
function drawShot(ctx: CanvasRenderingContext2D, x: number, y: number, life: number) {
  const k = 1 - life / SHOT_FRAMES;
  const alpha = 1 - k;
  ctx.strokeStyle = rgba(SHOT.impact, alpha);
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + 0.3;
    ctx.moveTo(x + Math.cos(angle) * (6 + k * 8), y + Math.sin(angle) * (6 + k * 8));
    ctx.lineTo(x + Math.cos(angle) * (11 + k * 12), y + Math.sin(angle) * (11 + k * 12));
  }
  ctx.stroke();
  ctx.strokeStyle = rgba(SHOT.ring, alpha);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, 4 + k * 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = rgba(SHOT.flash, alpha);
  ctx.beginPath();
  ctx.arc(x, y, 6 * alpha, 0, Math.PI * 2);
  ctx.fill();
}

/** GOAT helicopter facing right; (x, y) is the top-left of its 40x40 hit box. */
export function drawHelicopter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  tilt: number,
  wrecked = false,
) {
  const body = wrecked ? HELICOPTER.wreckBody : HELICOPTER.body;
  const dark = wrecked ? HELICOPTER.wreckDark : HELICOPTER.dark;
  ctx.save();
  ctx.translate(x + 20, y + 22);
  ctx.rotate(tilt);

  // Tail boom and fin
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-6, -4);
  ctx.lineTo(-34, -2);
  ctx.lineTo(-34, 2);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(-28, 0);
  ctx.lineTo(-36, -12);
  ctx.lineTo(-32, -12);
  ctx.lineTo(-24, 0);
  ctx.closePath();
  ctx.fill();

  // Tail rotor
  if (!wrecked) {
    ctx.fillStyle = HELICOPTER.tailDisc;
    ctx.beginPath();
    ctx.arc(-35, -9, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  const tailAngle = wrecked ? 0.6 : frame * 0.9;
  ctx.strokeStyle = dark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-35 - Math.cos(tailAngle) * 6, -9 - Math.sin(tailAngle) * 6);
  ctx.lineTo(-35 + Math.cos(tailAngle) * 6, -9 + Math.sin(tailAngle) * 6);
  ctx.stroke();

  // Skids
  ctx.beginPath();
  ctx.moveTo(-6, 9);
  ctx.lineTo(-8, 15);
  ctx.moveTo(10, 9);
  ctx.lineTo(12, 15);
  ctx.moveTo(-15, 15);
  ctx.lineTo(18, 15);
  ctx.quadraticCurveTo(22, 15, 23, 11);
  ctx.stroke();

  // Fuselage and cockpit
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(2, 1, 17, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(2, 3, 16, 7, 0, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = wrecked ? HELICOPTER.wreckGlass : HELICOPTER.glass;
  ctx.beginPath();
  ctx.ellipse(10, -1, 8, 7, 0, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  if (!wrecked) {
    ctx.fillStyle = HELICOPTER.glint;
    ctx.fillRect(12, -5, 3, 2);
  }

  // GOAT livery
  ctx.fillStyle = wrecked ? HELICOPTER.wreckStripe : HELICOPTER.stripe;
  ctx.fillRect(-14, 2, 18, 3);
  ctx.fillStyle = wrecked ? HELICOPTER.wreckLabel : HELICOPTER.label;
  ctx.font = FONTS.heliLabel;
  ctx.textAlign = "center";
  ctx.fillText("GOAT", -5, 0);

  // Main rotor
  ctx.fillStyle = dark;
  ctx.fillRect(0, -13, 4, 5);
  if (wrecked) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -16);
    ctx.lineTo(22, -11);
    ctx.stroke();
  } else {
    ctx.fillStyle = HELICOPTER.rotorDisc;
    ctx.beginPath();
    ctx.ellipse(2, -14, 30, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    const blade = Math.cos(frame * 0.7) * 30;
    ctx.strokeStyle = HELICOPTER.blade;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2 - blade, -14);
    ctx.lineTo(2 + blade, -14);
    ctx.stroke();
  }
  ctx.restore();
}

/** Climber hanging from its bungee rope, facing the tower. Tower coordinates. */
export function drawClimber(ctx: CanvasRenderingContext2D, c: Climber, ropeTop: number) {
  const { x, y } = c;
  const dir = -c.side;

  ctx.strokeStyle = CLIMBER.rope;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, ropeTop);
  ctx.lineTo(x, y + 12 * CLIMBER_SCALE);
  ctx.stroke();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(CLIMBER_SCALE, CLIMBER_SCALE);
  ctx.translate(-x, -y);

  const legSwing = Math.sin(c.swing * 0.15 + x) * 2;
  ctx.strokeStyle = CLIMBER.legs;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 20);
  ctx.lineTo(x - 3 + legSwing, y + 29);
  ctx.moveTo(x + 2, y + 20);
  ctx.lineTo(x + 3 - legSwing, y + 29);
  ctx.stroke();
  ctx.fillStyle = CLIMBER.boots;
  ctx.fillRect(x - 5 + legSwing, y + 28, 4, 3);
  ctx.fillRect(x + 1 - legSwing, y + 28, 4, 3);

  ctx.fillStyle = CLIMBER.jacket;
  ctx.fillRect(x - 5, y + 9, 10, 12);
  ctx.fillStyle = CLIMBER.harness;
  ctx.fillRect(x - 5, y + 17, 10, 2);

  // Arm swinging the ice axe against the wall
  const angle = c.state === "working" ? 1.3 - Math.abs(Math.sin(c.swing * 0.21)) * 1.5 : -0.9;
  const shoulderX = x + dir * 4;
  const shoulderY = y + 11;
  const handX = shoulderX + dir * Math.cos(angle) * 8;
  const handY = shoulderY - Math.sin(angle) * 8;
  const tipX = handX + dir * Math.cos(angle) * 8;
  const tipY = handY - Math.sin(angle) * 8;
  ctx.strokeStyle = CLIMBER.skin;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(handX, handY);
  ctx.stroke();
  ctx.strokeStyle = CLIMBER.axeHandle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(handX, handY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();
  ctx.strokeStyle = CLIMBER.axeHead;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tipX - Math.sin(angle) * 4, tipY - dir * Math.cos(angle) * 4);
  ctx.lineTo(tipX + Math.sin(angle) * 3, tipY + dir * Math.cos(angle) * 3);
  ctx.stroke();

  ctx.fillStyle = CLIMBER.skin;
  ctx.beginPath();
  ctx.arc(x, y + 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CLIMBER.helmet;
  ctx.beginPath();
  ctx.arc(x, y + 4, 5, Math.PI, 0);
  ctx.fill();
  ctx.restore();
}

/** Climbers' protest bubbles, drawn after the spectators so nothing covers them. Tower coordinates. */
export function drawClimberQuotes(ctx: CanvasRenderingContext2D, g: GameData) {
  for (const c of g.climbers) {
    if (c.state === "working" && c.quoteTimer > 0) {
      drawBubble(ctx, c.quote, c.x, c.y - 26, BUBBLE_SMALL, Math.min(1, c.quoteTimer / 20));
    }
  }
}
