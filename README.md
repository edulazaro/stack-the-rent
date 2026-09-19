# Stack the Rent

<p align="center">
    <a href="https://github.com/edulazaro/stack-the-rent/actions/workflows/tests.yml"><img src="https://github.com/edulazaro/stack-the-rent/actions/workflows/tests.yml/badge.svg" alt="Tests"></a>
    <a href="https://github.com/edulazaro/stack-the-rent/blob/main/package.json"><img src="https://img.shields.io/github/package-json/v/edulazaro/stack-the-rent" alt="Version"></a>
    <a href="https://react.dev"><img src="https://img.shields.io/github/package-json/dependency-version/edulazaro/stack-the-rent/react" alt="React"></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/github/package-json/dependency-version/edulazaro/stack-the-rent/dev/typescript" alt="TypeScript"></a>
</p>

Arcade tower stacker about Andorra's housing market. Build the tallest tower you can while rent goes up with every floor, the old men comment from the ladders, the GOAT (Group Organized Against Towers) helicopters bomb it and climbers abseil down its sides to smash it.

![Stack the Rent](itch/cover.png)

Runs in the browser on desktop and mobile. English, Spanish and Catalan.

## How to play

| | Desktop | Mobile |
|---|---|---|
| Place a floor | Space | BUILD buttons |
| Shoot helicopters and climbers | Click | Tap |
| Open the border | Click the CCTV camera | Tap the CCTV camera |
| Pause | P or Esc | Pause button |
| Mute | M | Sound button |

- The better you line up a floor, the less of it gets trimmed off. A perfect drop keeps the full width.
- Every floor costs a worker. Run out and you can't build until you open the border and let more in.
- Golden union rep blocks trigger a strike (helicopters leave) or a collective agreement (free workers).
- Every 10 floors a new full-width platform appears.
- The tower has 5 hit points. Bombs and climbers take them away; at 0 it collapses.

On phones the game plays fullscreen in landscape.

## Development

Requires Node 24 and pnpm.

```bash
pnpm install
pnpm dev          # web page version at http://localhost:5301
pnpm dev:itch     # itch.io version (only the game, filling the viewport)
pnpm check        # types + lint/format (Biome) + tests (Vitest)
pnpm build        # production build in dist/
pnpm build:itch   # dist-itch/ and stack-the-rent-itch.zip, ready to upload to itch.io
```

## Project structure

```
src/
  game/      game logic without React or canvas (state, rules, texts, tests)
  render/    canvas drawing, reads the state and never changes it (theme.ts has every color and font)
  shell/     reusable shell: fixed 60 Hz loop, fullscreen/landscape handling, pause, menus, audio, i18n
  sounds.ts  every sound, synthesized with the Web Audio API
  Game.tsx   React layer: screens and input
itch/        cover, screenshots and store page text
```

Stack: Vite, React 19, TypeScript, Tailwind CSS v4. No game engine or asset files: everything is drawn with the Canvas 2D API and every sound is synthesized.

## Embedding

The game can be placed in another site with an iframe. The host can fix the language, which hides the in-game language selector:

```html
<iframe src="https://example.com/stack-the-rent/?lang=es" width="960" height="540" allow="fullscreen"></iframe>
```

```js
// Change the language later from the parent page
iframe.contentWindow.postMessage({ type: "set-locale", locale: "ca" }, "*");
```

Without `?lang`, the game uses the player's last choice or the browser language (English unless Spanish or Catalan).

## Credits

Originally made for [andorranos.com](https://andorranos.com).
