import Phaser from "phaser";
import { GameScene, PlatformDef, EnemyDef, CollectibleDef, SpikeDef, VortexDef } from "./GameScene";
import { soundManager } from "../managers/SoundManager";
import { saveScore } from "../utils/leaderboard";
import { COLORS, BOSS_MAX_HP } from "../constants";

export class BossScene extends GameScene {
  protected levelNumber = 6;
  protected worldWidth = 1600;
  protected worldHeight = 720;
  protected spawnX = 180;
  protected spawnY = 560;
  protected exitX = 1420;
  protected exitY = 560;
  protected nextScene = "VictoryScene";
  protected totalCrystals = 0;
  protected requiresBossDefeat = true;
  protected bgColor = 0x0a0000;
  protected defaultTileKey = "platform";

  private arenaGfx: Phaser.GameObjects.Graphics | null = null;
  private bossHudBg: Phaser.GameObjects.Rectangle | null = null;
  private bossHudFill: Phaser.GameObjects.Graphics | null = null;
  private bossHudText: Phaser.GameObjects.Text | null = null;
  private bossHudPhase: Phaser.GameObjects.Text | null = null;

  constructor() {
    super("BossScene");
  }

  create() {
    super.create();
    this.drawArenaDeco();
    soundManager.stopAmbientMusic();
    this.showBossIntro();
    this.buildBossHud();
  }

  update(time: number, delta: number) {
    super.update(time, delta);
    this.refreshBossHud();
  }

