import Phaser from "phaser";
import { EnemyBase } from "./EnemyBase";
import { TimeManager } from "../../managers/TimeManager";
import { PULSAR_FIRE_INTERVAL, COLORS } from "../../constants";
import { Projectile } from "../Projectile";

export class Pulsar extends EnemyBase {
  private fireTimer = 0;
  private fireInterval: number;
  private projectiles: Phaser.Physics.Arcade.Group;
  private pulseGraphic: Phaser.GameObjects.Graphics;
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private fireAngle: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    timeManager: TimeManager,
    projectileGroup: Phaser.Physics.Arcade.Group,
    fireAngle = 180
  ) {
    super(scene, x, y, "pulsar", timeManager, 0);
    this.projectiles = projectileGroup;
    this.fireInterval = PULSAR_FIRE_INTERVAL + Phaser.Math.Between(-400, 400);
    this.fireAngle = fireAngle;

    this.setImmovable(true);
    this.setGravityY(0);

    // Outer pulse ring
    this.pulseGraphic = scene.add.graphics();
    this.pulseGraphic.setDepth(14);
    this.drawPulseRing(1);

    this.pulseTween = scene.tweens.add({
      targets: { value: 0 },
      value: 1,
      duration: this.fireInterval * 0.8,
      repeat: -1,
      onUpdate: (tween) => {
        const v = tween.getValue() as number;
        this.drawPulseRing(v);
      },
    });
  }

  private drawPulseRing(progress: number) {
    this.pulseGraphic.clear();
    const r = 18 + progress * 22;
    const alpha = 0.6 * (1 - progress) * this.timeManager.getSlowMultiplier() + 0.1;
    this.pulseGraphic.lineStyle(2, COLORS.PULSAR, alpha);
    this.pulseGraphic.strokeCircle(this.x, this.y, r);
  }

  update(delta: number) {
    if (!this.active) return;
    const slowMult = this.timeManager.getSlowMultiplier();
    this.fireTimer += delta * slowMult;

    if (this.fireTimer >= this.fireInterval) {
      this.fireTimer = 0;
      this.fire();
    }

    this.drawPulseRing(this.fireTimer / this.fireInterval);
  }

  private fire() {
    // Fire in the set angle direction (and sometimes spread)
    const angles = [this.fireAngle];
    if (this.fireInterval < 1500) {
      angles.push(this.fireAngle + 45, this.fireAngle - 45);
    }

    for (const angle of angles) {
      const proj = new Projectile(this.scene, this.x, this.y, this.timeManager);
      this.projectiles.add(proj, true);

      const rad = Phaser.Math.DegToRad(angle);
      const speed = 280;
      (proj.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(rad) * speed, Math.sin(rad) * speed);
    }

    // Fire flash
    this.scene.cameras.main.flash(60, 255, 100, 0, false);
  }

  destroy(fromScene?: boolean) {
    this.pulseGraphic?.destroy();
    this.pulseTween?.stop();
    super.destroy(fromScene);
  }
}
