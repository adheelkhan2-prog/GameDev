import { GameScene, PlatformDef, EnemyDef, CollectibleDef, SpikeDef, VortexDef } from "./GameScene";
import { COLORS } from "../constants";

const WAVE_CHECKPOINTS = [1200, 2000, 2800, 3400];
const WAVE_DEFS: EnemyDef[][] = [
  [
    { type: "chaser", x: 1350, y: 610, patrolMin: 1200, patrolMax: 1700 },
    { type: "chaser", x: 1650, y: 610, patrolMin: 1500, patrolMax: 1900 },
  ],
  [
    { type: "drone",  x: 2050, y: 380, patrolMin: 2000, patrolMax: 2300 },
    { type: "chaser", x: 2150, y: 610, patrolMin: 2000, patrolMax: 2450 },
    { type: "chaser", x: 2450, y: 610, patrolMin: 2300, patrolMax: 2700 },
  ],
  [
    { type: "chaser",        x: 2900, y: 610, patrolMin: 2800, patrolMax: 3200 },
    { type: "phase_shifter", x: 2960, y: 600 },
    { type: "chaser",        x: 3150, y: 610, patrolMin: 3000, patrolMax: 3450 },
  ],
  [
    { type: "chaser", x: 3450, y: 610, patrolMin: 3400, patrolMax: 3700 },
    { type: "drone",  x: 3550, y: 350, patrolMin: 3400, patrolMax: 3750 },
    { type: "chaser", x: 3650, y: 610, patrolMin: 3550, patrolMax: 3800 },
  ],
];

export class Level4Scene extends GameScene {
  protected levelNumber = 4;
  protected worldWidth = 3800;
  protected worldHeight = 720;
  protected spawnX = 140;
  protected spawnY = 560;
  protected exitX = 3660;
  protected exitY = 556;
  protected nextScene = "Level5Scene";
  protected totalCrystals = 5;
  protected defaultTileKey = "platform_ruins";
  protected bgColor = COLORS.RUINS_GROUND;

  constructor() {
    super("Level4Scene");
  }

  buildPlatforms(): PlatformDef[] {
    return [
      { x: 0,    y: 640, w: 3800, h: 80  },
      { x: 100,  y: 560, w: 200,  h: 22  },
      { x: 380,  y: 500, w: 160,  h: 22  },
      { x: 580,  y: 440, w: 120,  h: 22,  type: "collapse" },
      { x: 740,  y: 500, w: 160,  h: 22  },
      { x: 940,  y: 420, w: 100,  h: 22,  type: "collapse" },
      { x: 1060, y: 360, w: 200,  h: 22  },
      { x: 1300, y: 430, w: 140,  h: 22  },
      { x: 1480, y: 360, w: 180,  h: 22  },
      { x: 1700, y: 400, w: 120,  h: 22,  type: "collapse" },
      { x: 1860, y: 340, w: 200,  h: 22  },
      { x: 2100, y: 410, w: 160,  h: 22  },
      { x: 2300, y: 560, w: 60,   h: 200 },
      { x: 2420, y: 460, w: 60,   h: 100 },
      { x: 2540, y: 380, w: 60,   h: 180 },
      { x: 2420, y: 320, w: 120,  h: 22,  type: "collapse" },
      { x: 2650, y: 440, w: 160,  h: 22  },
      { x: 2850, y: 380, w: 140,  h: 22  },
      { x: 3020, y: 320, w: 180,  h: 22  },
      { x: 3220, y: 260, w: 140,  h: 22,  type: "collapse" },
      { x: 3380, y: 320, w: 160,  h: 22  },
      { x: 3560, y: 400, w: 180,  h: 22  },
      { x: 3600, y: 556, w: 200,  h: 22  },
    ];
  }

  buildEnemies(): EnemyDef[] {
    return [
      { type: "drone",         x: 460,  y: 470, patrolMin: 380,  patrolMax: 720  },
      { type: "chaser",        x: 850,  y: 610, patrolMin: 750,  patrolMax: 1060 },
      { type: "phase_shifter", x: 1200, y: 600 },
      { type: "chaser",        x: 1380, y: 610, patrolMin: 1300, patrolMax: 1700 },
      { type: "drone",         x: 1560, y: 330, patrolMin: 1480, patrolMax: 1850 },
      { type: "pulsar",        x: 1870, y: 310 },
      { type: "chaser",        x: 1980, y: 610, patrolMin: 1860, patrolMax: 2280 },
      { type: "phase_shifter", x: 2110, y: 380 },
      { type: "pulsar",        x: 2440, y: 290 },
      { type: "chaser",        x: 2660, y: 610, patrolMin: 2550, patrolMax: 2850 },
      { type: "phase_shifter", x: 2700, y: 600 },
      { type: "drone",         x: 2920, y: 350, patrolMin: 2850, patrolMax: 3200 },
      { type: "chaser",        x: 3150, y: 610, patrolMin: 3000, patrolMax: 3400 },
      { type: "pulsar",        x: 3280, y: 230 },
      { type: "chaser",        x: 3450, y: 610, patrolMin: 3380, patrolMax: 3650 },
    ];
  }

  buildCollectibles(): CollectibleDef[] {
    return [
      { x: 470,  y: 460 },
      { x: 1140, y: 330 },
      { x: 1930, y: 370 },
      { x: 2480, y: 290 },
      { x: 3440, y: 290 },
    ];
  }

  buildSpikes(): SpikeDef[] {
    return [
      // Floor spikes (ground top = 640-40 = 600)
      { x: 660,  y: 600, count: 3 },
      { x: 1420, y: 600, count: 4 },
      { x: 2200, y: 600, count: 3 },
      { x: 3100, y: 600, count: 4 },
      // Elevated platform spikes
      // Platform { x:1060, y:360, h:22 } → top = 360-11 = 349
      { x: 1110, y: 349, count: 2 },
      // Platform { x:1860, y:340, h:22 } → top = 340-11 = 329
      { x: 1900, y: 329, count: 2 },
      // Platform { x:3020, y:320, h:22 } → top = 320-11 = 309
      { x: 3060, y: 309, count: 2 },
      // Platform { x:2650, y:440, h:22 } → top = 440-11 = 429
      { x: 2700, y: 429, count: 1 },
    ];
  }

  buildVortexes(): VortexDef[] {
    return [
      { x: 1950, y: 580 },
      { x: 3300, y: 580 },
    ];
  }

  private wavesSpawned = 0;

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.checkEnemyWaves();
  }

  private checkEnemyWaves(): void {
    if (!this.player || this.levelComplete || this.gameOver) return;
    while (
      this.wavesSpawned < WAVE_CHECKPOINTS.length &&
      this.player.x >= WAVE_CHECKPOINTS[this.wavesSpawned]
    ) {
      for (const def of WAVE_DEFS[this.wavesSpawned]) {
        this.spawnSingleEnemy(def);
      }
      this.showWaveAlert();
      this.wavesSpawned++;
    }
  }

  private showWaveAlert(): void {
    const W = this.scale.width;
    const banner = this.add
      .text(W / 2, 120, "⚠  REINFORCEMENTS INCOMING  ⚠", {
        fontSize: "18px",
        fontFamily: "monospace",
        color: "#ff4400",
        stroke: "#220000",
        strokeThickness: 3,
        backgroundColor: "#000000cc",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(92)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      duration: 300,
      ease: "Power2",
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: banner,
            alpha: 0,
            duration: 500,
            onComplete: () => banner.destroy(),
          });
        });
      },
    });
  }
}
