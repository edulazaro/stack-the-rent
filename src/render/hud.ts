import {
  CANVAS_H,
  CANVAS_W,
  HELICOPTER_SIZE,
  MAX_TOWER_HP,
  MAX_WORKERS,
  PERFECT_FRAMES,
  PLACE_BTN_H,
  PLACE_BTN_W,
  PLACE_BUTTONS,
} from "../game/constants";
import { floorsBuilt } from "../game/logic";
import type { Texts } from "../game/texts";
import type { GameData } from "../game/types";
import { drawPill } from "./primitives";
import { AIM, FONTS, HUD, rgba } from "./theme";

export interface HudInfo {
  t: Texts;
  isTouch: boolean;
  playing: boolean;
  highScore: number;
}

/** Politician quote under the top bar, moved down while the bonus banner shows. */
export function drawPoliticianQuote(ctx: CanvasRenderingContext2D, g: GameData) {
  const pq = g.politicianQuote;
  if (!pq) return;
  ctx.globalAlpha = Math.min(1, pq.timer / 30);
  ctx.fillStyle = HUD.politician;
  ctx.font = FONTS.politician;
  ctx.textAlign = "center";
  ctx.fillText(pq.text, CANVAS_W / 2, g.convenioTimer > 0 ? 68 : 42);
  ctx.globalAlpha = 1;
}

/** Top bar, bonus banner, perfect flash, hints and touch buttons. */
export function drawHud(ctx: CanvasRenderingContext2D, g: GameData, info: HudInfo) {
  const { t, isTouch, playing } = info;
  drawTopBar(ctx, g, t, info.highScore);

  if (g.convenioTimer > 0) {
    const strike = g.convenioType === "huelga";
    const text = `${strike ? t.strike : t.agreement} - ${Math.ceil(g.convenioTimer / 60)}s`;
    ctx.fillStyle = strike ? HUD.strikeBg : HUD.agreementBg;
    ctx.fillRect(CANVAS_W / 2 - 180, 28, 360, 22);
    ctx.fillStyle = strike ? HUD.strikeText : HUD.agreementText;
    ctx.font = FONTS.banner;
    ctx.textAlign = "center";
    ctx.fillText(text, CANVAS_W / 2, 43);
  }

  if (g.perfectTimer > 0) {
    const alpha = g.perfectTimer / PERFECT_FRAMES;
    ctx.fillStyle = rgba(HUD.perfect, alpha * 0.25);
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = rgba(HUD.perfect, alpha);
    ctx.font = FONTS.perfect;
    ctx.textAlign = "center";
    ctx.fillText("PERFECT!", CANVAS_W / 2, CANVAS_H / 2 - 20);
  }

  const cx = CANVAS_W / 2;
  const cy = CANVAS_H / 2;
  if (playing && g.blocks.length <= 2 && g.frame % 60 < 40) {
    drawPill(ctx, isTouch ? t.placeHintTouch : t.placeHintKey, cx, cy + 42, 12, HUD.hintPlace);
  }
  if (g.climberHint > 0 && g.frame % 50 < 30) {
    drawPill(ctx, isTouch ? t.climberHintTouch : t.climberHintKey, cx, cy - 80, 11, HUD.hintClimbers);
  }
  if (g.helicopters.some((h) => h.active) && g.blocks.length < 20 && g.collapseTimer === 0 && g.frame % 50 < 30) {
    drawPill(ctx, isTouch ? t.heliHintTouch : t.heliHintKey, cx, cy - 37, 11, HUD.hintDanger);
  }
  if (g.workers <= 3 && g.frame % 40 < 25 && g.convenioTimer <= 0 && g.collapseTimer === 0) {
    drawPill(ctx, g.workers <= 0 ? t.noWorkers : t.fewWorkers(g.workers), cx, cy, 18, HUD.hintDanger, HUD.pillBgStrong);
  }

  if (isTouch && playing) {
    for (const b of PLACE_BUTTONS) {
      ctx.fillStyle = HUD.touchButtonBg;
      ctx.strokeStyle = HUD.touchButtonBorder;
      ctx.lineWidth = 2;
      ctx.fillRect(b.x, b.y, PLACE_BTN_W, PLACE_BTN_H);
      ctx.strokeRect(b.x, b.y, PLACE_BTN_W, PLACE_BTN_H);
      ctx.fillStyle = HUD.touchButtonText;
      ctx.font = FONTS.touchButton;
      ctx.textAlign = "center";
      ctx.fillText(t.place, b.x + PLACE_BTN_W / 2, b.y + PLACE_BTN_H / 2 + 7);
    }
  }
}

function drawTopBar(ctx: CanvasRenderingContext2D, g: GameData, t: Texts, highScore: number) {
  ctx.fillStyle = HUD.bar;
  ctx.fillRect(0, 0, CANVAS_W, 24);
  ctx.fillStyle = HUD.text;
  ctx.font = FONTS.hud;
  ctx.textAlign = "left";
  ctx.fillText(`${t.level} ${g.level}`, 10, 17);
  ctx.fillText(`${t.floors}: ${floorsBuilt(g)}`, 80, 17);
  ctx.textAlign = "right";
  ctx.fillText(`${t.record}: ${highScore}`, CANVAS_W - 10, 17);

  const hpRatio = g.towerHp / MAX_TOWER_HP;
  drawMeter(
    ctx,
    CANVAS_W / 2 - 40,
    hpRatio > 0.5 ? HUD.hpHigh : hpRatio > 0.2 ? HUD.hpMid : HUD.hpLow,
    hpRatio,
    `${g.towerHp}/${MAX_TOWER_HP}`,
  );

  const workersRatio = g.workers / MAX_WORKERS;
  drawMeter(
    ctx,
    CANVAS_W - 200,
    workersRatio > 0.4 ? HUD.workers : HUD.workersLow,
    workersRatio,
    `${g.workers} ${t.workers}`,
  );
}

/** 80px wide bar in the top bar with a centered label. */
function drawMeter(ctx: CanvasRenderingContext2D, x: number, color: string, ratio: number, label: string) {
  const w = 80;
  ctx.fillStyle = HUD.meterBg;
  ctx.fillRect(x, 6, w, 12);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, 7, (w - 2) * ratio, 10);
  ctx.fillStyle = HUD.text;
  ctx.font = FONTS.hudSmall;
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, 15);
}

/** Desktop crosshair; red and bigger over a helicopter. */
export function drawAim(ctx: CanvasRenderingContext2D, g: GameData) {
  const { x, y } = g.aim;
  const locked = g.helicopters.some(
    (h) => h.active && x > h.x - 16 && x < h.x + HELICOPTER_SIZE && y > h.y && y < h.y + HELICOPTER_SIZE,
  );
  const r = locked ? 13 : 10;
  for (const [color, width] of [
    [AIM.halo, 4],
    [locked ? AIM.locked : AIM.idle, 2],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      ctx.moveTo(x + dx * (r - 4), y + dy * (r - 4));
      ctx.lineTo(x + dx * (r + 6), y + dy * (r + 6));
    }
    ctx.stroke();
  }
}
