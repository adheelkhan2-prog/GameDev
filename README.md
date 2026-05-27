# Chrono Shift

A time-manipulation platformer built with Phaser 3, React, Vite, and TypeScript.

## Run & Operate

- `pnpm --filter @workspace/chrono-shift run dev` — run the game (port 5173)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Game engine: Phaser 3 (WebGL)
- Frontend wrapper: React + Vite
- All textures: procedurally generated in BootScene (no asset files)
- All audio: synthesised via Web Audio API

## Where things live

```
artifacts/chrono-shift/src/game/
  scenes/           — All game scenes (Boot, Menu, Level1-5, Boss, Cutscene, etc.)
  objects/          — Player, Collectible, Projectile, enemies/
  managers/         — TimeManager, UIManager, SoundManager, GhostReplayManager
  utils/            — settings.ts, leaderboard.ts
  constants.ts      — All tuning values and DIFFICULTY config
  config.ts         — Phaser game config + scene registry
```

## Architecture decisions

- **Abstract GameScene** — All level scenes extend `GameScene` which provides platforms, enemies, collectibles, UI, camera, pause menu, and ghost replay. Levels only implement `buildPlatforms()`, `buildEnemies()`, `buildCollectibles()`, `buildSpikes()`.
- **BossScene extends GameScene** — Overrides `handleLevelComplete()` to skip LevelCompleteScene and go directly to VictoryScene after the boss is defeated.
- **Difficulty system** — Three modes (EASY/NORMAL/HARD) stored in localStorage. Applied at level start to enemy speed multipliers and player health. Set in Settings panel in MenuScene.
- **Procedural audio** — All sounds synthesised in SoundManager from oscillators and noise buffers. No audio files required.
- **Ghost replay** — Previous run's path is recorded per-level in localStorage and replayed as a translucent ghost.

## Product

5-level platformer + boss chamber:
- **Level 1-3**: Classic time-crystal collection with drones, phase shifters, pulsars
- **Level 4** (Ruins): Ruins theme, chaser enemies, collapse platforms
- **Level 5** (Future): Neon future theme, harder density, wall sections
- **Boss Chamber**: 3-phase Temporal Guardian boss fight
- **Unlockable abilities**: Double Jump (after L1), Dash/Q (after L2), Wall Climb (after L3)
- **Time powers**: Time Slow (E), Time Rewind (R)
- **Ghost Replay**: See your previous run as a ghost

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck` after editing — TS errors will crash the game silently at runtime.
- All textures are generated in `BootScene.createTextures()` — new sprite types need entries there.
- `GameScene.handleLevelComplete()` is `protected` — BossScene overrides it to go to VictoryScene directly.
- Difficulty is stored in localStorage. The `init()` data `difficulty` field takes precedence over saved settings.
- EnemyBase `baseSpeedMultiplier` defaults to 1.0. Set it after enemy construction to apply difficulty scaling.
