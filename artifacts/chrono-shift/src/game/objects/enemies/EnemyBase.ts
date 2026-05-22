import Phaser from "phaser";
import { TimeManager } from "../../managers/TimeManager";

export abstract class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  protected timeManager: TimeManager;
  protected baseSpeed: number;
  baseSpeedMultiplier = 1.0;
  active = true;
  hp = 1;
  maxHp = 1;
  protected hpBarGfx: Phaser.GameObjects.Graphics | null = null;
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

  protected initHealthBar(hp: number) {
    this.hp = hp;
    this.maxHp = hp;
    if (hp > 1) {
      this.hpBarGfx = this.scene.add.graphics().setDepth(31);
      this.drawHpBar();
    }
  }

  protected drawHpBar() {
    const gfx = this.hpBarGfx;
    if (!gfx || !this.active) return;
    const pct = Math.max(0, this.hp / this.maxHp);
    const bw = 32;
    const bh = 4;
    const bx = this.x - bw / 2;
    const by = this.y - 26;
    gfx.clear();
    gfx.fillStyle(0x1a0000, 0.9);
    gfx.fillRect(bx, by, bw, bh);
    const col = pct > 0.5 ? 0x44ff44 : pct > 0.25 ? 0xffaa00 : 0xff2222;
    gfx.fillStyle(col, 1);
    gfx.fillRect(bx, by, Math.max(1, bw * pct), bh);
  }

  takeDamage(amount = 1): boolean {
    if (!this.active) return false;
    this.hp -= amount;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(130, () => {
      if (this.active) this.clearTint();
    });
    if (this.hp <= 0) {
      this.hpBarGfx?.destroy();
      this.hpBarGfx = null;
      this.spawnDeathEffect();
      this.setActive(false).setVisible(false);
      if (this.body) (this.body as Phaser.Physics.Arcade.Body).enable = false;
      this.onDefeated?.();
      return true;
    }
    this.drawHpBar();
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

  destroy(fromScene?: boolean) {
    this.hpBarGfx?.destroy();
    super.destroy(fromScene);
  }
}
