import Phaser from "phaser";
import { TimeManager } from "./TimeManager";
import {
  TIME_SLOW_DURATION,
  TIME_SLOW_COOLDOWN,
  TIME_REWIND_COOLDOWN,
  COLORS,
} from "../constants";

interface MiniMapConfig {
  worldWidth: number;
  worldHeight: number;
  crystals: Array<{ x: number; y: number }>;
  exitX: number;
  exitY: number;
  platforms: Array<{ x: number; y: number; w: number; h?: number }>;
}

const MAP_W = 200;
const MAP_H = 44;
const MAP_PAD = 8;

export class UIManager {
  private scene: Phaser.Scene;
  private timeManager: TimeManager;

  private levelText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private healthContainer!: Phaser.GameObjects.Container;
  private crystalText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  private slowLabel!: Phaser.GameObjects.Text;
  private slowBar!: Phaser.GameObjects.Graphics;
  private slowStatus!: Phaser.GameObjects.Text;

  private rewindLabel!: Phaser.GameObjects.Text;
  private rewindBar!: Phaser.GameObjects.Graphics;
  private rewindStatus!: Phaser.GameObjects.Text;

  private damageFlash!: Phaser.GameObjects.Rectangle;

  // Mini-map
  private mapBg!: Phaser.GameObjects.Graphics;
  private mapGfx!: Phaser.GameObjects.Graphics;
  private mapLabel!: Phaser.GameObjects.Text;
  private mapConfig: MiniMapConfig | null = null;
  private collectedCrystals = new Set<number>();
  private mapX = 0;
  private mapY = 0;
  private mapScaleX = 1;
  private mapScaleY = 1;
  private exitPulseTween: Phaser.Tweens.Tween | null = null;
  private exitPulse = 1;

  private startTime = 0;
  private levelNumber = 1;

  constructor(scene: Phaser.Scene, timeManager: TimeManager, levelNumber = 1) {
    this.scene = scene;
    this.timeManager = timeManager;
    this.levelNumber = levelNumber;
    this.startTime = scene.time.now;
    this.create();
  }

  private create() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;

    // ── Top-left panel ──
    const panelBg = this.scene.add.graphics();
    panelBg.fillStyle(0x000000, 0.55);
    panelBg.fillRoundedRect(6, 6, 210, 110, 8);
    panelBg.setDepth(90).setScrollFactor(0);

    this.levelText = this.scene.add
      .text(16, 14, `LEVEL ${this.levelNumber}`, {
        fontSize: "18px",
        fontFamily: "monospace",
        color: "#00ffcc",
        stroke: "#003322",
        strokeThickness: 2,
      })
      .setDepth(91)
      .setScrollFactor(0);

    this.scoreText = this.scene.add
      .text(16, 36, "SCORE: 0", {
        fontSize: "16px",
        fontFamily: "monospace",
        color: "#ffee44",
      })
      .setDepth(91)
      .setScrollFactor(0);

    this.healthContainer = this.scene.add
      .container(16, 60)
      .setDepth(91)
      .setScrollFactor(0) as Phaser.GameObjects.Container;
    this.updateHearts(3);

    // ── Top-right panel ──
    const panelBg2 = this.scene.add.graphics();
    panelBg2.fillStyle(0x000000, 0.55);
    panelBg2.fillRoundedRect(W - 160, 6, 154, 56, 8);
    panelBg2.setDepth(90).setScrollFactor(0);

    this.crystalText = this.scene.add
      .text(W - 152, 14, "CRYSTALS: 0/5", {
        fontSize: "15px",
        fontFamily: "monospace",
        color: "#ffd700",
      })
      .setDepth(91)
      .setScrollFactor(0);

    this.timerText = this.scene.add
      .text(W - 152, 34, "TIME: 0:00", {
        fontSize: "15px",
        fontFamily: "monospace",
        color: "#aaccff",
      })
      .setDepth(91)
      .setScrollFactor(0);

    // ── Bottom-left ability bars ──
    const abilityBg = this.scene.add.graphics();
    abilityBg.fillStyle(0x000000, 0.6);
    abilityBg.fillRoundedRect(6, H - 86, 220, 80, 8);
    abilityBg.setDepth(90).setScrollFactor(0);

    this.slowLabel = this.scene.add
      .text(14, H - 79, "[E] TIME SLOW", {
        fontSize: "13px",
        fontFamily: "monospace",
        color: "#66aaff",
      })
      .setDepth(91)
      .setScrollFactor(0);

    this.slowBar = this.scene.add.graphics();
    this.slowBar.setDepth(91).setScrollFactor(0);

    this.slowStatus = this.scene.add
      .text(14, H - 63, "READY", {
        fontSize: "11px",
        fontFamily: "monospace",
        color: "#44ff88",
      })
      .setDepth(91)
      .setScrollFactor(0);

    this.rewindLabel = this.scene.add
      .text(14, H - 47, "[R] TIME REWIND", {
        fontSize: "13px",
        fontFamily: "monospace",
        color: "#ff88aa",
      })
      .setDepth(91)
      .setScrollFactor(0);