  private buildBossHud() {
    const W = this.scale.width;

    // Background bar
    this.bossHudBg = this.add.rectangle(W / 2, 54, 420, 22, 0x220000, 0.9)
      .setScrollFactor(0).setDepth(200).setOrigin(0.5);
    this.add.rectangle(W / 2, 54, 424, 26, 0xff2200, 0.5)
      .setScrollFactor(0).setDepth(199).setOrigin(0.5);

    // Fill bar
    this.bossHudFill = this.add.graphics().setScrollFactor(0).setDepth(201);

    // Name label
    this.bossHudText = this.add.text(W / 2, 36, "TEMPORAL GUARDIAN", {
      fontSize: "13px", fontFamily: "monospace",
      color: "#ff6644", stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(202);

    // Phase label
    this.bossHudPhase = this.add.text(W / 2 + 220, 54, "PHASE I", {
      fontSize: "11px", fontFamily: "monospace", color: "#ffaa88",
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(202);
  }

  private refreshBossHud() {
    if (!this.bossHudFill || !this.boss) return;
    const W = this.scale.width;
    const hp = Math.max(0, this.boss.hp);
    const pct = hp / BOSS_MAX_HP;
    const barW = 420;
    const fillW = Math.round(barW * pct);
    const fillColor = pct > 0.6 ? 0xff4400 : pct > 0.3 ? 0xff8800 : 0xff0044;

    this.bossHudFill.clear();
    if (fillW > 0) {
      this.bossHudFill.fillStyle(fillColor, 1);
      this.bossHudFill.fillRect(W / 2 - barW / 2, 43, fillW, 22);
    }

    // HP number
    this.bossHudText?.setText(`TEMPORAL GUARDIAN  ${hp} / ${BOSS_MAX_HP}`);

    // Phase
    const phase = pct > 0.6 ? "PHASE I" : pct > 0.3 ? "PHASE II" : "PHASE III ⚡";
    this.bossHudPhase?.setText(phase);
  }

  private drawArenaDeco() {
    const W = this.worldWidth;
    const H = this.worldHeight;

    this.arenaGfx = this.add.graphics().setDepth(3);

    // Red atmospheric glow at top
    this.arenaGfx.fillStyle(0xff1100, 0.05);
    this.arenaGfx.fillRect(0, 0, W, 300);

    // Warning stripes on walls
    for (let y = 0; y < H; y += 60) {
      const col = (Math.floor(y / 60) % 2 === 0) ? 0x330000 : 0x110000;
      this.arenaGfx.fillStyle(col, 0.3);
      this.arenaGfx.fillRect(0, y, 40, 30);
      this.arenaGfx.fillRect(W - 40, y, 40, 30);
    }

    // "BOSS ARENA" text
    this.add.text(W / 2, 30, "⚠  BOSS CHAMBER  ⚠", {
      fontSize: "18px",
      fontFamily: "monospace",
      color: "#ff4400",
      stroke: "#000000",
      strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, color: "#ff2200", blur: 10, fill: true },
    }).setOrigin(0.5).setDepth(25);

    // Pulsing arena glow overlay
    const glowOverlay = this.add.graphics().setDepth(4);
    glowOverlay.fillStyle(0xff0000, 0.04);
    glowOverlay.fillRect(0, 0, W, H);

    this.tweens.add({
      targets: glowOverlay,
      alpha: { from: 0.3, to: 1 },
      duration: 900,
      yoyo: true,
      repeat: -1,
    });
  }

  private showBossIntro() {
    const W = this.scale.width;
    const H = this.scale.height;

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(100);

    const title = this.add.text(W / 2, H / 2 - 60, "WARNING", {
      fontSize: "64px",
      fontFamily: "monospace",
      color: "#ff0000",
      stroke: "#550000",
      strokeThickness: 5,
      shadow: { offsetX: 0, offsetY: 0, color: "#ff0000", blur: 24, fill: true },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);

    const sub = this.add.text(W / 2, H / 2 + 20, "TEMPORAL GUARDIAN DETECTED", {
      fontSize: "22px",
      fontFamily: "monospace",
      color: "#ffaa00",
      stroke: "#330000",
      strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);

    const hint = this.add.text(W / 2, H / 2 + 68, "STOMP to deal damage  •  [F] SHOOT the cyan WEAK POINT for ×3 damage!", {
      fontSize: "14px",
      fontFamily: "monospace",
      color: "#00ffcc",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 400, ease: "Power2" });
    this.time.delayedCall(300, () => {
      this.tweens.add({ targets: sub, alpha: 1, duration: 400 });
    });
    this.time.delayedCall(600, () => {
      this.tweens.add({ targets: hint, alpha: 1, duration: 400 });
    });

    this.tweens.add({
      targets: title,
      scaleX: { from: 1, to: 1.04 },
      scaleY: { from: 1, to: 1.04 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    this.time.delayedCall(2600, () => {
      this.tweens.add({
        targets: [overlay, title, sub, hint],
        alpha: 0,
        duration: 500,
        onComplete: () => {
          overlay.destroy();
          title.destroy();
          sub.destroy();
          hint.destroy();
        },
      });
    });
  }

  buildPlatforms(): PlatformDef[] {
    return [
      // Floor
      { x: 0,    y: 640, w: 1600, h: 80 },
      // Player side platforms
      { x: 60,   y: 500, w: 200,  h: 22 },
      { x: 60,   y: 360, w: 180,  h: 22 },
      { x: 280,  y: 280, w: 160,  h: 22 },
      // Mid platforms
      { x: 680,  y: 440, w: 240,  h: 22 },
      { x: 680,  y: 280, w: 200,  h: 22 },
      // Boss side platforms
      { x: 1160, y: 360, w: 180,  h: 22 },
      { x: 1350, y: 500, w: 200,  h: 22 },
      { x: 1100, y: 500, w: 180,  h: 22 },
    ];
  }

  buildEnemies(): EnemyDef[] {
    return [
      {
        type: "boss",
        x: 1100,
        y: 560,
        patrolMin: 120,
        patrolMax: 1480,
      },
    ];
  }

  buildCollectibles(): CollectibleDef[] {
    return [];
  }

  buildSpikes(): SpikeDef[] {
    return [
      { x: 420, y: 628, count: 5 },
      { x: 900, y: 628, count: 5 },
    ];
  }

  buildVortexes(): VortexDef[] {
    return [];
  }

  protected handleLevelComplete() {
    if (this.levelComplete) return;
    this.levelComplete = true;
    soundManager.bossDefeat();
    soundManager.stopAmbientMusic();
    this.ghostReplayManager?.destroy();
    this.ghostReplayManager = null;

    this.cameras.main.flash(800, 255, 200, 50);
    this.cameras.main.shake(400, 0.015);

    // Save score
    const elapsed = this.uiManager?.getElapsedTime() ?? 0;
    const totalTime = this.cumulativeTimeMs + elapsed;
    saveScore(this.player?.score ?? 0, totalTime, 5);

    this.time.delayedCall(1000, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.time.delayedCall(620, () => {
        this.scene.start("VictoryScene", {
          score: this.player?.score ?? 0,
          timeMs: totalTime,
        });
      });
    });
  }
}
