import Phaser from "phaser";

const GHOST_KEY_PREFIX = "chrono_ghost_";
const MAX_FRAMES = 3600;
const RECORD_EVERY = 3;

interface GhostFrame {
  x: number;
  y: number;
  flipX: boolean;
}

export class GhostReplayManager {
  private scene: Phaser.Scene;
  private levelKey: string;

  private recording: GhostFrame[] = [];
  private frameCounter = 0;

  private ghostGfx: Phaser.GameObjects.Graphics | null = null;
  private playbackFrames: GhostFrame[] = [];
  private playbackIdx = 0;
  private playbackTickCounter = 0;
  private playing = false;

  constructor(scene: Phaser.Scene, levelNumber: number) {
    this.scene = scene;
    this.levelKey = GHOST_KEY_PREFIX + levelNumber;
    this.loadAndBeginPlayback();
  }

  private loadAndBeginPlayback() {
    try {
      const raw = localStorage.getItem(this.levelKey);
      if (!raw) return;
      const frames: GhostFrame[] = JSON.parse(raw);
      if (!frames || frames.length < 20) return;
      this.playbackFrames = frames;
      this.playing = true;
      this.playbackIdx = 0;
      this.ghostGfx = this.scene.add.graphics();
      this.ghostGfx.setDepth(18);
    } catch {}
  }

  private renderGhost(x: number, y: number, flipX: boolean) {
    if (!this.ghostGfx) return;
    this.ghostGfx.clear();
    this.ghostGfx.fillStyle(0x00ffff, 0.14);
    const ox = flipX ? -6 : -14;
    this.ghostGfx.fillRect(x + ox, y - 22, 20, 36);
    this.ghostGfx.fillRect(x - 16, y + 14, 12, 8);
    this.ghostGfx.fillRect(x + 4, y + 14, 12, 8);
    this.ghostGfx.lineStyle(1, 0x00ffff, 0.22);
    this.ghostGfx.strokeRect(x + ox, y - 22, 20, 36);
  }

  recordFrame(player: Phaser.Physics.Arcade.Sprite) {
    if (this.frameCounter % RECORD_EVERY === 0 && this.recording.length < MAX_FRAMES) {
      this.recording.push({ x: player.x, y: player.y, flipX: player.flipX });
    }
    this.frameCounter++;
  }

  updatePlayback() {
    if (!this.playing || !this.ghostGfx || this.playbackFrames.length === 0) return;
    const frame = this.playbackFrames[this.playbackIdx];
    if (frame) this.renderGhost(frame.x, frame.y, frame.flipX);
    this.playbackTickCounter++;
    if (this.playbackTickCounter >= RECORD_EVERY) {
      this.playbackTickCounter = 0;
      this.playbackIdx++;
      if (this.playbackIdx >= this.playbackFrames.length) {
        this.playing = false;
        this.ghostGfx?.clear();
        this.ghostGfx?.destroy();
        this.ghostGfx = null;
      }
    }
  }

  saveRecording() {
    if (this.recording.length < 20) return;
    try {
      localStorage.setItem(this.levelKey, JSON.stringify(this.recording));
    } catch {}
  }

  destroy() {
    this.saveRecording();
    this.ghostGfx?.destroy();
  }
}
