import Phaser from "phaser";
import { TimeManager } from "../managers/TimeManager";
import {
  PLAYER_SPEED,
  PLAYER_JUMP_VELOCITY,
  PLAYER_MAX_HEALTH,
  PLAYER_INVINCIBILITY_TIME,
  COLORS,
} from "../constants";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyR!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;

  private timeManager: TimeManager;

  health = PLAYER_MAX_HEALTH;
  score = 0;
  invincible = false;
  private invincibleTimer: Phaser.Time.TimerEvent | null = null;
  private blinkTween: Phaser.Tweens.Tween | null = null;

  private glowGraphic: Phaser.GameObjects.Graphics;
  private glowTween: Phaser.Tweens.Tween | null = null;

  onDamage?: () => void;
  onDeath?: () => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    timeManager: TimeManager
  ) {
    super(scene, x, y, "player");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.timeManager = timeManager;

    this.setCollideWorldBounds(true);
    this.setBounce(0.05);
    this.setDepth(20);
    this.setGravityY(0);

    // Glow behind player
    this.glowGraphic = scene.add.graphics();
    this.glowGraphic.setDepth(19);
    this.updateGlow();
    this.glowTween = scene.tweens.add({
      targets: this.glowGraphic,
      alpha: { from: 0.3, to: 0.8 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Input
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keyA = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keySpace = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyE = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyR = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    scene.input.keyboard!.on("keydown-E", () => {
      this.timeManager.activateTimeSlow();
    });
    scene.input.keyboard!.on("keydown-R", () => {
      this.timeManager.activateTimeRewind();
    });
  }

  private updateGlow() {
    this.glowGraphic.clear();
    this.glowGraphic.fillStyle(COLORS.PLAYER_GLOW, 0.4);
    this.glowGraphic.fillCircle(this.x, this.y + 4, 22);
  }

  update() {
    if (!this.active || this.timeManager.rewindActive) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;

    // Movement
    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;

    if (left) {
      this.setVelocityX(-PLAYER_SPEED);
      this.setFlipX(true);
    } else if (right) {
      this.setVelocityX(PLAYER_SPEED);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Jump
    const jumpPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace) ||
      Phaser.Input.Keyboard.JustDown(this.keyW);

    if (jumpPressed && onGround) {
      this.setVelocityY(PLAYER_JUMP_VELOCITY);
      this.spawnJumpDust();
    }

    // Update glow position
    this.glowGraphic.x = 0;
    this.glowGraphic.y = 0;
    this.updateGlow();
  }

  private spawnJumpDust() {
    try {
      const emitter = this.scene.add.particles(this.x, this.y + 22, "particle", {
        speed: { min: 30, max: 80 },
        angle: { min: 200, max: 340 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.5, end: 0 },
        lifespan: 250,
        quantity: 6,
        tint: COLORS.PLAYER,
      });
      this.scene.time.delayedCall(300, () => emitter.destroy());
    } catch {}
  }

  takeDamage() {
    if (this.invincible || !this.active) return;

    this.health--;
    this.invincible = true;

    this.onDamage?.();

    if (this.health <= 0) {
      this.die();
      return;
    }

    // Knockback
    const body = this.body as Phaser.Physics.Arcade.Body;
    const knockDir = body.velocity.x >= 0 ? -1 : 1;
    body.setVelocity(knockDir * 280, -200);

    // Blink effect
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

    this.invincibleTimer = this.scene.time.delayedCall(PLAYER_INVINCIBILITY_TIME, () => {
      this.invincible = false;
      this.setAlpha(1);
    });
  }

  private die() {
    this.blinkTween?.stop();
    this.invincibleTimer?.destroy();
    this.glowTween?.stop();
    this.glowGraphic.destroy();

    // Death burst
    try {
      const emitter = this.scene.add.particles(this.x, this.y, "particle", {
        speed: { min: 80, max: 250 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.2, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 600,
        quantity: 20,
        tint: [COLORS.PLAYER, COLORS.PLAYER_GLOW, 0xffffff],
      });
      this.scene.time.delayedCall(700, () => emitter.destroy());
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
    super.destroy(fromScene);
  }
}