    this.rewindBar = this.scene.add.graphics();
    this.rewindBar.setDepth(91).setScrollFactor(0);

    this.rewindStatus = this.scene.add
      .text(14, H - 31, "READY", {
        fontSize: "11px",
        fontFamily: "monospace",
        color: "#44ff88",
      })
      .setDepth(91)
      .setScrollFactor(0);

    // ── Damage flash ──
    this.damageFlash = this.scene.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0);
    this.damageFlash.setDepth(95).setScrollFactor(0);

    // ── Mini-map placeholder (bottom-right, built after initMiniMap) ──
    this.mapX = W - MAP_W - MAP_PAD;
    this.mapY = H - MAP_H - MAP_PAD;

    this.mapBg = this.scene.add.graphics();
    this.mapBg.setDepth(90).setScrollFactor(0);

    this.mapGfx = this.scene.add.graphics();
    this.mapGfx.setDepth(91).setScrollFactor(0);

    this.mapLabel = this.scene.add
      .text(this.mapX + MAP_W / 2, this.mapY - 12, "MAP", {
        fontSize: "10px",
        fontFamily: "monospace",
        color: "#445566",
      })
      .setOrigin(0.5, 1)
      .setDepth(91)
      .setScrollFactor(0);
  }

  initMiniMap(config: MiniMapConfig) {
    this.mapConfig = config;
    this.collectedCrystals.clear();
    this.mapScaleX = MAP_W / config.worldWidth;
    this.mapScaleY = MAP_H / config.worldHeight;

    // Draw static background + border + platforms once
    this.mapBg.clear();
    this.mapBg.fillStyle(0x000000, 0.7);
    this.mapBg.fillRoundedRect(this.mapX - 1, this.mapY - 1, MAP_W + 2, MAP_H + 2, 4);
    this.mapBg.lineStyle(1, 0x334455, 0.9);
    this.mapBg.strokeRoundedRect(this.mapX - 1, this.mapY - 1, MAP_W + 2, MAP_H + 2, 4);

    // Draw platforms as subtle grey fills
    this.mapBg.fillStyle(0x223344, 0.9);
    for (const p of config.platforms) {
      const px = this.mapX + p.x * this.mapScaleX;
      const py = this.mapY + p.y * this.mapScaleY;
      const pw = Math.max(2, p.w * this.mapScaleX);
      const ph = Math.max(1, (p.h ?? 24) * this.mapScaleY);
      this.mapBg.fillRect(px, py - ph / 2, pw, ph + 1);
    }

    // Start exit pulse tween
    const obj = { v: 1 };
    this.exitPulseTween = this.scene.tweens.add({
      targets: obj,
      v: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
      onUpdate: () => { this.exitPulse = obj.v; },
    });

    this.mapLabel.setText("MAP");
    this.mapLabel.setColor("#667788");
  }

  markCrystalCollected(index: number) {
    this.collectedCrystals.add(index);
  }

  private drawMiniMap(playerX: number, playerY: number) {
    const cfg = this.mapConfig;
    if (!cfg) return;

    this.mapGfx.clear();

    // Exit dot — pulsing green
    const ex = this.mapX + cfg.exitX * this.mapScaleX;
    const ey = this.mapY + cfg.exitY * this.mapScaleY;
    this.mapGfx.fillStyle(0x00ff88, this.exitPulse);
    this.mapGfx.fillCircle(ex, ey, 3);
    this.mapGfx.lineStyle(1, 0x00ff88, this.exitPulse * 0.5);
    this.mapGfx.strokeCircle(ex, ey, 5);

    // Crystal dots — gold, hidden if collected
    for (let i = 0; i < cfg.crystals.length; i++) {
      if (this.collectedCrystals.has(i)) continue;
      const cx = this.mapX + cfg.crystals[i].x * this.mapScaleX;
      const cy = this.mapY + cfg.crystals[i].y * this.mapScaleY;
      this.mapGfx.fillStyle(0xffd700, 1);
      this.mapGfx.fillCircle(cx, cy, 2.5);
    }

    // Player dot — bright cyan with glow ring
    const px = Phaser.Math.Clamp(
      this.mapX + playerX * this.mapScaleX,
      this.mapX + 2,
      this.mapX + MAP_W - 2
    );
    const py = Phaser.Math.Clamp(
      this.mapY + playerY * this.mapScaleY,
      this.mapY + 2,
      this.mapY + MAP_H - 2
    );
    this.mapGfx.lineStyle(1, 0x00ffff, 0.35);
    this.mapGfx.strokeCircle(px, py, 5);
    this.mapGfx.fillStyle(0x00ffff, 1);
    this.mapGfx.fillCircle(px, py, 3);

    // Viewport rectangle showing what the camera currently sees
    const cam = this.scene.cameras.main;
    const vx = this.mapX + cam.scrollX * this.mapScaleX;
    const vy = this.mapY + cam.scrollY * this.mapScaleY;
    const vw = cam.width * this.mapScaleX;
    const vh = cam.height * this.mapScaleY;
    this.mapGfx.lineStyle(1, 0x445566, 0.5);
    this.mapGfx.strokeRect(vx, vy, vw, vh);
  }

  private updateHearts(health: number) {
    this.healthContainer.removeAll(true);
    for (let i = 0; i < 3; i++) {
      const color = i < health ? 0xff3355 : 0x333344;
      const heart = this.scene.add.graphics();
      heart.fillStyle(color, 1);
      heart.fillCircle(5, 5, 5);
      heart.fillCircle(13, 5, 5);
      heart.fillTriangle(0, 7, 18, 7, 9, 18);
      heart.x = i * 24;
      this.healthContainer.add(heart);
    }
  }

  update(score: number, health: number, crystals: number, totalCrystals: number, playerX = 0, playerY = 0) {
    const elapsed = this.scene.time.now - this.startTime;
    const secs = Math.floor(elapsed / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const timeStr = `${m}:${s.toString().padStart(2, "0")}`;

    this.scoreText.setText(`SCORE: ${score}`);
    this.crystalText.setText(`CRYSTALS: ${crystals}/${totalCrystals}`);
    this.timerText.setText(`TIME: ${timeStr}`);
    this.updateHearts(health);
    this.updateAbilityBars();
    this.drawMiniMap(playerX, playerY);
  }

  private updateAbilityBars() {
    const H = this.scene.scale.height;
    const barW = 155;
    const barH = 5;

    this.slowBar.clear();
    this.slowBar.fillStyle(0x223355, 1);
    this.slowBar.fillRect(55, H - 64, barW, barH);

    let slowFill = 0;
    let slowColor = 0x44ff88;
    let slowStatusText = "READY";

    if (this.timeManager.slowActive) {
      slowFill = this.timeManager.slowTimeRemaining / TIME_SLOW_DURATION;
      slowColor = 0x4466ff;
      slowStatusText = `ACTIVE ${Math.ceil(this.timeManager.slowTimeRemaining / 1000)}s`;
    } else if (!this.timeManager.slowReady) {
      slowFill = 1 - this.timeManager.slowCooldownRemaining / TIME_SLOW_COOLDOWN;
      slowColor = 0xff6600;
      slowStatusText = `CD ${Math.ceil(this.timeManager.slowCooldownRemaining / 1000)}s`;
    } else {
      slowFill = 1;
    }

    this.slowBar.fillStyle(slowColor, 1);
    this.slowBar.fillRect(55, H - 64, barW * slowFill, barH);
    this.slowStatus.setText(slowStatusText);
    this.slowStatus.setColor(
      this.timeManager.slowReady && !this.timeManager.slowActive ? "#44ff88" :
      this.timeManager.slowActive ? "#8899ff" : "#ff8844"
    );

    this.rewindBar.clear();
    this.rewindBar.fillStyle(0x223355, 1);
    this.rewindBar.fillRect(72, H - 32, barW, barH);

    let rewindFill = 0;
    let rewindColor = 0x44ff88;
    let rewindStatusText = "READY";

    if (this.timeManager.rewindActive) {
      rewindFill = 1;
      rewindColor = 0xff44aa;
      rewindStatusText = "REWINDING...";
    } else if (!this.timeManager.rewindReady) {
      rewindFill = 1 - this.timeManager.rewindCooldownRemaining / TIME_REWIND_COOLDOWN;
      rewindColor = 0xff6600;
      rewindStatusText = `CD ${Math.ceil(this.timeManager.rewindCooldownRemaining / 1000)}s`;
    } else {
      rewindFill = 1;
    }

    this.rewindBar.fillStyle(rewindColor, 1);
    this.rewindBar.fillRect(72, H - 32, barW * rewindFill, barH);
    this.rewindStatus.setText(rewindStatusText);
    this.rewindStatus.setColor(
      this.timeManager.rewindReady && !this.timeManager.rewindActive ? "#44ff88" :
      this.timeManager.rewindActive ? "#ff88cc" : "#ff8844"
    );
  }

  flashDamage() {
    this.scene.tweens.add({
      targets: this.damageFlash,
      alpha: { from: 0.35, to: 0 },
      duration: 400,
      ease: "Power2",
    });
    this.scene.cameras.main.shake(180, 0.008);
  }

  showCrystalsComplete() {
    const W = this.scene.scale.width;
    const banner = this.scene.add
      .text(W / 2, 80, "ALL CRYSTALS COLLECTED! Reach the exit!", {
        fontSize: "20px",
        fontFamily: "monospace",
        color: "#ffd700",
        stroke: "#553300",
        strokeThickness: 3,
        backgroundColor: "#000000aa",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(92)
      .setScrollFactor(0);

    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: banner,
        alpha: 0,
        duration: 600,
        onComplete: () => banner.destroy(),
      });
    });
  }

  getElapsedTime() {
    return this.scene.time.now - this.startTime;
  }

  destroy() {
    this.exitPulseTween?.stop();
  }
}
