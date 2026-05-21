import Phaser from "phaser";
import { COLORS } from "../constants";
import { hasCutscenePlayed } from "../utils/settings";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000f1f).setDepth(0);

    const boxW = 320;
    const boxH = 40;
    const boxX = W / 2 - boxW / 2;
    const boxY = H / 2 - boxH / 2;

    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x111122, 0.9);
    progressBox.fillRoundedRect(boxX - 4, boxY - 4, boxW + 8, boxH + 8, 6);
    progressBox.setDepth(1);

    const progressBar = this.add.graphics();
    progressBar.setDepth(2);

    this.add
      .text(W / 2, H / 2 - 50, "CHRONO SHIFT", {
        fontSize: "42px",
        fontFamily: "monospace",
        color: "#00ffff",
        stroke: "#004488",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.add
      .text(W / 2, H / 2 + 60, "LOADING...", {
        fontSize: "16px",
        fontFamily: "monospace",
        color: "#446688",
      })
      .setOrigin(0.5)
      .setDepth(2);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00ffff, 1);
      progressBar.fillRoundedRect(boxX, boxY, boxW * value, boxH, 4);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
    });
  }

  create() {
    this.createTextures();
    if (hasCutscenePlayed()) {
      this.scene.start("MenuScene");
    } else {
      this.scene.start("CutsceneScene");
    }
  }

  private createTextures() {
    const g = this.make.graphics({ x: 0, y: 0 });

    // ── Player (28×44 cyan humanoid) ──
    g.clear();
    g.fillStyle(COLORS.PLAYER, 1);
    g.fillRect(4, 0, 20, 36);
    g.fillRect(0, 36, 12, 8);
    g.fillRect(16, 36, 12, 8);
    g.fillStyle(COLORS.PLAYER_GLOW, 0.6);
    g.fillRect(8, 4, 12, 14);
    g.generateTexture("player", 28, 44);

    // ── Player damaged ──
    g.clear();
    g.fillStyle(0xff4444, 1);
    g.fillRect(4, 0, 20, 36);
    g.fillRect(0, 36, 12, 8);
    g.fillRect(16, 36, 12, 8);
    g.generateTexture("player_hit", 28, 44);

    // ── Platform tile ──
    g.clear();
    g.fillStyle(COLORS.PLATFORM, 1);
    g.fillRect(0, 0, 32, 24);
    g.fillStyle(COLORS.PLATFORM_LIGHT, 1);
    g.fillRect(0, 0, 32, 4);
    g.fillStyle(0x0d3320, 1);
    g.fillRect(0, 20, 32, 4);
    g.generateTexture("platform", 32, 24);

    // ── Ruins platform tile (warm brown) ──
    g.clear();
    g.fillStyle(COLORS.RUINS_PLATFORM, 1);
    g.fillRect(0, 0, 32, 24);
    g.fillStyle(COLORS.RUINS_LIGHT, 1);
    g.fillRect(0, 0, 32, 5);
    g.fillStyle(0x3a1a08, 1);
    g.fillRect(0, 20, 32, 4);
    for (let i = 0; i < 32; i += 10) {
      g.fillStyle(0x4a2810, 0.35);
      g.fillRect(i, 6, 8, 12);
    }
    g.generateTexture("platform_ruins", 32, 24);

    // ── Future platform tile (neon blue) ──
    g.clear();
    g.fillStyle(COLORS.FUTURE_PLATFORM, 1);
    g.fillRect(0, 0, 32, 24);
    g.fillStyle(COLORS.FUTURE_LIGHT, 1);
    g.fillRect(0, 0, 32, 4);
    g.fillStyle(0x000a1a, 1);
    g.fillRect(0, 20, 32, 4);
    g.fillStyle(0x00ffff, 0.18);
    g.fillRect(0, 0, 32, 2);
    g.generateTexture("platform_future", 32, 24);

    // ── Ground tile ──
    g.clear();
    g.fillStyle(COLORS.GROUND, 1);
    g.fillRect(0, 0, 32, 24);
    g.fillStyle(0x114422, 1);
    g.fillRect(0, 0, 32, 5);
    g.generateTexture("ground", 32, 24);

    // ── Collapsing platform ──
    g.clear();
    g.fillStyle(COLORS.COLLAPSE_PLATFORM, 1);
    g.fillRect(0, 0, 32, 20);
    g.fillStyle(0xaa6622, 0.8);
    g.fillRect(0, 0, 32, 4);
    g.fillStyle(0x553311, 1);
    g.fillRect(0, 16, 32, 4);
    for (let i = 0; i < 32; i += 8) {
      g.fillStyle(0x996633, 0.4);
      g.fillRect(i + 2, 6, 4, 8);
    }
    g.generateTexture("platform_collapse", 32, 20);

    // ── Crystal ──
    g.clear();
    g.fillStyle(COLORS.CRYSTAL, 1);
    g.fillTriangle(12, 0, 24, 12, 12, 24);
    g.fillTriangle(12, 0, 0, 12, 12, 24);
    g.fillStyle(0xffffff, 0.5);
    g.fillTriangle(8, 4, 16, 4, 12, 10);
    g.generateTexture("crystal", 24, 24);

    // ── Time Shard ──
    g.clear();
    g.fillStyle(COLORS.SHARD, 1);
    g.fillTriangle(7, 0, 14, 7, 7, 14);
    g.fillTriangle(7, 0, 0, 7, 7, 14);
    g.fillStyle(0xccaaff, 0.6);
    g.fillTriangle(4, 3, 10, 3, 7, 7);
    g.generateTexture("shard", 14, 14);

    // ── Health pickup ──
    g.clear();
    g.fillStyle(COLORS.HEALTH_PICKUP, 1);
    g.fillCircle(6, 6, 6);
    g.fillCircle(14, 6, 6);
    g.fillTriangle(1, 8, 19, 8, 10, 20);
    g.generateTexture("health_pickup", 20, 20);

    // ── Temporal Drone ──
    g.clear();
    g.fillStyle(COLORS.DRONE, 1);
    g.fillRect(0, 4, 32, 14);
    g.fillRect(6, 0, 20, 4);
    g.fillStyle(0xff6644, 1);
    g.fillRect(4, 6, 6, 8);
    g.fillRect(22, 6, 6, 8);
    g.fillStyle(0xff0000, 0.8);
    g.fillCircle(16, 11, 5);
    g.generateTexture("drone", 32, 20);

    // ── Chaser Enemy (36×36 aggressive diamond) ──
    g.clear();
    g.fillStyle(COLORS.CHASER, 0.9);
    g.fillTriangle(18, 0, 36, 18, 18, 36);
    g.fillTriangle(18, 0, 0, 18, 18, 36);
    g.fillStyle(0xff88aa, 1);
    g.fillCircle(18, 18, 7);
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(15, 16, 2);
    g.fillCircle(21, 16, 2);
    g.fillStyle(0xff0044, 1);
    g.fillCircle(15, 16, 1);
    g.fillCircle(21, 16, 1);
    g.generateTexture("chaser", 36, 36);

    // ── Phase Shifter ──
    g.clear();
    g.fillStyle(COLORS.PHASE_SHIFTER, 1);
    g.fillTriangle(14, 0, 28, 20, 0, 20);
    g.fillRect(4, 18, 20, 10);
    g.fillStyle(0xffaa00, 1);
    g.fillCircle(14, 12, 5);
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(14, 11, 2);
    g.generateTexture("phase_shifter", 28, 28);

    // ── Pulsar ──
    g.clear();
    g.fillStyle(COLORS.PULSAR, 0.3);
    g.fillCircle(18, 18, 18);
    g.fillStyle(COLORS.PULSAR, 0.7);
    g.fillCircle(18, 18, 13);
    g.fillStyle(0xff6600, 1);
    g.fillCircle(18, 18, 8);
    g.fillStyle(0xffaa44, 1);
    g.fillCircle(18, 18, 4);
    g.generateTexture("pulsar", 36, 36);

    // ── Boss (80×80 imposing enemy) ──
    g.clear();
    g.fillStyle(COLORS.BOSS, 0.95);
    g.fillRect(8, 0, 64, 70);
    g.fillRect(0, 20, 80, 36);
    g.fillStyle(COLORS.BOSS_GLOW, 1);
    g.fillRect(0, 20, 80, 8);
    g.fillRect(0, 48, 80, 8);
    // Eyes
    g.fillStyle(0xffff00, 1);
    g.fillCircle(24, 18, 8);
    g.fillCircle(56, 18, 8);
    g.fillStyle(0xff0000, 1);
    g.fillCircle(24, 18, 5);
    g.fillCircle(56, 18, 5);
    g.fillStyle(0x000000, 1);
    g.fillCircle(25, 17, 2);
    g.fillCircle(57, 17, 2);
    // Chest glow
    g.fillStyle(0xff8800, 0.7);
    g.fillCircle(40, 35, 14);
    g.fillStyle(0xffff00, 0.8);
    g.fillCircle(40, 35, 7);
    // Horns
    g.fillStyle(COLORS.BOSS, 1);
    g.fillTriangle(14, 0, 24, 0, 19, -12);
    g.fillTriangle(56, 0, 66, 0, 61, -12);
    g.generateTexture("boss", 80, 80);

    // ── Projectile ──
    g.clear();
    g.fillStyle(COLORS.PROJECTILE, 1);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0xffff00, 0.8);
    g.fillCircle(6, 6, 3);
    g.generateTexture("projectile", 12, 12);

    // ── Spike ──
    g.clear();
    g.fillStyle(COLORS.SPIKE, 1);
    g.fillTriangle(8, 0, 16, 28, 0, 28);
    g.fillStyle(0x888899, 0.5);
    g.fillTriangle(8, 2, 14, 26, 8, 16);
    g.generateTexture("spike", 16, 28);

    // ── Exit portal ──
    g.clear();
    g.fillStyle(COLORS.EXIT, 0.2);
    g.fillEllipse(24, 40, 48, 64);
    g.fillStyle(COLORS.EXIT, 0.5);
    g.fillEllipse(24, 40, 36, 50);
    g.fillStyle(0xffffff, 0.9);
    g.fillEllipse(24, 40, 20, 28);
    g.fillStyle(COLORS.EXIT_GLOW, 1);
    g.fillEllipse(24, 40, 14, 20);
    g.generateTexture("exit", 48, 64);

    // ── Particle ──
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(2, 2, 2);
    g.generateTexture("particle", 4, 4);

    // ── Ghost particle ──
    g.clear();
    g.fillStyle(0x00ffff, 0.4);
    g.fillCircle(3, 3, 3);
    g.generateTexture("ghost_particle", 6, 6);

    // ── Star ──
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(1, 1, 1);
    g.generateTexture("star", 2, 2);

    // ── Time vortex zone ──
    g.clear();
    g.fillStyle(0x220044, 0.6);
    g.fillRect(0, 0, 200, 200);
    g.lineStyle(2, 0x8800ff, 0.5);
    g.strokeRect(0, 0, 200, 200);
    for (let i = 0; i < 200; i += 20) {
      g.lineStyle(1, 0x6600cc, 0.2);
      g.lineBetween(0, i, 200, 200 - i);
    }
    g.generateTexture("vortex_zone", 200, 200);

    g.destroy();
  }
}
