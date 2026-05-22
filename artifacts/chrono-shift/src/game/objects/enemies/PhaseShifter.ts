import Phaser from "phaser";
import { EnemyBase } from "./EnemyBase";
import { TimeManager } from "../../managers/TimeManager";
import { PHASE_SHIFTER_TELEPORT_INTERVAL, COLORS } from "../../constants";

export class PhaseShifter extends EnemyBase {
  private teleportTimer = 0;
  private teleportInterval: number;
  private platformBounds: Array<{ x: number; y: number; w: number; h: number }>;
  private glowGraphic: Phaser.GameObjects.Graphics;
  private blinkTween: Phaser.Tweens.Tween | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    timeManager: TimeManager,
    platformBounds: Array<{ x: number; y: number; w: number; h: number }>
  ) {
    super(scene, x, y, "phase_shifter", timeManager, 0);
    this.teleportInterval = PHASE_SHIFTER_TELEPORT_INTERVAL + Phaser.Math.Between(-500, 500);
    this.platformBounds = platformBounds;
    this.setGravityY(200);
    this.initHealthBar(2);

    this.glowGraphic = scene.add.graphics();
    this.glowGraphic.setDepth(14);
    this.updateGlow(0);

    scene.tweens.add({
      targets: this.glowGraphic,
      alpha: { from: 0.3, to: 0.9 },
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
  }

  private updateGlow(progress: number) {
    this.glowGraphic.clear();
    const isWarning = progress > 0.72;
    const color = isWarning ? 0xff2200 : COLORS.PHASE_SHIFTER;
    const radius = isWarning ? 26 + Math.sin(Date.now() / 80) * 3 : 22;
    this.glowGraphic.fillStyle(color, 0.4);
    this.glowGraphic.fillCircle(this.x, this.y, radius);
    if (isWarning) {
      this.glowGraphic.lineStyle(2, 0xff5500, 0.8);
      this.glowGraphic.strokeCircle(this.x, this.y, radius + 9);
    }
  }

  update(delta: number) {
    if (!this.active || !this.body) return;

    const slowMult = this.timeManager.getSlowMultiplier();
    this.teleportTimer += delta * slowMult;

    if (this.teleportTimer >= this.teleportInterval) {
      this.teleportTimer = 0;
      this.teleportToPlatform();
    }

    const progress = this.teleportTimer / this.teleportInterval;
    this.updateGlow(progress);
    this.drawHpBar();
  }

  private teleportToPlatform() {
    if (this.platformBounds.length === 0) return;

    const platform = Phaser.Utils.Array.GetRandom(this.platformBounds);
    const newX = platform.x + Phaser.Math.Between(20, Math.max(20, platform.w - 20));
    const newY = platform.y - 20;

    this.blinkTween?.stop();
    this.setAlpha(0);
    this.blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 300,
      ease: "Power2",
    });

    try {
      const emitter = this.scene.add.particles(this.x, this.y, "particle", {
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 350,
        quantity: 10,
        tint: COLORS.PHASE_SHIFTER,
      });
      this.scene.time.delayedCall(400, () => emitter.destroy());
    } catch {}

    this.setPosition(newX, newY);
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).reset(newX, newY);
    }

    try {
      const emitter2 = this.scene.add.particles(newX, newY, "particle", {
        speed: { min: 40, max: 120 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 300,
        quantity: 8,
        tint: 0xffaa00,
      });
      this.scene.time.delayedCall(350, () => emitter2.destroy());
    } catch {}
  }

  destroy(fromScene?: boolean) {
    this.glowGraphic?.destroy();
    super.destroy(fromScene);
  }
}
