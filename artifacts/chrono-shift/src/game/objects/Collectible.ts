import Phaser from "phaser";
import { COLORS } from "../constants";
import { soundManager } from "../managers/SoundManager";

export type CollectibleType = "crystal" | "shard" | "health";

export class Collectible extends Phaser.Physics.Arcade.Sprite {
  readonly collectibleType: CollectibleType;
  private bobTween: Phaser.Tweens.Tween;
  private glowGraphic: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: CollectibleType
  ) {
    super(scene, x, y, type === "crystal" ? "crystal" : type === "shard" ? "shard" : "health_pickup");
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.collectibleType = type;
    this.setDepth(16);

    // Glow behind
    this.glowGraphic = scene.add.graphics();
    this.glowGraphic.setDepth(15);
    this.updateGlow();

    const glowColor =
      type === "crystal"
        ? COLORS.CRYSTAL_GLOW
        : type === "shard"
        ? COLORS.SHARD
        : COLORS.HEALTH_PICKUP;

    scene.tweens.add({
      targets: this.glowGraphic,
      alpha: { from: 0.2, to: 0.8 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    // Bobbing animation
    this.bobTween = scene.tweens.add({
      targets: this,
      y: y - 8,
      duration: 900 + Phaser.Math.Between(-100, 100),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Rotation for crystals
    if (type === "crystal") {
      scene.tweens.add({
        targets: this,
        rotation: Math.PI * 2,
        duration: 3000,
        repeat: -1,
        ease: "Linear",
      });
    }
  }

  private updateGlow() {
    this.glowGraphic.clear();
    const color =
      this.collectibleType === "crystal"
        ? COLORS.CRYSTAL
        : this.collectibleType === "shard"
        ? COLORS.SHARD
        : COLORS.HEALTH_PICKUP;
    this.glowGraphic.fillStyle(color, 0.35);
    this.glowGraphic.fillCircle(this.x, this.y, 16);
  }

  update() {
    this.updateGlow();
  }

  collect() {
    this.bobTween?.stop();
    this.glowGraphic?.destroy();

    if (this.collectibleType === "crystal") soundManager.crystalCollect();
    else if (this.collectibleType === "shard") soundManager.shardCollect();
    else soundManager.healthCollect();

    // Sparkle burst
    try {
      const tint =
        this.collectibleType === "crystal"
          ? COLORS.CRYSTAL
          : this.collectibleType === "shard"
          ? COLORS.SHARD
          : COLORS.HEALTH_PICKUP;

      const emitter = this.scene.add.particles(this.x, this.y, "particle", {
        speed: { min: 60, max: 180 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 500,
        quantity: 14,
        tint,
      });
      this.scene.time.delayedCall(600, () => emitter.destroy());
    } catch {}

    // Score popup
    const label = this.collectibleType === "crystal" ? "+100" : this.collectibleType === "shard" ? "+50" : "♥";
    const popup = this.scene.add
      .text(this.x, this.y - 10, label, {
        fontSize: "18px",
        fontFamily: "monospace",
        color: this.collectibleType === "health" ? "#ff4466" : "#ffd700",
        stroke: "#000",
        strokeThickness: 3,
      })
      .setDepth(50);

    this.scene.tweens.add({
      targets: popup,
      y: popup.y - 40,
      alpha: 0,
      duration: 800,
      ease: "Power2",
      onComplete: () => popup.destroy(),
    });

    this.destroy();
  }

  destroy(fromScene?: boolean) {
    this.glowGraphic?.destroy();
    this.bobTween?.stop();
    super.destroy(fromScene);
  }
}
