import { CANVAS_W } from "../game/constants";
import { BUBBLE, FONTS, HUD } from "./theme";

/** Centered text on a translucent box sized to fit it. */
export function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  size: number,
  color: string,
  bg = HUD.pillBg,
) {
  ctx.font = FONTS.pill(size);
  const w = ctx.measureText(text).width + 32;
  const h = size + 14;
  ctx.fillStyle = bg;
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy + 1);
  ctx.textBaseline = "alphabetic";
}

export interface BubbleStyle {
  font: string;
  padX: number;
  height: number;
  baseline: number;
}

export const BUBBLE_NORMAL: BubbleStyle = { font: FONTS.bubble, padX: 10, height: 22, baseline: 15 };
export const BUBBLE_SMALL: BubbleStyle = { font: FONTS.bubbleSmall, padX: 6, height: 18, baseline: 13 };

/** Speech bubble centered on `anchorX` and kept inside the canvas. */
export function drawBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  anchorX: number,
  top: number,
  style: BubbleStyle,
  alpha: number,
) {
  ctx.globalAlpha = alpha;
  ctx.font = style.font;
  const w = ctx.measureText(text).width + style.padX * 2;
  const x = Math.max(5, Math.min(anchorX - w / 2, CANVAS_W - w - 5));
  ctx.fillStyle = BUBBLE.fill;
  ctx.strokeStyle = BUBBLE.border;
  ctx.lineWidth = 1;
  ctx.fillRect(x, top, w, style.height);
  ctx.strokeRect(x, top, w, style.height);
  ctx.fillStyle = BUBBLE.text;
  ctx.textAlign = "left";
  ctx.fillText(text, x + style.padX, top + style.baseline);
  ctx.globalAlpha = 1;
}
