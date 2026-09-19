/** Every color and font the canvas uses. Colors that fade are RGB tuples, turned into CSS with `rgba`. */

type RGB = readonly [number, number, number];

export const rgba = ([r, g, b]: RGB, alpha: number) => `rgba(${r},${g},${b},${alpha})`;

export const WORLD = {
  skyTop: "#87CEEB",
  skyBottom: "#E0F0FF",
  mountains: "#B0C4B0",
  ground: "#4A4A4A",
  dust: [150, 140, 130] as RGB,
  ladder: "#8B4513",
};

export const TOWER = {
  windowLit: "#FFE066",
  windowSky: "#87CEEB",
  goldBorder: "#B8860B",
  goldDebris: "#DAA520",
  moving: "#FF4444",
  movingGoldBorder: "#DAA520",
  movingText: "white",
  movingGoldText: "#333",
  priceOnDark: "rgba(255,255,255,0.8)",
  priceOnLight: "rgba(0,0,0,0.7)",
};

export const OLD_MAN = {
  skin: "#FFDAB9",
  legs: "#5C4033",
  coat: "#8B7355",
  beret: "#333",
};

export const BUBBLE = {
  fill: "white",
  border: "black",
  text: "black",
};

export const HELICOPTER = {
  body: "#34423a",
  dark: "#1f2923",
  glass: "#9fd3ea",
  glint: "rgba(255,255,255,0.7)",
  stripe: "#C0392B",
  label: "#fff",
  wreckBody: "#2b2623",
  wreckDark: "#171412",
  wreckGlass: "#3a3a3a",
  wreckStripe: "#4a3a30",
  wreckLabel: "#777",
  tailDisc: "rgba(30,30,30,0.15)",
  rotorDisc: "rgba(30,30,30,0.18)",
  blade: "#1a1a1a",
  target: "rgba(230,57,70,0.45)",
};

export const CLIMBER = {
  rope: "#E9C46A",
  legs: "#264653",
  boots: "#1d1d1d",
  jacket: "#E76F51",
  harness: "#1d1d1d",
  skin: "#FFDAB9",
  axeHandle: "#8B5A2B",
  axeHead: "#9CA3AF",
  helmet: "#F9C74F",
};

export const BOMB = {
  body: "#222",
  nose: "#E63946",
};

export const PARTICLES = {
  flash: "#FFF3B0",
  fire: ["#FFE066", "#FFB703", "#FB8500", "#E63946"],
  smoke: "#6b6b6b",
  trail: "#555",
};

export const SHOT = {
  impact: [40, 40, 40] as RGB,
  ring: [251, 133, 0] as RGB,
  flash: [255, 209, 102] as RGB,
};

export const AIM = {
  halo: "rgba(255,255,255,0.7)",
  idle: "#1a1a1a",
  locked: "#E63946",
};

export const CAMERA = {
  frame: "#111",
  screen: "#1a2a1a",
  scanline: "rgba(0,255,0,0.03)",
  rec: "#EF4444",
  label: "#666",
  ground: "#2a3a2a",
  road: "#3a4a3a",
  open: "#22C55E",
  closedBooth: "#555",
  closed: "#EF4444",
  roof: "#333",
  tint: "rgba(0,255,0,0.05)",
  prompt: "#EF4444",
};

export const WORKER = {
  skin: "#C68642",
  hat: "#E11D48",
  stripe: "#FDE047",
  poncho: "#DC2626",
  pants: "#1E3A5F",
  legs: "#4A3728",
};

export const HUD = {
  bar: "rgba(0,0,0,0.8)",
  text: "white",
  meterBg: "#333",
  hpHigh: "#22C55E",
  hpMid: "#EAB308",
  hpLow: "#EF4444",
  workers: "#F97316",
  workersLow: "#EF4444",
  strikeBg: "rgba(239,68,68,0.9)",
  strikeText: "#FFF",
  agreementBg: "rgba(218,165,32,0.9)",
  agreementText: "#333",
  perfect: [255, 215, 0] as RGB,
  politician: "#FF4444",
  pillBg: "rgba(0,0,0,0.5)",
  pillBgStrong: "rgba(0,0,0,0.6)",
  hintPlace: "#FFF",
  hintClimbers: "#E76F51",
  hintDanger: "#EF4444",
  touchButtonBg: "rgba(0,0,0,0.35)",
  touchButtonBorder: "rgba(255,255,255,0.7)",
  touchButtonText: "#FFF",
};

export const FONTS = {
  hud: "bold 12px monospace",
  hudSmall: "bold 9px monospace",
  banner: "bold 11px monospace",
  perfect: "bold 32px monospace",
  price: "bold 8px monospace",
  movingPrice: "bold 9px monospace",
  movingGoldPrice: "bold 10px monospace",
  bubble: "11px sans-serif",
  bubbleSmall: "10px sans-serif",
  politician: "bold 13px sans-serif",
  heliLabel: "bold 6px monospace",
  rec: "bold 7px monospace",
  cameraLabel: "6px monospace",
  cameraPrompt: "bold 12px monospace",
  touchButton: "bold 20px monospace",
  pill: (size: number) => `bold ${size}px monospace`,
};
