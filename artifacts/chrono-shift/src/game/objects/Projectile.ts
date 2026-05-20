import Phaser from "phaser";
import { TimeManager } from "../managers/TimeManager";
import { COLORS } from "../constants";

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  private timeManager: TimeManager;
  private baseVx = 0;
  private baseVy = 0;
  private trailTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, timeManager: TimeManager) {
    super(scene, x, y, "projectile");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.timeManager = timeManager;
    this.setDepth(12);
    this.setGravityY(0);
    this.setCollideWorldBounds(false);
  }

  fire(vx: number, vy: number) {
    this.baseVx = vx;
    this.baseVy = vy;
    this.setActive(true).setVisible(true);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
  }

  update(delta: number) {
    if (!this.active) return;

    // Adjust velocity for time slow
    const slow = this.timeManager.getSlowMultiplier();
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.timeManager.slowActive) {
      body.setVelocity(this.baseVx * slow, this.baseVy * slow);
    } else if (this.baseVx !== 0 || this.baseVy !== 0) {
      body.setVelocity(this.baseVx, this.baseVy);
    }

    // Emit trail
    this.trailTimer += delta;
    if (this.trailTimer > 40) {
      this.trailTimer = 0;
      try {
        const t = this.scene.add.image(this.x, this.y, "particle");
        t.setAlpha(0.5).setTint(COLORS.PROJECTILE).setDepth(11).setScale(0.6);
        this.scene.tweens.add({
          targets: t,
          alpha: 0,
          scale: 0,
          duration: 200,
          onComplete: () => t.destroy(),
        });
      } catch {}
    }

    // Destroy if out of bounds
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const cam = this.scene.cameras.main;
    if (
      this.x < cam.scrollX - 100 ||
      this.x > cam.scrollX + W + 100 ||
      this.y < cam.scrollY - 100 ||
      this.y > cam.scrollY + H + 100
    ) {
      this.setActive(false).setVisible(false);
    }
  }
}
