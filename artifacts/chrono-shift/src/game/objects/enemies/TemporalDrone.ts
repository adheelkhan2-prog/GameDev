import Phaser from "phaser";
import { EnemyBase } from "./EnemyBase";
import { TimeManager } from "../../managers/TimeManager";
import { DRONE_SPEED, COLORS } from "../../constants";

export class TemporalDrone extends EnemyBase {
  private patrolMinX: number;
  private patrolMaxX: number;
  private direction = 1;
  private glowGraphic: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    timeManager: TimeManager,
    patrolMinX: number,
    patrolMaxX: number
  ) {
    super(scene, x, y, "drone", timeManager, DRONE_SPEED);
    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;
    this.setGravityY(0);
    this.setImmovable(false);

    this.glowGraphic = scene.add.graphics();
    this.glowGraphic.setDepth(14);
    this.updateGlow();

    // Subtle pulsing glow
    scene.tweens.add({
      targets: this.glowGraphic,
      alpha: { from: 0.2, to: 0.7 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  private updateGlow() {
    this.glowGraphic.clear();
    this.glowGraphic.fillStyle(COLORS.DRONE, 0.35);
    this.glowGraphic.fillCircle(this.x, this.y, 20);
  }

  update(_delta: number) {
    if (!this.active || !this.body) return;

    const speed = this.getEffectiveSpeed();
    this.setVelocityX(this.direction * speed);

    if (this.x >= this.patrolMaxX) {
      this.direction = -1;
      this.setFlipX(true);
    } else if (this.x <= this.patrolMinX) {
      this.direction = 1;
      this.setFlipX(false);
    }

    this.updateGlow();
  }

  destroy(fromScene?: boolean) {
    this.glowGraphic?.destroy();
    super.destroy(fromScene);
  }
}
