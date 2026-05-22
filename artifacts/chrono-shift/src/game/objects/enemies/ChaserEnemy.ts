import Phaser from "phaser";
import { EnemyBase } from "./EnemyBase";
import { TimeManager } from "../../managers/TimeManager";
import { CHASER_SPEED, CHASER_AGGRO_RANGE, COLORS } from "../../constants";

export class ChaserEnemy extends EnemyBase {
  private player: Phaser.Physics.Arcade.Sprite;
  private glowGraphic: Phaser.GameObjects.Graphics;
  private aggroActive = false;
  private patrolDir = 1;
  private patrolMinX: number;
  private patrolMaxX: number;
  private aggroSound = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    timeManager: TimeManager,
    player: Phaser.Physics.Arcade.Sprite,
    patrolMinX: number,
    patrolMaxX: number
  ) {
    super(scene, x, y, "chaser", timeManager, CHASER_SPEED);
    this.player = player;
    this.patrolMinX = patrolMinX;
    this.patrolMaxX = patrolMaxX;
    this.initHealthBar(2);

    this.glowGraphic = scene.add.graphics();
    this.glowGraphic.setDepth(14);
    this.drawGlow(false);

    scene.tweens.add({
      targets: this.glowGraphic,
      alpha: { from: 0.2, to: 0.85 },
      duration: 450,
      yoyo: true,
      repeat: -1,
    });
  }

  private drawGlow(aggro: boolean) {
    this.glowGraphic.clear();
    this.glowGraphic.fillStyle(aggro ? COLORS.CHASER : 0xaa1133, 0.35);
    this.glowGraphic.fillCircle(this.x, this.y, aggro ? 28 : 18);
  }

  update(_delta: number) {
    if (!this.active || !this.body) return;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
    const speed = this.getEffectiveSpeed();

    if (dist < CHASER_AGGRO_RANGE && this.player.active) {
      this.aggroActive = true;
      const dx = this.player.x - this.x;
      const chaseSpeed = speed * 1.4;
      this.setVelocityX(dx > 0 ? chaseSpeed : -chaseSpeed);
      this.setFlipX(dx < 0);
    } else {
      this.aggroActive = false;
      this.setVelocityX(this.patrolDir * speed);
      if (this.x >= this.patrolMaxX) { this.patrolDir = -1; this.setFlipX(true); }
      else if (this.x <= this.patrolMinX) { this.patrolDir = 1; this.setFlipX(false); }
    }

    this.drawGlow(this.aggroActive);
    this.drawHpBar();
  }

  destroy(fromScene?: boolean) {
    this.glowGraphic?.destroy();
    super.destroy(fromScene);
  }
}
