import Phaser from "phaser";
import { TimeManager } from "../managers/TimeManager";
import { soundManager } from "../managers/SoundManager";
import {
  PLAYER_SPEED,
  PLAYER_JUMP_VELOCITY,
  PLAYER_MAX_HEALTH,
  PLAYER_INVINCIBILITY_TIME,
  DASH_SPEED,
  DASH_DURATION,
  DASH_COOLDOWN,
  DOUBLE_JUMP_VELOCITY,
  WALL_JUMP_VX,
  WALL_JUMP_VY,
  COLORS,
} from "../constants";
import type { UnlockedAbilities } from "../utils/settings";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyR!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyQ!: Phaser.Input.Keyboard.Key;

  private timeManager: TimeManager;

  health: number;
  readonly maxHealth: number;
  score = 0;
  invincible = false;
  private invincibleTimer: Phaser.Time.TimerEvent | null = null;
  private blinkTween: Phaser.Tweens.Tween | null = null;

  private glowGraphic: Phaser.GameObjects.Graphics;
  private glowTween: Phaser.Tweens.Tween | null = null;

  onDamage?: () => void;
  onDeath?: () => void;

  // Jump tracking
  private jumpCount = 0;
  private prevOnGround = false;
  private prevVelocityY = 0;

  // Unlocked abilities
  readonly hasDoubleJump: boolean;
  readonly hasDash: boolean;
  readonly hasWallClimb: boolean;

  // Dash state
  dashCooldownRemaining = 0;
  dashActive = false;
  private dashTimer: Phaser.Time.TimerEvent | null = null;

  // Wall contact
  private walledLeft = false;
  private walledRight = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    timeManager: TimeManager,
    maxHealth = PLAYER_MAX_HEALTH,
    abilities: UnlockedAbilities = { doubleJump: false, dash: false, wallClimb: false }
  ) {
    super(scene, x, y, "player");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.timeManager = timeManager;
    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.hasDoubleJump = abilities.doubleJump;
    this.hasDash = abilities.dash;
    this.hasWallClimb = abilities.wallClimb;

    this.setCollideWorldBounds(true);
    this.setBounce(0.05);
    this.setDepth(20);
    this.setGravityY(0);

    this.glowGraphic = scene.add.graphics();
    this.glowGraphic.setDepth(19);
    this.renderGlow();
    this.glowTween = scene.tweens.add({
      targets: this.glowGraphic,
      alpha: { from: 0.3, to: 0.8 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keyA = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keySpace = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyE = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyR = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyQ = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

    scene.input.keyboard!.on("keydown-E", () => {
      this.timeManager.activateTimeSlow();
    });
    scene.input.keyboard!.on("keydown-R", () => {
      this.timeManager.activateTimeRewind();
    });
  }

  private renderGlow() {
    const color = this.dashActive ? 0xffaa00 : COLORS.PLAYER_GLOW;
    const radius = this.dashActive ? 30 : 22;
    this.glowGraphic.clear();
    this.glowGraphic.fillStyle(color, 0.4);
    this.glowGraphic.fillCircle(this.x, this.y + 4, radius);
  }

  update() {
    if (!this.active || this.timeManager.rewindActive) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;

    this.walledLeft = body.blocked.left;
    this.walledRight = body.blocked.right;

    // Landing detection — spawn dust and maybe shake
    if (!this.prevOnGround && onGround) {
      if (this.prevVelocityY > 180) {
        this.spawnLandDust();
        if (this.prevVelocityY > 420) {
          this.scene.cameras.main.shake(80, 0.005);
        }
      }
      this.jumpCount = 0;
    }

    // Movement (locked during active dash)
    if (!this.dashActive) {
      if (left) {
        this.setVelocityX(-PLAYER_SPEED);
        this.setFlipX(true);
      } else if (right) {
        this.setVelocityX(PLAYER_SPEED);
        this.setFlipX(false);
      } else {
        this.setVelocityX(0);
      }
    }

    // Wall climb — slow fall when pressing into wall while airborne
    if (this.hasWallClimb && !onGround) {
      const touchingWall =
        (this.walledLeft && left) || (this.walledRight && right);
      if (touchingWall && body.velocity.y > 55) {
        body.setVelocityY(55);
      }
    }

    // Jump logic
    const jumpJustDown =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace) ||
      Phaser.Input.Keyboard.JustDown(this.keyW);

    if (jumpJustDown) {
      if (onGround) {
        // Normal jump
        this.setVelocityY(PLAYER_JUMP_VELOCITY);
        this.jumpCount = 1;
        this.spawnJumpDust();
        soundManager.jump();
      } else if (
        this.hasWallClimb &&
        (this.walledLeft || this.walledRight) &&
        !onGround
      ) {
        // Wall jump
        const wallDir = this.walledLeft ? 1 : -1;
        this.setVelocityX(wallDir * WALL_JUMP_VX);
        this.setVelocityY(WALL_JUMP_VY);
        this.setFlipX(wallDir < 0);
        this.jumpCount = 1;
        this.spawnJumpDust();
        soundManager.jump();
      } else if (this.hasDoubleJump && this.jumpCount === 1) {
        // Double jump
        this.setVelocityY(DOUBLE_JUMP_VELOCITY);
        this.jumpCount = 2;
        this.spawnDoubleJumpEffect();
        soundManager.doubleJump();
      }
    }

    // Dash (Q key)
    const dashReady = this.dashCooldownRemaining <= 0 && !this.dashActive;
    if (
      this.hasDash &&
      dashReady &&
      Phaser.Input.Keyboard.JustDown(this.keyQ)
    ) {
      const dir = this.flipX ? -1 : 1;
      this.performDash(dir);
    }

    // Dash cooldown tick
    if (this.dashCooldownRemaining > 0) {
      this.dashCooldownRemaining = Math.max(
        0,
        this.dashCooldownRemaining - 16 * this.timeManager.getSlowMultiplier()
      );
    }

    this.prevOnGround = onGround;
    this.prevVelocityY = body.velocity.y;
    this.renderGlow();
  }

  private performDash(dir: number) {
    this.dashActive = true;
    this.invincible = true;
    this.dashCooldownRemaining = DASH_COOLDOWN;
    this.setVelocityX(dir * DASH_SPEED);
    soundManager.dash();

    try {
      const trail = this.scene.add.particles(this.x, this.y, "particle", {
        speed: { min: 20, max: 90 },
        angle: dir > 0 ? { min: 155, max: 205 } : { min: -25, max: 25 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 210,
        quantity: 4,
        frequency: 14,
        tint: [0xffaa00, 0xffffff, 0x00ffff],
        follow: this,
      });
      this.scene.time.delayedCall(DASH_DURATION + 60, () => trail.destroy());
    } catch {}

    this.dashTimer?.destroy();
    this.dashTimer = this.scene.time.delayedCall(DASH_DURATION, () => {
      this.dashActive = false;
      this.invincible = false;
    });
  }

  private spawnJumpDust() {
    try {
      const em = this.scene.add.particles(this.x, this.y + 22, "particle", {
        speed: { min: 30, max: 80 },
        angle: { min: 200, max: 340 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 260,
        quantity: 6,
        tint: COLORS.PLAYER,
      });
      this.scene.time.delayedCall(320, () => em.destroy());
    } catch {}
  }

  private spawnLandDust() {
    try {
      const em = this.scene.add.particles(this.x, this.y + 22, "particle", {
        speed: { min: 20, max: 110 },
        angle: { min: 190, max: 350 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 0.65, end: 0 },
        lifespan: 310,
        quantity: 10,
        tint: [0x88aaaa, 0xaacccc, COLORS.PLAYER],
      });
      this.scene.time.delayedCall(380, () => em.destroy());
    } catch {}
  }

  private spawnDoubleJumpEffect() {
    try {
      const em = this.scene.add.particles(this.x, this.y, "particle", {
        speed: { min: 50, max: 160 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.1, end: 0 },
        alpha: { start: 0.95, end: 0 },
        lifespan: 380,
        quantity: 16,
        tint: [0x00ffff, 0x0088ff, 0xffffff],
      });
      this.scene.time.delayedCall(420, () => em.destroy());
    } catch {}
  }

  takeDamage() {
    if (this.invincible || !this.active) return;

    this.health--;
    this.invincible = true;
    soundManager.damage();
    this.onDamage?.();

    if (this.health <= 0) {
      this.die();
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    const knockDir = body.velocity.x >= 0 ? -1 : 1;
    body.setVelocity(knockDir * 280, -200);

    this.setTexture("player_hit");
    this.scene.time.delayedCall(150, () => {
      if (this.active) this.setTexture("player");
    });

    this.blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.3, to: 1 },
      duration: 120,
      yoyo: true,
      repeat: 6,
    });

    this.invincibleTimer = this.scene.time.delayedCall(
      PLAYER_INVINCIBILITY_TIME,
      () => {
        this.invincible = false;
        this.setAlpha(1);
      }
    );
  }

  private die() {
    this.blinkTween?.stop();
    this.invincibleTimer?.destroy();
    this.dashTimer?.destroy();
    this.glowTween?.stop();
    this.glowGraphic.destroy();
    soundManager.death();

    try {
      const em = this.scene.add.particles(this.x, this.y, "particle", {
        speed: { min: 80, max: 270 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.2, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 700,
        quantity: 22,
        tint: [COLORS.PLAYER, COLORS.PLAYER_GLOW, 0xffffff],
      });
      this.scene.time.delayedCall(800, () => em.destroy());
    } catch {}

    this.setActive(false).setVisible(false);
    this.onDeath?.();
  }

  addScore(points: number) {
    this.score += points;
  }

  destroy(fromScene?: boolean) {
    this.glowGraphic?.destroy();
    this.glowTween?.stop();
    this.dashTimer?.destroy();
    super.destroy(fromScene);
  }
}
