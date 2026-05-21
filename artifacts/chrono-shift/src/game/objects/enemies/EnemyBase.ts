import Phaser from "phaser";
import { TimeManager } from "../../managers/TimeManager";

export abstract class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  protected timeManager: TimeManager;
  protected baseSpeed: number;
  baseSpeedMultiplier = 1.0;
  active = true;
  hp = 1;
  onDefeated?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    timeManager: TimeManager,
    baseSpeed: number
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.timeManager = timeManager;
    this.baseSpeed = baseSpeed;
    this.setDepth(15);
    this.setCollideWorldBounds(true);
    this.setBounce(0.05);
  }

  abstract update(delta: number): void;

  protected getEffectiveSpeed(): number {
    return this.baseSpeed * this.baseSpeedMultiplier * this.timeManager.getSlowMultiplier();
  }

  takeDamage(amount = 1): boolean {
    if (!this.active) return false;
    this.hp -= amount;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(130, () => {
      if (this.active) this.clearTint();
    });
    if (this.hp <= 0) {
      this.spawnDeathEffect();
      this.setActive(false).setVisible(false);
      if (this.body) (this.body as Phaser.Physics.Arcade.Body).enable = false;
      this.onDefeated?.();
      return true;
    }
    return false;
  }

  private spawnDeathEffect() {
    try {
      const em = this.scene.add.particles(this.x, this.y, "particle", {
        speed: { min: 60, max: 220 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 520,
        quantity: 16,
        tint: [0xff4400, 0xff8800, 0xffff44],
      });
      this.scene.time.delayedCall(620, () => em.destroy());
    } catch {}
  }

  hitByRewind() {}
}
