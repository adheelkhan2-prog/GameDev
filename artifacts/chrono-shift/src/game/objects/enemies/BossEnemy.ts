import Phaser from "phaser";
import { EnemyBase } from "./EnemyBase";
import { TimeManager } from "../../managers/TimeManager";
import {
  BOSS_MAX_HP,
  BOSS_SPEED,
  BOSS_CHARGE_SPEED,
  BOSS_FIRE_INTERVAL,
  COLORS,
} from "../../constants";

export type BossPhase = 1 | 2 | 3;

export class BossEnemy extends EnemyBase {
  private player: Phaser.Physics.Arcade.Sprite;
  private projectileGroup: Phaser.Physics.Arcade.Group;
  private glowGfx: Phaser.GameObjects.Graphics;
  private hpBarGfx: Phaser.GameObjects.Graphics;
  private phaseLabel: Phaser.GameObjects.Text;

  phase: BossPhase = 1;
  private charging = false;
  private chargeTarget = 0;
  private chargeTimer = 0;
  private fireTimer = 0;
  private idleTimer = 0;
  private patrolDir = 1;
  private arenaMinX: number;
  private arenaMaxX: number;
  onPhaseChange?: (phase: BossPhase) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    timeManager: TimeManager,
    player: Phaser.Physics.Arcade.Sprite,
    projectileGroup: Phaser.Physics.Arcade.Group,
    arenaMinX: number,
    arenaMaxX: number
  ) {
    super(scene, x, y, "boss", timeManager, BOSS_SPEED);
    this.player = player;
    this.projectileGroup = projectileGroup;
    this.arenaMinX = arenaMinX;
    this.arenaMaxX = arenaMaxX;
    this.hp = BOSS_MAX_HP;
    this.setDepth(20);
    this.setCollideWorldBounds(true);

    this.glowGfx = scene.add.graphics().setDepth(19);
    this.hpBarGfx = scene.add.graphics().setDepth(30);
    this.phaseLabel = scene.add.text(x, y - 60, "PHASE I", {
      fontSize: "14px", fontFamily: "monospace", color: "#ff4400",
      stroke: "#000000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(31);

    this.drawGlow();
  }

  private drawGlow() {
    this.glowGfx.clear();
    const color = this.phase === 3 ? COLORS.BOSS_GLOW : (this.phase === 2 ? 0xff6600 : COLORS.BOSS);
    this.glowGfx.fillStyle(color, 0.25);
    this.glowGfx.fillCircle(this.x, this.y, 52);
  }

  private drawHpBar() {
    const W = this.scene.scale.width;
    const pct = Math.max(0, this.hp / BOSS_MAX_HP);
    const barW = 400;
    const barH = 22;
    const bx = W / 2 - barW / 2;
    const by = 24;

    this.hpBarGfx.clear();
    this.hpBarGfx.fillStyle(0x220000, 0.9);
    this.hpBarGfx.fillRoundedRect(bx - 2, by - 2, barW + 4, barH + 4, 6);
    const fillColor = this.phase === 3 ? 0xff8800 : (this.phase === 2 ? 0xff4400 : 0xdd0022);
    this.hpBarGfx.fillStyle(fillColor, 1);
    this.hpBarGfx.fillRoundedRect(bx, by, Math.max(4, barW * pct), barH, 5);
    this.hpBarGfx.lineStyle(2, 0xff6644, 0.7);
    this.hpBarGfx.strokeRoundedRect(bx, by, barW, barH, 5);
    // Phase markers
    this.hpBarGfx.lineStyle(1, 0xffffff, 0.4);
    this.hpBarGfx.lineBetween(bx + barW * (10 / 15), by, bx + barW * (10 / 15), by + barH);
    this.hpBarGfx.lineBetween(bx + barW * (5 / 15), by, bx + barW * (5 / 15), by + barH);
  }

  update(delta: number) {
    if (!this.active || !this.body) return;

    const slow = this.timeManager.getSlowMultiplier();
    const dt = (delta / 1000) * slow;

    const newPhase: BossPhase =
      this.hp > 10 ? 1 : this.hp > 5 ? 2 : 3;

    if (newPhase !== this.phase) {
      this.phase = newPhase;
      this.onPhaseChange?.(this.phase);
      this.setTint(0xffffff);
      this.scene.time.delayedCall(200, () => { if (this.active) this.clearTint(); });
      const labels = { 1: "PHASE I", 2: "PHASE II", 3: "PHASE III" };
      this.phaseLabel.setText(labels[this.phase]);
    }

    // Charge logic
    if (this.charging) {
      const dir = this.chargeTarget > this.x ? 1 : -1;
      this.setVelocityX(dir * BOSS_CHARGE_SPEED * slow);
      this.setFlipX(dir < 0);
      if (Math.abs(this.x - this.chargeTarget) < 30 || this.x <= this.arenaMinX || this.x >= this.arenaMaxX) {
        this.charging = false;
        this.setVelocityX(0);
        this.idleTimer = this.phase === 3 ? 0.3 : 0.7;
      }
    } else {
      this.idleTimer -= dt;
      if (this.idleTimer <= 0) {
        this.chargeTimer -= dt;
        const chargeInterval = this.phase === 3 ? 1.8 : this.phase === 2 ? 2.6 : 3.5;
        if (this.chargeTimer <= 0) {
          this.charging = true;
          this.chargeTarget = this.player.x;
          this.chargeTimer = chargeInterval;
        } else {
          // Patrol
          const speed = BOSS_SPEED * slow * (this.phase === 3 ? 1.3 : this.phase === 2 ? 1.1 : 1.0);
          this.setVelocityX(this.patrolDir * speed);
          this.setFlipX(this.patrolDir < 0);
          if (this.x >= this.arenaMaxX - 20) this.patrolDir = -1;
          else if (this.x <= this.arenaMinX + 20) this.patrolDir = 1;
        }
      }
    }

    // Projectile firing (phase 2+)
    if (this.phase >= 2) {
      this.fireTimer -= dt;
      const fi = this.phase === 3 ? BOSS_FIRE_INTERVAL * 0.55 : BOSS_FIRE_INTERVAL;
      if (this.fireTimer <= -(fi / 1000)) {
        this.fireTimer = 0;
        this.fireProjectiles();
      }
    }

    this.drawGlow();
    this.phaseLabel.setPosition(this.x, this.y - 60);
    this.drawHpBar();
  }

  private fireProjectiles() {
    const angles = this.phase === 3 ? [-30, -15, 0, 15, 30] : [-20, 0, 20];
    for (const angle of angles) {
      const proj = this.scene.physics.add.sprite(this.x, this.y, "projectile");
      proj.setDepth(16);
      this.projectileGroup.add(proj);
      const dx = this.player.x - this.x;
      const dy = this.player.y - this.y;
      const baseAngle = Math.atan2(dy, dx) * (180 / Math.PI) + angle;
      const rad = baseAngle * (Math.PI / 180);
      const speed = 240;
      proj.setVelocity(Math.cos(rad) * speed, Math.sin(rad) * speed);
      proj.setGravityY(-600);
      this.scene.time.delayedCall(2500, () => { if (proj.active) proj.destroy(); });
    }
  }

  takeDamage(amount = 1): boolean {
    if (!this.active) return false;
    const died = super.takeDamage(amount);
    if (!died) {
      this.drawHpBar();
      this.scene.cameras.main.shake(120, 0.006);
    }
    return died;
  }

  destroy(fromScene?: boolean) {
    this.glowGfx?.destroy();
    this.hpBarGfx?.destroy();
    this.phaseLabel?.destroy();
    super.destroy(fromScene);
  }
}
