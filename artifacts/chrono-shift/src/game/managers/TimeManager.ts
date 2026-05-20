import Phaser from "phaser";
import {
  TIME_SLOW_DURATION,
  TIME_SLOW_COOLDOWN,
  TIME_SLOW_SCALE,
  TIME_REWIND_DURATION,
  TIME_REWIND_COOLDOWN,
  TIME_REWIND_HISTORY,
} from "../constants";

interface TrackedObject {
  sprite: Phaser.Physics.Arcade.Sprite;
  history: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
  }>;
}

export class TimeManager {
  private scene: Phaser.Scene;
  private trackedObjects: TrackedObject[] = [];

  // Time Slow
  slowActive = false;
  slowReady = true;
  slowCooldownRemaining = 0;
  slowTimeRemaining = 0;
  private slowTimer: Phaser.Time.TimerEvent | null = null;
  private slowCooldownTimer: Phaser.Time.TimerEvent | null = null;

  // Time Rewind
  rewindActive = false;
  rewindReady = true;
  rewindCooldownRemaining = 0;
  private rewindTimer: Phaser.Time.TimerEvent | null = null;
  private rewindCooldownTimer: Phaser.Time.TimerEvent | null = null;
  private rewindPlaybackIndex = 0;
  private rewindSnapshots: Array<Array<{ x: number; y: number; vx: number; vy: number }>> = [];
  private rewindTick: Phaser.Time.TimerEvent | null = null;

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

  register(sprite: Phaser.Physics.Arcade.Sprite) {
    this.trackedObjects.push({ sprite, history: [] });
  }

  unregister(sprite: Phaser.Physics.Arcade.Sprite) {
    this.trackedObjects = this.trackedObjects.filter((t) => t.sprite !== sprite);
  }

  update(_delta: number) {
    if (this.rewindActive) return;

    // Record history for all tracked objects
    for (const tracked of this.trackedObjects) {
      if (!tracked.sprite.active) continue;
      tracked.history.push({
        x: tracked.sprite.x,
        y: tracked.sprite.y,
        vx: tracked.sprite.body ? (tracked.sprite.body as Phaser.Physics.Arcade.Body).velocity.x : 0,
        vy: tracked.sprite.body ? (tracked.sprite.body as Phaser.Physics.Arcade.Body).velocity.y : 0,
      });
      if (tracked.history.length > TIME_REWIND_HISTORY) {
        tracked.history.shift();
      }
    }

    // Update cooldown displays
    if (!this.slowReady && this.slowTimer) {
      this.slowCooldownRemaining = this.slowTimer.getRemaining();
    }
    if (!this.rewindReady && this.rewindCooldownTimer) {
      this.rewindCooldownRemaining = this.rewindCooldownTimer.getRemaining();
    }
    if (this.slowActive && this.slowTimer) {
      this.slowTimeRemaining = this.slowTimer.getRemaining();
    }
  }

  activateTimeSlow() {
    if (!this.slowReady || this.rewindActive) return;

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

  activateTimeRewind() {
    if (!this.rewindReady || this.rewindActive) return;
    if (this.slowActive) this.deactivateTimeSlow();

    if (this.trackedObjects.every((t) => t.history.length === 0)) return;

    this.rewindActive = true;
    this.rewindReady = false;

    // Build snapshot array (copy of all histories at activation moment)
    this.rewindSnapshots = this.trackedObjects.map((t) => [...t.history].reverse());
    this.rewindPlaybackIndex = 0;

    // Flash camera
    this.scene.cameras.main.flash(200, 0, 180, 255);

    // Show ghost trails
    const maxFrames = Math.max(...this.rewindSnapshots.map((s) => s.length));
    const framesPerTick = 1;
    let tick = 0;

    this.rewindTick = this.scene.time.addEvent({
      delay: 16,
      repeat: maxFrames - 1,
      callback: () => {
        for (let i = 0; i < this.trackedObjects.length; i++) {
          const tracked = this.trackedObjects[i];
          const snaps = this.rewindSnapshots[i];
          const idx = Math.min(tick * framesPerTick, snaps.length - 1);
          const snap = snaps[idx];
          if (snap && tracked.sprite.active) {
            // Leave ghost at current position
            try {
              const ghost = this.scene.add.image(tracked.sprite.x, tracked.sprite.y, "ghost_particle");
              ghost.setAlpha(0.4);
              ghost.setDepth(5);
              this.scene.time.delayedCall(300, () => ghost.destroy());
            } catch {}

            tracked.sprite.setPosition(snap.x, snap.y);
            if (tracked.sprite.body) {
              const body = tracked.sprite.body as Phaser.Physics.Arcade.Body;
              body.reset(snap.x, snap.y);
            }
          }
        }
        tick++;
      },
    });

    const rewindDuration = Math.min(TIME_REWIND_DURATION, maxFrames * 16);
    this.rewindTimer = this.scene.time.delayedCall(rewindDuration, () => {
      this.deactivateTimeRewind();
    });
  }

  private deactivateTimeRewind() {
    this.rewindActive = false;
    this.rewindTick?.destroy();
    this.rewindTick = null;
    this.rewindTimer = null;

    // Restore velocities from the oldest snapshot frame
    for (let i = 0; i < this.trackedObjects.length; i++) {
      const tracked = this.trackedObjects[i];
      const snaps = this.rewindSnapshots[i];
      if (snaps && snaps.length > 0 && tracked.sprite.active && tracked.sprite.body) {
        const last = snaps[snaps.length - 1];
        const body = tracked.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(last.vx, last.vy);
      }
      tracked.history = [];
    }

    this.scene.cameras.main.flash(150, 0, 255, 200);

    this.rewindCooldownRemaining = TIME_REWIND_COOLDOWN;
    this.rewindCooldownTimer = this.scene.time.delayedCall(TIME_REWIND_COOLDOWN, () => {
      this.rewindReady = true;
      this.rewindCooldownRemaining = 0;
      this.rewindCooldownTimer = null;
    });
  }

  getSlowMultiplier(): number {
    return this.slowActive ? TIME_SLOW_SCALE : 1.0;
  }

  destroy() {
    this.slowTimer?.destroy();
    this.slowCooldownTimer?.destroy();
    this.rewindTimer?.destroy();
    this.rewindTick?.destroy();
    this.rewindCooldownTimer?.destroy();
    this.slowOverlay?.destroy();
    this.slowParticles?.destroy();
  }
}
