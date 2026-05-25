import { GameScene, PlatformDef, EnemyDef, CollectibleDef, SpikeDef, VortexDef } from "./GameScene";
import { COLORS } from "../constants";

const WAVE_CHECKPOINTS = [1200, 2000, 2800, 3400];
const WAVE_DEFS: EnemyDef[][] = [
  [
    { type: "chaser", x: 1350, y: 610, patrolMin: 1200, patrolMax: 1700 },
    { type: "chaser", x: 1650, y: 610, patrolMin: 1500, patrolMax: 1900 },
    // doubled
    { type: "chaser",        x: 1250, y: 610, patrolMin: 1200, patrolMax: 1600 },
    { type: "phase_shifter", x: 1700, y: 600 },
  ],
  [
    { type: "drone",  x: 2050, y: 380, patrolMin: 2000, patrolMax: 2300 },
    { type: "chaser", x: 2150, y: 610, patrolMin: 2000, patrolMax: 2450 },
    { type: "chaser", x: 2450, y: 610, patrolMin: 2300, patrolMax: 2700 },
    // doubled
    { type: "drone",  x: 2200, y: 380, patrolMin: 2050, patrolMax: 2380 },
    { type: "chaser", x: 2350, y: 610, patrolMin: 2100, patrolMax: 2600 },
    { type: "chaser", x: 2600, y: 610, patrolMin: 2400, patrolMax: 2780 },
  ],
  [
    { type: "chaser",        x: 2900, y: 610, patrolMin: 2800, patrolMax: 3200 },
    { type: "phase_shifter", x: 2960, y: 600 },
    { type: "chaser",        x: 3150, y: 610, patrolMin: 3000, patrolMax: 3450 },
    // doubled
    { type: "chaser",        x: 3000, y: 610, patrolMin: 2850, patrolMax: 3300 },
    { type: "phase_shifter", x: 3050, y: 600 },
    { type: "chaser",        x: 3250, y: 610, patrolMin: 3100, patrolMax: 3500 },
  ],
  [
    { type: "chaser", x: 3450, y: 610, patrolMin: 3400, patrolMax: 3700 },
    { type: "drone",  x: 3550, y: 350, patrolMin: 3400, patrolMax: 3750 },
    { type: "chaser", x: 3650, y: 610, patrolMin: 3550, patrolMax: 3800 },
    // doubled
    { type: "chaser",        x: 3500, y: 610, patrolMin: 3420, patrolMax: 3720 },
    { type: "drone",         x: 3600, y: 350, patrolMin: 3430, patrolMax: 3760 },
    { type: "phase_shifter", x: 3580, y: 600 },
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
      { x: 1060, y: 360, w: 200,  h: 22,  type: "collapse" },
      { x: 1300, y: 430, w: 140,  h: 22,  type: "collapse" },
      { x: 1480, y: 360, w: 180,  h: 22,  type: "collapse" },
      { x: 1700, y: 400, w: 120,  h: 22,  type: "collapse" },
      { x: 1860, y: 340, w: 200,  h: 22  },
      { x: 2100, y: 410, w: 160,  h: 22,  type: "collapse" },
      { x: 2300, y: 560, w: 60,   h: 200 },
      { x: 2420, y: 460, w: 60,   h: 100 },
      { x: 2540, y: 380, w: 60,   h: 180 },
      { x: 2420, y: 320, w: 120,  h: 22,  type: "collapse" },
      { x: 2650, y: 440, w: 160,  h: 22,  type: "collapse" },
      { x: 2850, y: 380, w: 140,  h: 22  },
      { x: 3020, y: 320, w: 180,  h: 22,  type: "collapse" },
      { x: 3220, y: 260, w: 140,  h: 22,  type: "collapse" },
      { x: 3380, y: 320, w: 160,  h: 22,  type: "collapse" },
      { x: 3560, y: 400, w: 180,  h: 22  },
      { x: 3600, y: 556, w: 200,  h: 22  },
      // extra wall sections narrowing the path
      { x: 2300, y: 420, w: 60,   h: 140 },
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
      // doubled
      { type: "drone",         x: 200,  y: 530, patrolMin: 100,  patrolMax: 540  },
      { type: "chaser",        x: 620,  y: 610, patrolMin: 500,  patrolMax: 800  },
      { type: "drone",         x: 1100, y: 330, patrolMin: 1060, patrolMax: 1300 },
      { type: "chaser",        x: 960,  y: 610, patrolMin: 860,  patrolMax: 1180 },
      { type: "phase_shifter", x: 1500, y: 330 },
      { type: "chaser",        x: 1780, y: 610, patrolMin: 1700, patrolMax: 2000 },
      { type: "pulsar",        x: 1490, y: 329 },
      { type: "chaser",        x: 2250, y: 610, patrolMin: 2100, patrolMax: 2530 },
      { type: "drone",         x: 2060, y: 380, patrolMin: 2000, patrolMax: 2290 },
      { type: "chaser",        x: 2800, y: 610, patrolMin: 2700, patrolMax: 3050 },
      { type: "phase_shifter", x: 2870, y: 350 },
      { type: "drone",         x: 3080, y: 290, patrolMin: 3020, patrolMax: 3380 },
      { type: "chaser",        x: 3300, y: 610, patrolMin: 3150, patrolMax: 3500 },
      { type: "pulsar",        x: 3400, y: 289 },
      { type: "phase_shifter", x: 3580, y: 370 },
    ];
  }

  buildCollectibles(): CollectibleDef[] {
    return [
      { x: 470,  y: 460 },
      { x: 1200, y: 305 },
      { x: 1930, y: 370 },
      { x: 2480, y: 290 },
      { x: 3440, y: 290 },
    ];
  }

  buildSpikes(): SpikeDef[] {
    return [
      // Floor spikes
      { x: 560,  y: 600, count: 2 },
      { x: 660,  y: 600, count: 3 },
      { x: 900,  y: 600, count: 3 },
      { x: 1420, y: 600, count: 4 },
      { x: 1680, y: 600, count: 3 },
      { x: 2200, y: 600, count: 4 },
      { x: 2760, y: 600, count: 3 },
      { x: 3100, y: 600, count: 4 },
      { x: 3480, y: 600, count: 3 },
      // Elevated platform spikes
      { x: 1110, y: 349, count: 2 },
      { x: 1900, y: 329, count: 3 },
      { x: 3060, y: 309, count: 2 },
      { x: 2700, y: 429, count: 2 },
      // Platform { x:380, y:500, h:22 } → top = 489
      { x: 420,  y: 489, count: 2 },
      // Platform { x:740, y:500, h:22 } → top = 489
      { x: 780,  y: 489, count: 1 },
      // Platform { x:2850, y:380, h:22 } → top = 369
      { x: 2890, y: 369, count: 2 },
      // Platform { x:3560, y:400, h:22 } → top = 389
      { x: 3600, y: 389, count: 2 },
    ];
  }

  buildVortexes(): VortexDef[] {
    return [
      { x: 800,  y: 580 },
      { x: 1950, y: 580 },
      { x: 2600, y: 580 },
      { x: 3300, y: 580 },
    ];
  }

  private wavesSpawned = 0;

  create(): void {
    this.wavesSpawned = 0;
    super.create();
    this.time.delayedCall(700, () => this.showShootHint());
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    this.checkEnemyWaves();
  }

  private checkEnemyWaves(): void {
    if (!this.player || this.levelComplete || this.gameOver || this.paused) return;
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

  private showShootHint(): void {
    const W = this.scale.width;
    const banner = this.add
      .text(W / 2, 76, "★  NEW ABILITY: Press [F] to SHOOT  ★", {
        fontSize: "17px",
        fontFamily: "monospace",
        color: "#00ffcc",
        stroke: "#003322",
        strokeThickness: 3,
        backgroundColor: "#000000dd",
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(92)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      duration: 400,
      onComplete: () => {
        this.time.delayedCall(3200, () => {
          this.tweens.add({
            targets: banner,
            alpha: 0,
            duration: 600,
            onComplete: () => banner.destroy(),
          });
        });
      },
    });
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
