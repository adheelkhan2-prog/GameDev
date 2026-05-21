import Phaser from "phaser";
import { saveScore, formatTime } from "../utils/leaderboard";

interface VictoryData {
  score: number;
  timeMs: number;
}

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super("VictoryScene");
  }

  create(data: VictoryData) {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000f1f);

    // Victory stars (lots)
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const s = this.add.image(x, y, "star").setAlpha(Phaser.Math.FloatBetween(0.1, 0.9));
      this.tweens.add({
        targets: s,
        alpha: Phaser.Math.FloatBetween(0.05, 0.2),
        duration: Phaser.Math.Between(300, 1500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1000),
      });
    }

    // Golden glow
    const glow = this.add.graphics();
    glow.fillStyle(0xffd700, 0.07);
    glow.fillEllipse(W / 2, H / 2, 900, 500);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 1 },
      scaleX: { from: 0.9, to: 1.1 },
      scaleY: { from: 0.9, to: 1.1 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
    });

    // Particle celebration
    try {
      const confetti = this.add.particles(W / 2, H / 4, "particle", {
        speed: { min: 100, max: 400 },
        angle: { min: 0, max: 360 },
        scale: { start: 1.2, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 800, max: 1600 },
        quantity: 3,
        frequency: 80,
        tint: [0xffd700, 0x00ffff, 0xff00ff, 0x00ff88, 0xffaa00],
        emitZone: { type: "random" as "random", source: new Phaser.Geom.Rectangle(-W / 2, 0, W, 50) } as unknown as Phaser.Types.GameObjects.Particles.ParticleEmitterEdgeZoneConfig,
      });
      confetti.setDepth(30);
    } catch {}

    // Title
    const title = this.add
      .text(W / 2, H / 2 - 200, "TIMELINE RESTORED!", {
        fontSize: "68px",
        fontFamily: "monospace",
        color: "#ffd700",
        stroke: "#554400",
        strokeThickness: 5,
        shadow: { offsetX: 0, offsetY: 0, color: "#ffaa00", blur: 24, fill: true },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 800, ease: "Power2" });

    this.add
      .text(W / 2, H / 2 - 125, "CONGRATULATIONS — YOU SHIFTED TIME AND SAVED REALITY!", {
        fontSize: "18px",
        fontFamily: "monospace",
        color: "#aaffcc",
      })
      .setOrigin(0.5);

    // Decorative lines
    const line = this.add.graphics();
    line.lineStyle(2, 0xffd700, 0.4);
    line.lineBetween(W / 2 - 340, H / 2 - 88, W / 2 + 340, H / 2 - 88);
    line.lineBetween(W / 2 - 340, H / 2 + 70, W / 2 + 340, H / 2 + 70);

    // Score
    const score = data?.score ?? 0;
    const timeMs = data?.timeMs ?? 0;

    // Save to leaderboard
    const { isNewBest, position } = saveScore(score, timeMs);

    this.add
      .text(W / 2, H / 2 - 55, "ALL LEVELS COMPLETE!", {
        fontSize: "28px",
        fontFamily: "monospace",
        color: "#00ffcc",
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, H / 2, `Total Score: ${score}`, {
        fontSize: "32px",
        fontFamily: "monospace",
        color: "#ffee44",
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, H / 2 + 44, `Total Time: ${formatTime(timeMs)}`, {
        fontSize: "24px",
        fontFamily: "monospace",
        color: "#aaccff",
      })
      .setOrigin(0.5);

    // Rank
    let rank = "CHRONO NOVICE";
    let rankColor = "#aaaaaa";
    if (score >= 2000) { rank = "TEMPORAL MASTER"; rankColor = "#ffd700"; }
    else if (score >= 1200) { rank = "TIME SHIFTER"; rankColor = "#00ffff"; }
    else if (score >= 600) { rank = "CHRONO ADEPT"; rankColor = "#88ff88"; }

    this.add
      .text(W / 2, H / 2 + 90, `★  ${rank}  ★`, {
        fontSize: "26px",
        fontFamily: "monospace",
        color: rankColor,
      })
      .setOrigin(0.5);

    // New best / leaderboard position badge
    if (isNewBest) {
      const badge = this.add
        .text(W / 2, H / 2 + 128, "🏆  NEW BEST SCORE!", {
          fontSize: "20px",
          fontFamily: "monospace",
          color: "#ffd700",
          stroke: "#553300",
          strokeThickness: 3,
          shadow: { offsetX: 0, offsetY: 0, color: "#ffaa00", blur: 14, fill: true },
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: badge,
        scaleX: { from: 1, to: 1.06 },
        scaleY: { from: 1, to: 1.06 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else {
      this.add
        .text(W / 2, H / 2 + 128, `Leaderboard position: #${position}`, {
          fontSize: "16px",
          fontFamily: "monospace",
          color: "#667788",
        })
        .setOrigin(0.5);
    }

    // Buttons
    this.createButton(W / 2, H / 2 + 175, "▶  PLAY AGAIN", "#00ff88", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("Level1Scene"));
    });

    this.createButton(W / 2, H / 2 + 235, "⌂  MAIN MENU", "#aaaaff", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("MenuScene"));
    });

    this.cameras.main.fadeIn(600, 0, 0, 0);
  }

  private createButton(x: number, y: number, label: string, color: string, cb: () => void) {
    const bg = this.add.graphics();
    bg.fillStyle(0x001a11, 0.85);
    bg.fillRoundedRect(x - 160, y - 22, 320, 44, 8);
    bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.7);
    bg.strokeRoundedRect(x - 160, y - 22, 320, 44, 8);

    const text = this.add
      .text(x, y, label, {
        fontSize: "24px",
        fontFamily: "monospace",
        color,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    text.on("pointerover", () => {
      text.setScale(1.08);
      bg.clear();
      bg.fillStyle(0x002211, 0.95);
      bg.fillRoundedRect(x - 160, y - 22, 320, 44, 8);
      bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
      bg.strokeRoundedRect(x - 160, y - 22, 320, 44, 8);
    });
    text.on("pointerout", () => {
      text.setScale(1);
      bg.clear();
      bg.fillStyle(0x001a11, 0.85);
      bg.fillRoundedRect(x - 160, y - 22, 320, 44, 8);
      bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.7);
      bg.strokeRoundedRect(x - 160, y - 22, 320, 44, 8);
    });
    text.on("pointerdown", cb);
  }
}
