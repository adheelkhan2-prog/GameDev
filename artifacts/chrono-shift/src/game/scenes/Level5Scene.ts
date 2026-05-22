import { GameScene, PlatformDef, EnemyDef, CollectibleDef, SpikeDef, VortexDef } from "./GameScene";
import { COLORS } from "../constants";

export class Level5Scene extends GameScene {
  protected levelNumber = 5;
  protected worldWidth = 4200;
  protected worldHeight = 720;
  protected spawnX = 140;
  protected spawnY = 560;
  protected exitX = 4060;
  protected exitY = 556;
  protected nextScene = "BossScene";
  protected totalCrystals = 5;
  protected defaultTileKey = "platform_future";
  protected bgColor = COLORS.FUTURE_GROUND;

  constructor() {
    super("Level5Scene");
  }

  buildPlatforms(): PlatformDef[] {
    return [
      { x: 0,    y: 640, w: 4200, h: 80 },
      { x: 100,  y: 560, w: 220,  h: 22 },
      { x: 380,  y: 480, w: 180,  h: 22 },
      { x: 600,  y: 400, w: 140,  h: 22 },
      { x: 780,  y: 320, w: 160,  h: 22 },
      { x: 980,  y: 400, w: 120,  h: 22, type: "collapse" },
      { x: 1140, y: 480, w: 200,  h: 22 },
      { x: 1380, y: 400, w: 160,  h: 22 },
      { x: 1580, y: 320, w: 200,  h: 22 },
      { x: 1820, y: 240, w: 160,  h: 22, type: "collapse" },
      { x: 2020, y: 320, w: 180,  h: 22 },
      { x: 2240, y: 400, w: 160,  h: 22 },
      { x: 2440, y: 480, w: 180,  h: 22 },
      { x: 2660, y: 380, w: 120,  h: 22 },
      { x: 2820, y: 300, w: 120,  h: 22, type: "collapse" },
      { x: 2980, y: 220, w: 140,  h: 22 },
      { x: 3160, y: 300, w: 120,  h: 22 },
      { x: 3320, y: 380, w: 120,  h: 22, type: "collapse" },
      { x: 3480, y: 300, w: 200,  h: 22 },
      { x: 3700, y: 380, w: 160,  h: 22 },
      { x: 3880, y: 460, w: 200,  h: 22 },
      { x: 3980, y: 556, w: 220,  h: 22 },
    ];
  }

  buildEnemies(): EnemyDef[] {
    return [
      { type: "drone",         x: 500,  y: 450, patrolMin: 380,  patrolMax: 780  },
      { type: "chaser",        x: 660,  y: 610, patrolMin: 580,  patrolMax: 960  },
      { type: "pulsar",        x: 800,  y: 290 },
      { type: "chaser",        x: 1050, y: 610, patrolMin: 980,  patrolMax: 1350 },
      { type: "phase_shifter", x: 1200, y: 450 },
      { type: "phase_shifter", x: 1480, y: 600 },
      { type: "pulsar",        x: 1680, y: 290 },
      { type: "chaser",        x: 1900, y: 610, patrolMin: 1820, patrolMax: 2200 },
      { type: "drone",         x: 2030, y: 290, patrolMin: 2020, patrolMax: 2420 },
      { type: "chaser",        x: 2100, y: 610, patrolMin: 2020, patrolMax: 2430 },
      { type: "drone",         x: 2350, y: 450, patrolMin: 2240, patrolMax: 2650 },
      { type: "phase_shifter", x: 2680, y: 350 },
      { type: "chaser",        x: 2750, y: 610, patrolMin: 2660, patrolMax: 2980 },
      { type: "pulsar",        x: 2990, y: 190 },
      { type: "phase_shifter", x: 3200, y: 600 },
      { type: "chaser",        x: 3500, y: 610, patrolMin: 3380, patrolMax: 3880 },
      { type: "drone",         x: 3750, y: 350, patrolMin: 3480, patrolMax: 3980 },
      { type: "pulsar",        x: 3880, y: 430 },
      { type: "chaser",        x: 3980, y: 610, patrolMin: 3880, patrolMax: 4180 },
    ];
  }

  buildCollectibles(): CollectibleDef[] {
    return [
      { x: 660,  y: 370 },
      { x: 1220, y: 450 },
      { x: 1900, y: 210 },
      { x: 3040, y: 190 },
      { x: 3750, y: 350 },
    ];
  }

  buildSpikes(): SpikeDef[] {
    return [
      // Floor spikes (ground top = 640-40 = 600)
      { x: 720,  y: 600, count: 3 },
      { x: 1320, y: 600, count: 4 },
      { x: 2340, y: 600, count: 4 },
      { x: 3060, y: 600, count: 3 },
      { x: 3700, y: 600, count: 4 },
      // Elevated platform spikes
      // Platform { x:600, y:400, h:22 } → top = 400-11 = 389
      { x: 660,  y: 389, count: 1 },
      // Platform { x:1580, y:320, h:22 } → top = 320-11 = 309
      { x: 1640, y: 309, count: 2 },
      // Platform { x:2240, y:400, h:22 } → top = 400-11 = 389
      { x: 2280, y: 389, count: 2 },
      // Platform { x:3480, y:300, h:22 } → top = 300-11 = 289
      { x: 3530, y: 289, count: 2 },
      // Platform { x:3700, y:380, h:22 } → top = 380-11 = 369
      { x: 3740, y: 369, count: 2 },
    ];
  }

  buildVortexes(): VortexDef[] {
    return [
      { x: 1700, y: 580 },
      { x: 3100, y: 580 },
    ];
  }
}
