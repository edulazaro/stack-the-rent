import { BORDER_X, CAM_H, CAM_W, CAM_X, CAM_Y } from "../game/constants";
import type { Texts } from "../game/texts";
import type { GameData } from "../game/types";
import { CAMERA, FONTS, WORKER } from "./theme";

/** CCTV monitor showing the border booth and the workers waiting to cross. */
export function drawBorderCamera(ctx: CanvasRenderingContext2D, g: GameData, t: Texts, isTouch: boolean) {
  const x = CAM_X;
  const y = CAM_Y;

  ctx.fillStyle = CAMERA.frame;
  ctx.fillRect(x - 4, y - 4, CAM_W + 8, CAM_H + 20);
  ctx.fillStyle = CAMERA.screen;
  ctx.fillRect(x, y, CAM_W, CAM_H);
  ctx.fillStyle = CAMERA.scanline;
  for (let sy = y; sy < y + CAM_H; sy += 3) ctx.fillRect(x, sy, CAM_W, 1);

  if (g.frame % 60 < 40) {
    ctx.fillStyle = CAMERA.rec;
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = CAMERA.rec;
  ctx.font = FONTS.rec;
  ctx.textAlign = "left";
  ctx.fillText("REC", x + 16, y + 13);
  ctx.fillStyle = CAMERA.label;
  ctx.font = FONTS.cameraLabel;
  ctx.textAlign = "center";
  ctx.fillText(t.camLabel, x + CAM_W / 2, y + CAM_H + 12);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, CAM_W, CAM_H);
  ctx.clip();

  ctx.fillStyle = CAMERA.ground;
  ctx.fillRect(x, y + CAM_H - 15, CAM_W, 15);
  ctx.fillStyle = CAMERA.road;
  ctx.fillRect(x, y + CAM_H - 20, CAM_W, 8);
  drawBooth(ctx, x + 55, y + CAM_H - 45, g.borderOpen);

  for (const wg of g.workerGroups) {
    if (wg.arrived) continue;
    for (let wi = 0; wi < wg.count; wi++) {
      // Map world x around the border into the camera view
      const cx = x + ((wg.x + wi * 16 - BORDER_X + 60) / 140) * CAM_W;
      if (cx < x - 5 || cx > x + CAM_W + 5) continue;
      drawWorker(ctx, cx, y + CAM_H - 12, Math.sin(g.frame * 0.12 + wi) * 2);
    }
  }

  ctx.fillStyle = CAMERA.tint;
  ctx.fillRect(x, y, CAM_W, CAM_H);
  ctx.restore();

  const waiting = g.workerGroups.some((wg) => !wg.arrived && wg.x <= BORDER_X + 30);
  if (waiting && !g.borderOpen && g.collapseTimer === 0 && g.frame % 30 < 20) {
    ctx.fillStyle = CAMERA.prompt;
    ctx.font = FONTS.cameraPrompt;
    ctx.textAlign = "center";
    ctx.fillText(isTouch ? t.camTouch : t.camKey, x + CAM_W / 2, y + CAM_H + 30);
  }
}

function drawBooth(ctx: CanvasRenderingContext2D, x: number, y: number, open: boolean) {
  ctx.fillStyle = open ? CAMERA.open : CAMERA.closedBooth;
  ctx.fillRect(x, y, 25, 30);
  ctx.fillStyle = CAMERA.roof;
  ctx.fillRect(x - 3, y - 3, 31, 5);

  ctx.strokeStyle = open ? CAMERA.open : CAMERA.closed;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 8);
  if (open) ctx.lineTo(x, y - 12);
  else ctx.lineTo(x - 35, y + 8);
  ctx.stroke();

  ctx.fillStyle = open ? CAMERA.open : CAMERA.closed;
  ctx.beginPath();
  ctx.arc(x + 12, y + 10, 3, 0, Math.PI * 2);
  ctx.fill();
}

/** Worker in chullo hat and poncho; `groundY` is where the feet rest. */
function drawWorker(ctx: CanvasRenderingContext2D, x: number, groundY: number, legSwing: number) {
  ctx.fillStyle = WORKER.skin;
  ctx.beginPath();
  ctx.arc(x + 2, groundY - 17, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = WORKER.hat;
  ctx.fillRect(x - 2, groundY - 22, 8, 4);
  ctx.fillStyle = WORKER.stripe;
  ctx.fillRect(x - 2, groundY - 19, 8, 2);
  ctx.fillStyle = WORKER.hat;
  ctx.fillRect(x - 1, groundY - 25, 6, 4);

  ctx.fillStyle = WORKER.poncho;
  ctx.fillRect(x - 2, groundY - 12, 10, 6);
  ctx.fillStyle = WORKER.stripe;
  ctx.fillRect(x - 2, groundY - 9, 10, 2);

  ctx.fillStyle = WORKER.pants;
  ctx.fillRect(x - 1, groundY - 6, 8, 4);

  ctx.fillStyle = WORKER.legs;
  ctx.fillRect(x, groundY - 2, 3, 4 + legSwing);
  ctx.fillRect(x + 4, groundY - 2, 3, 4 - legSwing);
}
