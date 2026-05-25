import { GameScene, PlatformDef, EnemyDef, CollectibleDef, SpikeDef, VortexDef } from "./GameScene";

export class Level3Scene extends GameScene {
  protected levelNumber = 3;
  protected worldWidth = 3840;
  protected worldHeight = 720;
  protected spawnX = 120;
  protected spawnY = 570;
  protected exitX = 3700;
  protected exitY = 540;
  protected nextScene = "Level4Scene";

  constructor() {
    super("Level3Scene");
  }

  create() {
    super.create();
    this.addProximityHint(460, "\u26a0 PULSAR ahead \u2014 [E] Time Slow to dodge its shots!");
    this.addProximityHint(900, "[Up] while touching a wall to WALL CLIMB!");
    this.addProximityHint(1620, "\u26a0 Collapse zone \u2014 keep moving or fall through!");
  }

  buildPlatforms(): PlatformDef[] {
    return [
      // Ground (lots of gaps)
      { x: 0,    y: 680, w: 320 },
      { x: 440,  y: 680, w: 240 },
      { x: 820,  y: 680, w: 240 },
      { x: 1200, y: 680, w: 200 },
      { x: 1600, y: 680, w: 240 },
      { x: 2000, y: 680, w: 200 },
      { x: 2400, y: 680, w: 240 },
      { x: 2800, y: 680, w: 200 },
      { x: 3200, y: 680, w: 240 },
      { x: 3560, y: 680, w: 280 },

      // Section 1: Opening
      { x: 80,  y: 580, w: 128 },
      { x: 220, y: 500, w: 96  },
      { x: 340, y: 420, w: 96  },

      // Section 2: Pulsar gauntlet
      { x: 480, y: 580, w: 96  },
      { x: 580, y: 500, w: 96  },
      { x: 680, y: 420, w: 128 },
      { x: 800, y: 340, w: 96  },
      { x: 700, y: 260, w: 128 },

      // Section 3: Phase Shifter maze
      { x: 900,  y: 580, w: 96  },
      { x: 1000, y: 500, w: 96  },
      { x: 1100, y: 420, w: 96  },
      { x: 1000, y: 340, w: 96  },
      { x: 1100, y: 260, w: 128 },

      // Section 4: Tight gaps
      { x: 1260, y: 560, w: 80  },
      { x: 1380, y: 480, w: 80  },
      { x: 1480, y: 400, w: 96  },
      { x: 1380, y: 320, w: 96  },
      { x: 1480, y: 240, w: 128 },

      // Section 5: Collapse zone
      { x: 1640, y: 560, w: 96,  type: "collapse" },
      { x: 1760, y: 480, w: 96,  type: "collapse" },
      { x: 1860, y: 400, w: 96,  type: "collapse" },
      { x: 1760, y: 320, w: 96,  type: "collapse" },
      { x: 1880, y: 560, w: 96  },
      { x: 2000, y: 480, w: 128 },

      // Section 6: Vortex section
      { x: 2060, y: 560, w: 128 },
      { x: 2180, y: 480, w: 96  },
      { x: 2280, y: 400, w: 128 },
      { x: 2200, y: 320, w: 96  },
      { x: 2300, y: 240, w: 128 },

      // Section 7: Boss gauntlet
      { x: 2460, y: 560, w: 128 },
      { x: 2580, y: 480, w: 96  },
      { x: 2680, y: 400, w: 128 },
      { x: 2580, y: 320, w: 96  },
      { x: 2700, y: 240, w: 128 },

      // Section 8: Final approach
      { x: 2860, y: 560, w: 128 },
      { x: 2980, y: 480, w: 128 },
      { x: 3100, y: 400, w: 96  },
      { x: 3000, y: 320, w: 128 },

      // Section 9: Final sprint
      { x: 3260, y: 560, w: 128, type: "collapse" },
      { x: 3380, y: 480, w: 96  },
      { x: 3480, y: 560, w: 128 },
      { x: 3580, y: 480, w: 192 },
      { x: 3640, y: 560, w: 192 },
    ];
  }

