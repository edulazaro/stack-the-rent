import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CANVAS_H, CANVAS_W, PLACE_BTN_H, PLACE_BTN_W, PLACE_BUTTONS } from "./game/constants";
import { floorsBuilt, placeBlock, shoot, update } from "./game/logic";
import { createGame, resetGame } from "./game/state";
import { TEXT } from "./game/texts";
import type { EndReason, GameEvents } from "./game/types";
import { render } from "./render";
import { isMuted, setMuted, unlockAudio } from "./shell/audio";
import type { Locale } from "./shell/i18n";
import { LocaleSwitch, useLocale } from "./shell/i18n";
import type { HelpItem } from "./shell/menu";
import { HelpList, MenuButton, MenuLayer, MenuTitle } from "./shell/menu";
import {
  EMBED,
  fitCanvas,
  isTouchDevice,
  loadHighScore,
  STAGE_TEXT,
  Stage,
  saveHighScore,
  startFixedLoop,
  useImmersive,
  usePause,
  vibrate,
} from "./shell/stage";
import { playSound } from "./sounds";

const RESTART_DELAY_MS = 700;
const HIGHSCORE_KEY = "stack-the-rent-highscore";

export default function StackTheRent({ locale: hostLocale }: { locale?: Locale } = {}) {
  const { locale, setLocale, canChoose } = useLocale(hostLocale);
  const t = TEXT[locale];
  const s = STAGE_TEXT[locale];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [isTouch] = useState(isTouchDevice);
  const view = useImmersive(stageRef);
  const { immersive, portrait, enter } = view;
  const [game] = useState(createGame);
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [subScreen, setSubScreen] = useState<"help" | "settings" | null>(null);
  const [result, setResult] = useState({ score: 0, newRecord: false, reason: "miss" as EndReason });
  const [soundOff, setSoundOff] = useState(isMuted);
  const highScoreRef = useRef(loadHighScore(HIGHSCORE_KEY));
  const endedAtRef = useRef(0);

  const [userPaused, setUserPaused] = usePause(gameState === "playing", immersive);
  const paused = gameState === "playing" && (userPaused || (isTouch && (!immersive || portrait)));
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const events = useMemo<GameEvents>(
    () => ({
      sound: playSound,
      vibrate,
      end: (reason) => {
        const score = floorsBuilt(game);
        const newRecord = score > highScoreRef.current;
        if (newRecord) {
          highScoreRef.current = score;
          saveHighScore(HIGHSCORE_KEY, score);
        }
        setResult({ score, newRecord, reason });
        endedAtRef.current = performance.now();
        setGameState("gameover");
      },
    }),
    [game],
  );

  const place = useCallback(() => placeBlock(game, t, events), [game, t, events]);

  const toCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left) * (CANVAS_W / rect.width), y: (clientY - rect.top) * (CANVAS_H / rect.height) };
  }, []);

  const startGame = useCallback(() => {
    resetGame(game, t);
    setUserPaused(false);
    setSubScreen(null);
    setGameState("playing");
  }, [game, t, setUserPaused]);

  const play = useCallback(() => {
    if (performance.now() - endedAtRef.current < RESTART_DELAY_MS) return;
    unlockAudio();
    if (isTouch) enter();
    startGame();
  }, [isTouch, enter, startGame]);

  const resume = useCallback(() => {
    setUserPaused(false);
    if (isTouch) enter();
  }, [setUserPaused, isTouch, enter]);

  const toggleMute = useCallback(() => {
    const next = !isMuted();
    setMuted(next);
    setSoundOff(next);
  }, []);

  const openGame = useCallback(() => {
    unlockAudio();
    enter();
  }, [enter]);

  const toMenu = useCallback(() => {
    game.ended = true;
    setUserPaused(false);
    setSubScreen(null);
    setGameState("menu");
  }, [game, setUserPaused]);

  // Game loop. In the menu it draws a single frame as the backdrop
  useEffect(() => {
    if (gameState === "gameover") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const info = { t, isTouch, playing: gameState === "playing", highScore: highScoreRef.current };
    const step = () => {
      update(game, t, events);
      fitCanvas(canvas, ctx, CANVAS_W, CANVAS_H);
      render(ctx, game, info);
      return !game.ended;
    };
    if (gameState === "menu") {
      resetGame(game, t);
      step();
      const observer = new ResizeObserver(() => {
        fitCanvas(canvas, ctx, CANVAS_W, CANVAS_H);
        render(ctx, game, info);
      });
      observer.observe(canvas);
      return () => observer.disconnect();
    }
    return startFixedLoop(step, () => pausedRef.current);
  }, [game, gameState, isTouch, t, events]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyM") {
        if (!e.repeat) toggleMute();
        return;
      }
      if (subScreen) {
        if (e.code === "Escape" || e.code === "Backspace") {
          e.preventDefault();
          setSubScreen(null);
        }
        return;
      }
      const playing = gameState === "playing";
      if (playing && (e.code === "KeyP" || e.code === "Escape")) {
        e.preventDefault();
        if (paused && e.code === "KeyP") resume();
        else setUserPaused(true);
        return;
      }
      if (e.code !== "Space" && e.code !== "Enter") return;
      if (!playing) {
        if ((e.target as HTMLElement).closest("a, button")) return;
        e.preventDefault();
        if (!e.repeat) play();
        return;
      }
      e.preventDefault();
      if (e.repeat) return;
      if (paused) resume();
      else place();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameState, subScreen, paused, place, play, resume, setUserPaused, toggleMute]);

  // Touch: the BUILD buttons place floors, any other tap shoots or opens the border
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onTouch = (e: TouchEvent) => {
      if (gameState !== "playing") return;
      e.preventDefault();
      for (const touch of Array.from(e.changedTouches)) {
        const { x, y } = toCanvas(touch.clientX, touch.clientY);
        const onButton = PLACE_BUTTONS.some(
          (b) => x > b.x - 10 && x < b.x + PLACE_BTN_W + 10 && y > b.y - 10 && y < b.y + PLACE_BTN_H + 10,
        );
        if (onButton) place();
        else shoot(game, x, y, 30, events);
      }
    };
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    return () => canvas.removeEventListener("touchstart", onTouch);
  }, [game, gameState, place, events, toCanvas]);

  const helpItems: HelpItem[] = [
    { chip: isTouch ? t.place : t.keySpace, chipClass: "bg-white text-black", text: t.helpPlace },
    { chip: isTouch ? t.keyTap : t.keyClick, chipClass: "bg-white text-black", text: t.helpShoot },
    { chip: t.chipBorder, chipClass: "bg-red-500 text-white", text: t.helpBorder },
    { chip: t.unionBlock, chipClass: "bg-yellow-500 text-black", text: t.helpUnion },
    { chip: t.chipClimbers, chipClass: "bg-orange-500 text-white", text: t.helpClimbers },
  ];
  const soundLabel = soundOff ? s.soundOff : s.soundOn;

  let screen: ReactNode = null;
  if (subScreen === "help") {
    screen = (
      <MenuLayer dim="bg-black/85">
        <MenuTitle title={t.howTo} />
        <HelpList items={helpItems} />
        <p className="max-w-2xl text-xs text-gray-400">{t.helpFooter}</p>
        {!isTouch && <p className="text-xs text-gray-400">{t.helpKeys}</p>}
        <div className="mt-2">
          <MenuButton onClick={() => setSubScreen(null)}>{s.back}</MenuButton>
        </div>
      </MenuLayer>
    );
  } else if (subScreen === "settings") {
    screen = (
      <MenuLayer dim="bg-black/85">
        <MenuTitle title={s.settings} />
        <MenuButton onClick={toggleMute}>{soundLabel}</MenuButton>
        {!isTouch && (
          <MenuButton onClick={view.toggleFullscreen}>{view.fullscreen ? s.exitFullscreen : s.fullscreen}</MenuButton>
        )}
        {canChoose && <LocaleSwitch locale={locale} onChange={setLocale} label={s.language} />}
        <div className="mt-2">
          <MenuButton onClick={() => setSubScreen(null)}>{s.back}</MenuButton>
        </div>
      </MenuLayer>
    );
  } else if (gameState === "menu") {
    screen = (
      <MenuLayer>
        <MenuTitle title="STACK THE RENT" subtitle={t.tagline} />
        {highScoreRef.current > 0 && (
          <p className="font-mono text-xs text-gray-400">
            {t.record}: {highScoreRef.current}
          </p>
        )}
        <MenuButton primary onClick={play}>
          {s.play}
        </MenuButton>
        <MenuButton onClick={() => setSubScreen("help")}>{t.howTo}</MenuButton>
        <MenuButton onClick={() => setSubScreen("settings")}>{s.settings}</MenuButton>
      </MenuLayer>
    );
  } else if (gameState === "gameover") {
    screen = (
      <MenuLayer dim="bg-black/60">
        <MenuTitle title="GAME OVER" subtitle={result.reason === "collapse" ? t.lostCollapse : t.lostMiss} />
        <p className="font-mono text-4xl font-bold">
          {result.score} {t.floorsUnit}
        </p>
        {result.newRecord ? (
          <p className="text-sm text-yellow-400">{t.newRecord}</p>
        ) : (
          <p className="font-mono text-xs text-gray-400">
            {t.record}: {highScoreRef.current}
          </p>
        )}
        <div className="mt-2 flex flex-col items-center gap-2">
          <MenuButton primary onClick={play}>
            {s.playAgain}
          </MenuButton>
          <MenuButton onClick={toMenu}>{s.menu}</MenuButton>
        </div>
      </MenuLayer>
    );
  } else if (userPaused) {
    screen = (
      <MenuLayer dim="bg-black/80">
        <MenuTitle title={s.paused} />
        <MenuButton primary onClick={resume}>
          {s.resume}
        </MenuButton>
        <MenuButton onClick={() => setSubScreen("help")}>{t.howTo}</MenuButton>
        <MenuButton onClick={() => setSubScreen("settings")}>{s.settings}</MenuButton>
        <MenuButton onClick={toMenu}>{s.quit}</MenuButton>
      </MenuLayer>
    );
  }

  const launcher = (
    <button
      type="button"
      onClick={openGame}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/70 text-center text-white"
    >
      <span className="font-mono text-2xl font-bold">STACK THE RENT</span>
      <span className="mt-2 text-sm text-gray-300">{gameState === "playing" ? s.tapToResume : s.tapToPlay}</span>
    </button>
  );

  const stage = (
    <Stage
      stageRef={stageRef}
      view={view}
      onPause={gameState === "playing" && !paused ? () => setUserPaused(true) : undefined}
      muted={soundOff}
      onToggleMute={toggleMute}
      locale={locale}
      launcher={launcher}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className={`block h-full w-full cursor-none touch-none ${immersive ? "" : "border border-black"}`}
        onMouseMove={(e) => {
          const p = toCanvas(e.clientX, e.clientY);
          game.aim = { x: p.x, y: p.y, visible: true };
        }}
        onMouseLeave={() => {
          game.aim.visible = false;
        }}
        onClick={(e) => {
          // Click only shoots at helicopters, does NOT place block
          if (gameState !== "playing") return;
          const p = toCanvas(e.clientX, e.clientY);
          shoot(game, p.x, p.y, 25, events);
        }}
      />
      {screen}
    </Stage>
  );

  if (EMBED) return stage;

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Stack the Rent</h1>
        <p className="mt-2 text-xs text-gray-500 md:text-sm">{t.description}</p>
        {stage}
      </div>
    </div>
  );
}
