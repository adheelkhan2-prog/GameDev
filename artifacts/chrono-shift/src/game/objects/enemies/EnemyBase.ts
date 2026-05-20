import Phaser from "phaser";
import { TimeManager } from "../../managers/TimeManager";

export abstract class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  protected timeManager: TimeManager;
  protected baseSpeed: number;
  active = true;

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
    return this.baseSpeed * this.timeManager.getSlowMultiplier();
  }

  hitByRewind() {}
}