  buildEnemies(): EnemyDef[] {
    return [
      // Drones
      { type: "drone", x: 480,  y: 560, patrolMin: 440,  patrolMax: 620  },
      { type: "drone", x: 1880, y: 540, patrolMin: 1880, patrolMax: 2020 },
      { type: "drone", x: 3380, y: 460, patrolMin: 3380, patrolMax: 3560 },

      // Phase Shifters
      { type: "phase_shifter", x: 1000, y: 480 },
      { type: "phase_shifter", x: 2180, y: 460 },
      { type: "phase_shifter", x: 2980, y: 460 },

      // Pulsars (multiple - the challenge)
      { type: "pulsar", x: 700,  y: 315, fireAngle: 270 },
      { type: "pulsar", x: 1480, y: 215, fireAngle: 180 },
      { type: "pulsar", x: 2300, y: 215, fireAngle: 225 },
      { type: "pulsar", x: 2700, y: 215, fireAngle: 135 },
      { type: "pulsar", x: 3100, y: 375, fireAngle: 200 },

      // doubled
      { type: "drone",         x: 580,  y: 480, patrolMin: 480,  patrolMax: 700  },
      { type: "drone",         x: 2860, y: 540, patrolMin: 2800, patrolMax: 3020 },
      { type: "drone",         x: 3480, y: 540, patrolMin: 3380, patrolMax: 3640 },
      { type: "phase_shifter", x: 340,  y: 400 },
      { type: "phase_shifter", x: 2580, y: 460 },
      { type: "phase_shifter", x: 3000, y: 380 },
      { type: "pulsar",        x: 800,  y: 315, fireAngle: 225 },
      { type: "pulsar",        x: 1100, y: 235, fireAngle: 180 },
      { type: "pulsar",        x: 2200, y: 295, fireAngle: 270 },
      { type: "pulsar",        x: 2580, y: 295, fireAngle: 135 },
      { type: "pulsar",        x: 3380, y: 455, fireAngle: 200 },
    ];
  }

  buildCollectibles(): CollectibleDef[] {
    return [
      // Crystals (5) — very challenging positions
      { type: "crystal", x: 800,  y: 310 },
      { type: "crystal", x: 1100, y: 230 },
      { type: "crystal", x: 1480, y: 210 },
      { type: "crystal", x: 2300, y: 210 },
      { type: "crystal", x: 3000, y: 290 },

      // Shards
      { type: "shard",  x: 340,  y: 390 },
      { type: "shard",  x: 680,  y: 390 },
      { type: "shard",  x: 1380, y: 290 },
      { type: "shard",  x: 2200, y: 290 },
      { type: "shard",  x: 2580, y: 290 },
      { type: "shard",  x: 3480, y: 530 },

      // Health (more generous for hard level)
      { type: "health", x: 660,   y: 640 },
      { type: "health", x: 1240,  y: 640 },
      { type: "health", x: 2000,  y: 640 },
      { type: "health", x: 2460,  y: 640 },
      { type: "health", x: 3240,  y: 640 },
    ];
  }

  buildSpikes(): SpikeDef[] {
    return [
      { x: 320,  y: 668, count: 6 },
      { x: 700,  y: 668, count: 4 },
      { x: 1080, y: 668, count: 4 },
      { x: 1440, y: 668, count: 3 },
      { x: 1860, y: 668, count: 3 },
      { x: 2240, y: 668, count: 4 },
      { x: 2620, y: 668, count: 4 },
      { x: 3060, y: 668, count: 4 },
      { x: 3400, y: 668, count: 3 },
    ];
  }

  buildVortexes(): VortexDef[] {
    return [
      { x: 2060, y: 300 },
      { x: 2580, y: 200 },
    ];
  }
}
