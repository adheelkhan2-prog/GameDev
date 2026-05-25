import Phaser from "phaser";
import { soundManager } from "./SoundManager";
import {
  TIME_SLOW_DURATION,
  TIME_SLOW_COOLDOWN,
  TIME_SLOW_SCALE,
} from "../constants";

export class TimeManager {
  private scene: Phaser.Scene;

  // Time Slow
  slowActive = false;
  slowReady = true;
  slowCooldownRemaining = 0;
  slowTimeRemaining = 0;
  private slowTimer: Phaser.Time.TimerEvent | null = null;
  private slowCooldownTimer: Phaser.Time.TimerEvent | null = null;

  // Overlay graphics
  private slowOverlay: Phaser.GameObjects.Rectangle | null = null;
  private slowParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createOverlays();
  }

  private createOverlays() {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    this.slowOverlay = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x0033cc, 0.25);
    this.slowOverlay.setDepth(80);
    this.slowOverlay.setVisible(false);
    this.slowOverlay.setScrollFactor(0);

    try {
      this.slowParticles = this.scene.add.particles(0, 0, "particle", {
        speed: { min: 10, max: 60 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 800,
        frequency: 80,
        tint: 0x4466ff,
        quantity: 2,
        emitZone: {
          type: "random" as "random",
          source: new Phaser.Geom.Rectangle(0, 0, W, H),
        } as unknown as Phaser.Types.GameObjects.Particles.ParticleEmitterEdgeZoneConfig,
      });
      this.slowParticles.setDepth(81);
      this.slowParticles.setScrollFactor(0);
      this.slowParticles.stop();
    } catch {
      // particles optional
    }
  }

  update(_delta: number) {
    // Update cooldown displays
    if (!this.slowReady && this.slowTimer) {
      this.slowCooldownRemaining = this.slowTimer.getRemaining();
    }
    if (this.slowActive && this.slowTimer) {
      this.slowTimeRemaining = this.slowTimer.getRemaining();
    }
  }

  activateTimeSlow() {
    if (!this.slowReady) return;
    soundManager.timeSlow();

    this.slowActive = true;
    this.slowReady = false;
    this.slowTimeRemaining = TIME_SLOW_DURATION;

    this.slowOverlay?.setVisible(true);
    this.slowParticles?.start();

    (this.scene.cameras.main as Phaser.Cameras.Scene2D.Camera & { setTint?: (c: number) => void }).setTint?.(0x4466cc);

    this.slowTimer = this.scene.time.delayedCall(TIME_SLOW_DURATION, () => {
      this.deactivateTimeSlow();
    });
  }

  deactivateTimeSlow() {
    if (!this.slowActive) return;
    soundManager.timeSlowEnd();
    this.slowActive = false;
    this.slowOverlay?.setVisible(false);
    this.slowParticles?.stop();
    (this.scene.cameras.main as Phaser.Cameras.Scene2D.Camera & { clearTint?: () => void }).clearTint?.();
    this.slowTimer = null;

    this.slowCooldownRemaining = TIME_SLOW_COOLDOWN;
    this.slowCooldownTimer = this.scene.time.delayedCall(TIME_SLOW_COOLDOWN, () => {
      this.slowReady = true;
      this.slowCooldownRemaining = 0;
      this.slowCooldownTimer = null;
    });
  }

  getSlowMultiplier(): number {
    return this.slowActive ? TIME_SLOW_SCALE : 1.0;
  }

  destroy() {
    this.slowTimer?.destroy();
    this.slowCooldownTimer?.destroy();
    this.slowOverlay?.destroy();
    this.slowParticles?.destroy();
  }
}
