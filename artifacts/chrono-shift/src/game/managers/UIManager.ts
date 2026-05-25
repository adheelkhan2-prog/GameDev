import Phaser from "phaser";
import { TimeManager } from "./TimeManager";
import {
  TIME_SLOW_DURATION,
  TIME_SLOW_COOLDOWN,
  DASH_COOLDOWN,
  PLAYER_SHOOT_COOLDOWN,
  COLORS,
} from "../constants";
import type { UnlockedAbilities } from "../utils/settings";

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
  private abilities: UnlockedAbilities;
  private maxHealth: number;

  private levelText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private healthContainer!: Phaser.GameObjects.Container;
  private crystalText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  private slowLabel!: Phaser.GameObjects.Text;
  private slowBar!: Phaser.GameObjects.Graphics;
  private slowStatus!: Phaser.GameObjects.Text;

  private dashLabel: Phaser.GameObjects.Text | null = null;
  private dashBar: Phaser.GameObjects.Graphics | null = null;
  private dashStatus: Phaser.GameObjects.Text | null = null;

  private shootLabel: Phaser.GameObjects.Text | null = null;
  private shootBar: Phaser.GameObjects.Graphics | null = null;
  private shootStatus: Phaser.GameObjects.Text | null = null;

  private abilityIcons: Phaser.GameObjects.Text | null = null;

  private damageFlash!: Phaser.GameObjects.Rectangle;

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
  private minimapVisible = true;

  private startTime = 0;
  private pausedAt = 0;
  private totalPausedMs = 0;
  private levelNumber = 1;

  constructor(
    scene: Phaser.Scene,
    timeManager: TimeManager,
    levelNumber = 1,
    abilities: UnlockedAbilities = { doubleJump: false, dash: false, wallClimb: false, shoot: false },
    maxHealth = 3
  ) {
    this.scene = scene;
    this.timeManager = timeManager;
    this.levelNumber = levelNumber;
    this.abilities = abilities;
    this.maxHealth = maxHealth;
    this.startTime = scene.time.now;
    this.create();
  }

  pauseTimer() {
    this.pausedAt = this.scene.time.now;
  }

  resumeTimer() {
    if (this.pausedAt > 0) {
      this.totalPausedMs += this.scene.time.now - this.pausedAt;
      this.pausedAt = 0;
    }
  }

  private create() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;

    const anyAbility = this.abilities.doubleJump || this.abilities.dash || this.abilities.wallClimb;
    const panelH = 56 + (this.abilities.dash ? 30 : 0) + (this.abilities.shoot ? 30 : 0) + (anyAbility ? 24 : 0);

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
      .setDepth(91).setScrollFactor(0);

    this.scoreText = this.scene.add
      .text(16, 36, "SCORE: 0", {
        fontSize: "16px",
        fontFamily: "monospace",
        color: "#ffee44",
      })
      .setDepth(91).setScrollFactor(0);

    this.healthContainer = this.scene.add
      .container(16, 60)
      .setDepth(91)
      .setScrollFactor(0) as Phaser.GameObjects.Container;
    this.updateHearts(this.maxHealth);

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
      .setDepth(91).setScrollFactor(0);

    this.timerText = this.scene.add
      .text(W - 152, 34, "TIME: 0:00", {
        fontSize: "15px",
        fontFamily: "monospace",
        color: "#aaccff",
      })
      .setDepth(91).setScrollFactor(0);

    // ── Bottom-left ability bars ──
    const abilityBg = this.scene.add.graphics();
    abilityBg.fillStyle(0x000000, 0.6);
    abilityBg.fillRoundedRect(6, H - panelH - 6, 224, panelH, 8);
    abilityBg.setDepth(90).setScrollFactor(0);

    let rowY = H - panelH + 4;

    this.slowLabel = this.scene.add
      .text(14, rowY, "[E] TIME SLOW", {
        fontSize: "13px", fontFamily: "monospace", color: "#66aaff",
      })
      .setDepth(91).setScrollFactor(0);

    this.slowBar = this.scene.add.graphics();
    this.slowBar.setDepth(91).setScrollFactor(0);

    this.slowStatus = this.scene.add
      .text(14, rowY + 16, "READY", {
        fontSize: "11px", fontFamily: "monospace", color: "#44ff88",
      })
      .setDepth(91).setScrollFactor(0);

    rowY += 34;

    // Dash row (if unlocked)
    if (this.abilities.dash) {
      this.dashLabel = this.scene.add
        .text(14, rowY, "[Q] DASH", {
          fontSize: "13px", fontFamily: "monospace", color: "#ffaa44",
        })
        .setDepth(91).setScrollFactor(0);

      this.dashBar = this.scene.add.graphics();
      this.dashBar.setDepth(91).setScrollFactor(0);

      this.dashStatus = this.scene.add
        .text(14, rowY + 16, "READY", {
          fontSize: "11px", fontFamily: "monospace", color: "#44ff88",
        })
        .setDepth(91).setScrollFactor(0);

      rowY += 34;
    }

    // Shoot row (if unlocked)
    if (this.abilities.shoot) {
      this.shootLabel = this.scene.add
        .text(14, rowY, "[F] SHOOT", {
          fontSize: "13px", fontFamily: "monospace", color: "#00ffcc",
        })
        .setDepth(91).setScrollFactor(0);

      this.shootBar = this.scene.add.graphics();
      this.shootBar.setDepth(91).setScrollFactor(0);

      this.shootStatus = this.scene.add
        .text(14, rowY + 16, "READY", {
          fontSize: "11px", fontFamily: "monospace", color: "#44ff88",
        })
        .setDepth(91).setScrollFactor(0);

      rowY += 34;
    }

    // Ability icons row
    if (anyAbility && !this.abilities.dash) {
      const parts: string[] = [];
      if (this.abilities.doubleJump) parts.push("DBL JUMP");
      if (this.abilities.wallClimb) parts.push("WALL CLIMB");
      this.abilityIcons = this.scene.add
        .text(14, rowY, parts.join("  •  "), {
          fontSize: "10px", fontFamily: "monospace", color: "#aaaacc",
        })
        .setDepth(91).setScrollFactor(0);
    } else if (anyAbility) {
      const parts: string[] = [];
      if (this.abilities.doubleJump) parts.push("DBL↑");
      if (this.abilities.wallClimb) parts.push("WALL");
      if (parts.length > 0) {
        this.abilityIcons = this.scene.add
          .text(14, rowY, parts.join("  "), {
            fontSize: "10px", fontFamily: "monospace", color: "#aaaacc",
          })
          .setDepth(91).setScrollFactor(0);
      }
    }

    // ── Damage flash overlay ──
    this.damageFlash = this.scene.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0);
    this.damageFlash.setDepth(95).setScrollFactor(0);

    // ── Mini-map (bottom-right) ──
    this.mapX = W - MAP_W - MAP_PAD;
    this.mapY = H - MAP_H - MAP_PAD;

    this.mapBg = this.scene.add.graphics();
    this.mapBg.setDepth(90).setScrollFactor(0);

    this.mapGfx = this.scene.add.graphics();
    this.mapGfx.setDepth(91).setScrollFactor(0);

    this.mapLabel = this.scene.add
      .text(this.mapX + MAP_W / 2, this.mapY - 12, "MAP", {
        fontSize: "10px", fontFamily: "monospace", color: "#445566",
      })
      .setOrigin(0.5, 1)
      .setDepth(91).setScrollFactor(0);
  }

  initMiniMap(config: MiniMapConfig) {
    this.mapConfig = config;
    this.collectedCrystals.clear();
    this.mapScaleX = MAP_W / config.worldWidth;
    this.mapScaleY = MAP_H / config.worldHeight;

    this.mapBg.clear();
    this.mapBg.fillStyle(0x000000, 0.7);
    this.mapBg.fillRoundedRect(this.mapX - 1, this.mapY - 1, MAP_W + 2, MAP_H + 2, 4);
    this.mapBg.lineStyle(1, 0x334455, 0.9);
    this.mapBg.strokeRoundedRect(this.mapX - 1, this.mapY - 1, MAP_W + 2, MAP_H + 2, 4);
    this.mapBg.fillStyle(0x223344, 0.9);
    for (const p of config.platforms) {
      const px = this.mapX + p.x * this.mapScaleX;
      const py = this.mapY + p.y * this.mapScaleY;
      const pw = Math.max(2, p.w * this.mapScaleX);
      const ph = Math.max(1, (p.h ?? 24) * this.mapScaleY);
      this.mapBg.fillRect(px, py - ph / 2, pw, ph + 1);
    }

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

  setMinimapVisible(visible: boolean) {
    this.minimapVisible = visible;
    this.mapBg.setVisible(visible);
    this.mapGfx.setVisible(visible);
    this.mapLabel.setVisible(visible);
  }

  markCrystalCollected(index: number) {
    this.collectedCrystals.add(index);
  }

  private drawMiniMap(playerX: number, playerY: number) {
    const cfg = this.mapConfig;
    if (!cfg || !this.minimapVisible) return;
    this.mapGfx.clear();
    const ex = this.mapX + cfg.exitX * this.mapScaleX;
    const ey = this.mapY + cfg.exitY * this.mapScaleY;
    this.mapGfx.fillStyle(0x00ff88, this.exitPulse);
    this.mapGfx.fillCircle(ex, ey, 3);
    this.mapGfx.lineStyle(1, 0x00ff88, this.exitPulse * 0.5);
    this.mapGfx.strokeCircle(ex, ey, 5);
    for (let i = 0; i < cfg.crystals.length; i++) {
      if (this.collectedCrystals.has(i)) continue;
      const cx = this.mapX + cfg.crystals[i].x * this.mapScaleX;
      const cy = this.mapY + cfg.crystals[i].y * this.mapScaleY;
      this.mapGfx.fillStyle(0xffd700, 1);
      this.mapGfx.fillCircle(cx, cy, 2.5);
    }
    const px = Phaser.Math.Clamp(this.mapX + playerX * this.mapScaleX, this.mapX + 2, this.mapX + MAP_W - 2);
    const py = Phaser.Math.Clamp(this.mapY + playerY * this.mapScaleY, this.mapY + 2, this.mapY + MAP_H - 2);
    this.mapGfx.lineStyle(1, 0x00ffff, 0.35);
    this.mapGfx.strokeCircle(px, py, 5);
    this.mapGfx.fillStyle(0x00ffff, 1);
    this.mapGfx.fillCircle(px, py, 3);
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
    for (let i = 0; i < this.maxHealth; i++) {
      const color = i < health ? 0xff3355 : 0x333344;
      const heart = this.scene.add.graphics();
      heart.fillStyle(color, 1);
      heart.fillCircle(5, 5, 5);
      heart.fillCircle(13, 5, 5);
      heart.fillTriangle(0, 7, 18, 7, 9, 18);
      heart.x = i * 22;
      this.healthContainer.add(heart);
    }
  }

  update(
    score: number,
    health: number,
    crystals: number,
    totalCrystals: number,
    playerX = 0,
    playerY = 0,
    dashCooldownRemaining = 0,
    dashActive = false,
    shootCooldownRemaining = 0
  ) {
    const elapsed = this.scene.time.now - this.startTime - this.totalPausedMs;
    const secs = Math.floor(elapsed / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const timeStr = `${m}:${s.toString().padStart(2, "0")}`;

    this.scoreText.setText(`SCORE: ${score}`);
    this.crystalText.setText(`CRYSTALS: ${crystals}/${totalCrystals}`);
    this.timerText.setText(`TIME: ${timeStr}`);
    this.updateHearts(health);
    this.updateAbilityBars(dashCooldownRemaining, dashActive, shootCooldownRemaining);
    this.drawMiniMap(playerX, playerY);
  }

  private updateAbilityBars(dashCooldownRemaining = 0, dashActive = false, shootCooldownRemaining = 0) {
    const H = this.scene.scale.height;
    const anyAbility = this.abilities.doubleJump || this.abilities.dash || this.abilities.wallClimb;
    const panelH = 56 + (this.abilities.dash ? 30 : 0) + (this.abilities.shoot ? 30 : 0) + (anyAbility ? 24 : 0);
    const rowY0 = H - panelH + 4;
    const barW = 155;
    const barH = 5;

    // Slow bar
    this.slowBar.clear();
    this.slowBar.fillStyle(0x223355, 1);
    this.slowBar.fillRect(56, rowY0 + 16, barW, barH);
    let slowFill = 0, slowColor = 0x44ff88, slowStatusText = "READY";
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
    this.slowBar.fillRect(56, rowY0 + 16, barW * slowFill, barH);
    this.slowStatus.setPosition(14, rowY0 + 16);
    this.slowStatus.setText(slowStatusText);
    this.slowStatus.setColor(
      this.timeManager.slowReady && !this.timeManager.slowActive ? "#44ff88" :
      this.timeManager.slowActive ? "#8899ff" : "#ff8844"
    );

    const rowY1 = rowY0 + 34;

    // Dash bar (if unlocked)
    if (this.abilities.dash && this.dashBar && this.dashStatus && this.dashLabel) {
      const rowY2 = rowY1;
      this.dashLabel.setPosition(14, rowY2);
      this.dashBar.clear();
      this.dashBar.fillStyle(0x223355, 1);
      this.dashBar.fillRect(46, rowY2 + 16, barW, barH);
      let dashFill = 0, dashColor = 0x44ff88, dashStatusText = "READY";
      if (dashActive) {
        dashFill = 1; dashColor = 0xffaa00; dashStatusText = "DASHING!";
      } else if (dashCooldownRemaining > 0) {
        dashFill = 1 - dashCooldownRemaining / DASH_COOLDOWN;
        dashColor = 0xff6600;
        dashStatusText = `CD ${Math.ceil(dashCooldownRemaining / 1000)}s`;
      } else {
        dashFill = 1;
      }
      this.dashBar.fillStyle(dashColor, 1);
      this.dashBar.fillRect(46, rowY2 + 16, barW * dashFill, barH);
      this.dashStatus.setPosition(14, rowY2 + 16);
      this.dashStatus.setText(dashStatusText);
      this.dashStatus.setColor(dashFill >= 1 && !dashActive ? "#44ff88" : dashActive ? "#ffcc44" : "#ff8844");
    }

    // Shoot bar (if unlocked)
    const shootRowY = rowY1 + (this.abilities.dash ? 34 : 0);
    if (this.abilities.shoot && this.shootBar && this.shootStatus && this.shootLabel) {
      this.shootLabel.setPosition(14, shootRowY);
      this.shootBar.clear();
      this.shootBar.fillStyle(0x223355, 1);
      this.shootBar.fillRect(52, shootRowY + 16, barW, barH);
      let shootFill = 0, shootColor = 0x44ff88, shootStatusText = "READY";
      if (shootCooldownRemaining > 0) {
        shootFill = 1 - shootCooldownRemaining / PLAYER_SHOOT_COOLDOWN;
        shootColor = 0xff6600;
        shootStatusText = `CD ${Math.ceil(shootCooldownRemaining / 1000)}s`;
      } else {
        shootFill = 1;
      }
      this.shootBar.fillStyle(shootColor, 1);
      this.shootBar.fillRect(52, shootRowY + 16, barW * shootFill, barH);
      this.shootStatus.setPosition(14, shootRowY + 16);
      this.shootStatus.setText(shootStatusText);
      this.shootStatus.setColor(shootCooldownRemaining <= 0 ? "#44ff88" : "#ff8844");
    }
  }

  flashDamage() {
    this.scene.tweens.add({
      targets: this.damageFlash,
      alpha: { from: 0.55, to: 0 },
      duration: 480,
      ease: "Power2",
    });
    this.scene.cameras.main.shake(250, 0.018);
    this.scene.tweens.add({
      targets: this.scene.cameras.main,
      zoom: { from: 1.035, to: 1.0 },
      duration: 270,
      ease: "Power2",
    });
  }

  showCombo(count: number) {
    const W = this.scene.scale.width;
    const palette = ["", "", "#ffee44", "#ff9900", "#ff4400", "#ff00cc", "#00ffcc"];
    const color = palette[Math.min(count, palette.length - 1)] ?? "#00ffcc";
    const banner = this.scene.add
      .text(W / 2, 118, `${count}\u00d7 COMBO!`, {
        fontSize: count >= 4 ? "28px" : "22px",
        fontFamily: "monospace",
        color,
        stroke: "#000000",
        strokeThickness: 4,
        shadow: { offsetX: 0, offsetY: 0, color, blur: 14, fill: true },
      })
      .setOrigin(0.5)
      .setDepth(93)
      .setScrollFactor(0)
      .setAlpha(0);
    this.scene.tweens.add({
      targets: banner,
      alpha: 1,
      scaleX: { from: 0.75, to: 1.0 },
      scaleY: { from: 0.75, to: 1.0 },
      duration: 210,
      ease: "Back.easeOut",
      onComplete: () => {
        this.scene.time.delayedCall(900, () => {
          this.scene.tweens.add({
            targets: banner,
            alpha: 0,
            y: banner.y - 20,
            duration: 420,
            ease: "Power2",
            onComplete: () => banner.destroy(),
          });
        });
      },
    });
  }

  showCrystalsComplete() {
    const W = this.scene.scale.width;
    const banner = this.scene.add
      .text(W / 2, 80, "ALL CRYSTALS! Reach the exit!", {
        fontSize: "20px",
        fontFamily: "monospace",
        color: "#ffd700",
        stroke: "#553300",
        strokeThickness: 3,
        backgroundColor: "#000000aa",
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5).setDepth(92).setScrollFactor(0);

    this.scene.time.delayedCall(3000, () => {
      this.scene.tweens.add({
        targets: banner,
        alpha: 0,
        duration: 600,
        onComplete: () => banner.destroy(),
      });
    });
  }

  showBossDefeated() {
    const W = this.scene.scale.width;
    const banner = this.scene.add
      .text(W / 2, 80, "BOSS DEFEATED! Enter the portal!", {
        fontSize: "22px",
        fontFamily: "monospace",
        color: "#ff8800",
        stroke: "#550000",
        strokeThickness: 3,
        backgroundColor: "#000000cc",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5).setDepth(92).setScrollFactor(0);

    this.scene.tweens.add({
      targets: banner,
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      duration: 300,
      ease: "Back.easeOut",
    });
  }

  getElapsedTime() {
    return this.scene.time.now - this.startTime - this.totalPausedMs;
  }

  destroy() {
    this.exitPulseTween?.stop();
  }
}
