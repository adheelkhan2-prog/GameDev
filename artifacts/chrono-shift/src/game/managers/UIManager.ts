import Phaser from "phaser";
import { TimeManager } from "./TimeManager";
import {
  TIME_SLOW_DURATION,
  TIME_SLOW_COOLDOWN,
  TIME_REWIND_COOLDOWN,
  COLORS,
} from "../constants";

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
  private winBanner!: Phaser.GameObjects.Container;

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

    // Background panel top-left
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

    // Health hearts
    this.healthContainer = this.scene.add.container(16, 60).setDepth(91).setScrollFactor(0) as Phaser.GameObjects.Container;
    this.updateHearts(3);

    // Timer top-right
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

    // Ability bars bottom-left
    const abilityBg = this.scene.add.graphics();
    abilityBg.fillStyle(0x000000, 0.6);
    abilityBg.fillRoundedRect(6, H - 86, 220, 80, 8);
    abilityBg.setDepth(90).setScrollFactor(0);

    // Time Slow
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

    // Time Rewind
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

    // Damage flash overlay
    this.damageFlash = this.scene.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0);
    this.damageFlash.setDepth(95).setScrollFactor(0);
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

  update(score: number, health: number, crystals: number, totalCrystals: number) {
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
  }

  private updateAbilityBars() {
    const H = this.scene.scale.height;
    const barW = 155;
    const barH = 5;

    // Slow bar
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

    // Rewind bar
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
      this.scene.tweens.add({ targets: banner, alpha: 0, duration: 600, onComplete: () => banner.destroy() });
    });
  }

  getElapsedTime() {
    return this.scene.time.now - this.startTime;
  }

  destroy() {}
}
