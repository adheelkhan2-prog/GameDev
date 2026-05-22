import { GameScene, PlatformDef, EnemyDef, CollectibleDef, SpikeDef, VortexDef } from "./GameScene";

export class Level2Scene extends GameScene {
  protected levelNumber = 2;
  protected worldWidth = 3200;
  protected worldHeight = 720;
  protected spawnX = 120;
  protected spawnY = 570;
  protected exitX = 3060;
  protected exitY = 560;
  protected nextScene = "Level3Scene";

  constructor() {
    super("Level2Scene");
  }

  buildPlatforms(): PlatformDef[] {
    return [
      // Ground sections (with more gaps)
      { x: 0,    y: 680, w: 480 },
      { x: 580,  y: 680, w: 320 },
      { x: 1020, y: 680, w: 320 },
      { x: 1500, y: 680, w: 280 },
      { x: 1920, y: 680, w: 320 },
      { x: 2380, y: 680, w: 280 },
      { x: 2800, y: 680, w: 400 },

      // Left section
      { x: 80,   y: 580, w: 160 },
      { x: 280,  y: 500, w: 128 },
      { x: 420,  y: 420, w: 160 },
      { x: 560,  y: 540, w: 128 },

      // Mid-low section
      { x: 640,  y: 580, w: 160 },
      { x: 800,  y: 500, w: 128 },
      { x: 880,  y: 420, w: 96  },
      { x: 960,  y: 340, w: 128 },

      // Upper path
      { x: 1080, y: 540, w: 160 },
      { x: 1220, y: 460, w: 128 },
      { x: 1340, y: 380, w: 160 },
      { x: 1200, y: 300, w: 128 },

      // Mid-right
      { x: 1520, y: 580, w: 160 },
      { x: 1680, y: 500, w: 128 },
      { x: 1820, y: 420, w: 160 },
      { x: 1760, y: 340, w: 96  },

      // Vortex zone platforms
      { x: 1960, y: 560, w: 128 },
      { x: 2080, y: 480, w: 128 },
      { x: 2200, y: 400, w: 128 },
      { x: 2100, y: 320, w: 96  },

      // Right section
      { x: 2420, y: 560, w: 160 },
      { x: 2560, y: 480, w: 160 },
      { x: 2700, y: 400, w: 128 },
      { x: 2820, y: 480, w: 160 },
      { x: 2940, y: 560, w: 192 },

      // Collapse platforms near end
      { x: 2460, y: 620, w: 96,  type: "collapse" },
      { x: 2620, y: 540, w: 96,  type: "collapse" },
    ];
  }

  buildEnemies(): EnemyDef[] {
    return [
      // Drones
      { type: "drone", x: 640,  y: 560, patrolMin: 580,  patrolMax: 780  },
      { type: "drone", x: 1520, y: 560, patrolMin: 1520, patrolMax: 1680 },
      { type: "drone", x: 2820, y: 460, patrolMin: 2820, patrolMax: 2990 },

      // Phase Shifters
      { type: "phase_shifter", x: 880,  y: 560 },
      { type: "phase_shifter", x: 1820, y: 400 },
      { type: "phase_shifter", x: 2560, y: 460 },

      // One Pulsar
      { type: "pulsar", x: 1200, y: 270, fireAngle: 180 },
    ];
  }

  buildCollectibles(): CollectibleDef[] {
    return [
      // Crystals (5) — placed in harder positions
      { type: "crystal", x: 420,  y: 390 },
      { type: "crystal", x: 960,  y: 310 },
      { type: "crystal", x: 1200, y: 270 },
      { type: "crystal", x: 2100, y: 290 },
      { type: "crystal", x: 2940, y: 520 },

      // Shards
      { type: "shard",  x: 280,  y: 470 },
      { type: "shard",  x: 800,  y: 470 },
      { type: "shard",  x: 1340, y: 350 },
      { type: "shard",  x: 1680, y: 470 },
      { type: "shard",  x: 2700, y: 370 },

      // Health
      { type: "health", x: 1100, y: 640 },
      { type: "health", x: 1960, y: 640 },
      { type: "health", x: 2840, y: 640 },
    ];
  }

  buildSpikes(): SpikeDef[] {
    return [
      { x: 488,  y: 668, count: 4 },
      { x: 900,  y: 668, count: 3 },
      { x: 1380, y: 668, count: 3 },
      { x: 1800, y: 668, count: 4 },
      { x: 2320, y: 668, count: 4 },
      { x: 2750, y: 668, count: 2 },
    ];
  }

  buildVortexes(): VortexDef[] {
    return [
      { x: 1960, y: 380 },
    ];
  }
}
