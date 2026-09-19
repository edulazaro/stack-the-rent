import { CANVAS_H, CANVAS_W } from "../game/constants";
import type { GameData } from "../game/types";
import { drawAirborne } from "./actors";
import { drawBorderCamera } from "./border";
import type { HudInfo } from "./hud";
import { drawAim, drawHud, drawPoliticianQuote } from "./hud";
import { drawBackground, drawSpectators, drawTower } from "./world";

export type RenderInfo = HudInfo;

/** Draws one frame. Reads the game state, never changes it. */
export function render(ctx: CanvasRenderingContext2D, g: GameData, info: RenderInfo) {
  ctx.save();
  if (g.shakeTimer > 0) ctx.translate((Math.random() - 0.5) * g.shakeTimer, (Math.random() - 0.5) * g.shakeTimer);
  ctx.clearRect(-10, -10, CANVAS_W + 20, CANVAS_H + 20);

  drawBackground(ctx, g);
  ctx.save();
  ctx.translate(0, g.scrollY);
  drawTower(ctx, g);
  ctx.restore();

  drawSpectators(ctx, g);
  drawAirborne(ctx, g);
  drawPoliticianQuote(ctx, g);
  drawBorderCamera(ctx, g, info.t, info.isTouch);
  drawHud(ctx, g, info);
  ctx.restore();

  if (g.aim.visible && !info.isTouch && !g.ended) drawAim(ctx, g);
}
