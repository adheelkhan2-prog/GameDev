import { GameScene, PlatformDef, EnemyDef, CollectibleDef, SpikeDef, CrateDef } from "./GameScene";

export class Level1Scene extends GameScene {
  protected levelNumber = 1;
  protected worldWidth = 2560;
  protected worldHeight = 720;
  protected spawnX = 120;
  protected spawnY = 550;
  protected exitX = 2420;
  protected exitY = 560;
  protected nextScene = "Level2Scene";
  protected levelTimeTarget = 90;

  constructor() {
    super("Level1Scene");
  }

  create() {
    super.create();
    this.addProximityHint(380, "Collect all CRYSTALS \u2605 then reach the EXIT \u25ba");
    this.addProximityHint(630, "\u26a0 SPIKES \u2014 one touch is fatal!");
    this.addProximityHint(700, "[SPACE] JUMP  \u2022  Fall on enemies to STOMP them!");
    this.addProximityHint(1380, "[E] TIME SLOW \u2014 slows everything around you");
  }

  buildPlatforms(): PlatformDef[] {
    return [
      // Ground sections
      { x: 0,    y: 680, w: 640 },
      { x: 700,  y: 680, w: 400 },
      { x: 1180, y: 680, w: 500 },
      { x: 1760, y: 680, w: 360 },
      { x: 2200, y: 680, w: 360 },

      // Floating platforms - left section
      { x: 80,   y: 580, w: 160 },
      { x: 300,  y: 520, w: 128 },
      { x: 480,  y: 460, w: 160 },

      // Mid-section
      { x: 720,  y: 580, w: 192 },
      { x: 920,  y: 500, w: 160 },
      { x: 1040, y: 420, w: 192 },
      { x: 820,  y: 380, w: 128 },

      // Upper path
      { x: 1200, y: 560, w: 160 },
      { x: 1380, y: 480, w: 192 },
      { x: 1540, y: 400, w: 160 },
      { x: 1420, y: 320, w: 128 },

      // Right section
      { x: 1780, y: 580, w: 192 },
      { x: 1960, y: 500, w: 160 },
      { x: 2100, y: 420, w: 128 },
      { x: 2220, y: 560, w: 192 },
      { x: 2350, y: 480, w: 192 },
    ];
  }

  buildEnemies(): EnemyDef[] {
    return [
      { type: "drone", x: 720,  y: 560, patrolMin: 720,  patrolMax: 880  },
      { type: "drone", x: 1380, y: 460, patrolMin: 1380, patrolMax: 1540 },
      // doubled
      { type: "drone", x: 300,  y: 500, patrolMin: 80,   patrolMax: 460  },
      { type: "drone", x: 1960, y: 480, patrolMin: 1780, patrolMax: 2100 },
    ];
  }

  buildCollectibles(): CollectibleDef[] {
    return [
      // Crystals (5)
      { type: "crystal", x: 300,  y: 490 },
      { type: "crystal", x: 820,  y: 350 },
      { type: "crystal", x: 1420, y: 290 },
      { type: "crystal", x: 1960, y: 460 },
      { type: "crystal", x: 2350, y: 440 },

      // Bonus shards
      { type: "shard",  x: 480,  y: 430 },
      { type: "shard",  x: 1040, y: 390 },
      { type: "shard",  x: 2100, y: 390 },

      // Health pickups
      { type: "health", x: 1100, y: 640 },
      { type: "health", x: 1800, y: 640 },
    ];
  }

  buildSpikes(): SpikeDef[] {
    return [
      { x: 660,  y: 668, count: 2 },
      { x: 1140, y: 668, count: 3 },
      { x: 1700, y: 668, count: 2 },
    ];
  }

  buildVortexes() {
    return [];
  }

  buildCrates(): CrateDef[] {
    return [
      { x: 560,  y: 428 },
      { x: 1136, y: 388 },
      { x: 2316, y: 528 },
    ];
  }
}
