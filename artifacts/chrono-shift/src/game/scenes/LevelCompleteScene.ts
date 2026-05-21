import Phaser from "phaser";

interface LevelCompleteData {
  level: number;
  score: number;
  timeMs: number;
  cumulativeTimeMs: number;
  nextScene: string;
  crystals: number;
}

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super("LevelCompleteScene");
  }

  create(data: LevelCompleteData) {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000f1f);

    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      this.add.image(x, y, "star").setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
    }

    // Glow
    const glow = this.add.graphics();
    glow.fillStyle(0x00ffcc, 0.07);
    glow.fillEllipse(W / 2, H / 2, 700, 350);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Particles
    try {
      const burst = this.add.particles(W / 2, H / 3, "particle", {
        speed: { min: 80, max: 300 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1000,
        quantity: 2,
        frequency: 120,
        tint: [0x00ffcc, 0xffd700, 0x00ffff],
      });
      burst.setDepth(20);
    } catch {}

    // Title
    const title = this.add
      .text(W / 2, H / 2 - 190, `LEVEL ${data?.level ?? 1} COMPLETE!`, {
        fontSize: "60px",
        fontFamily: "monospace",
        color: "#00ffcc",
        stroke: "#004433",
        strokeThickness: 5,
        shadow: { offsetX: 0, offsetY: 0, color: "#00ffaa", blur: 18, fill: true },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 600 });

    // Decorative line
    const line = this.add.graphics();
    line.lineStyle(2, 0x00ffcc, 0.4);
    line.lineBetween(W / 2 - 280, H / 2 - 120, W / 2 + 280, H / 2 - 120);

    const fmtMs = (ms: number) => {
      const secs = Math.floor(ms / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const cumMs = data?.cumulativeTimeMs ?? data?.timeMs ?? 0;
    const isFirstLevel = (data?.level ?? 1) === 1;

    const statLines = [
      { label: "Score",      value: `${data?.score ?? 0}`,      color: "#ffee44" },
      { label: "Crystals",   value: `${data?.crystals ?? 0} / 5`, color: "#ffd700" },
      { label: "Level Time", value: fmtMs(data?.timeMs ?? 0),   color: "#aaccff" },
      ...(!isFirstLevel ? [{ label: "Total Time", value: fmtMs(cumMs), color: "#00ffcc" }] : []),
    ];

    statLines.forEach((stat, i) => {
      const y = H / 2 - 70 + i * 56;
      this.add.text(W / 2 - 160, y, stat.label, {
        fontSize: "22px",
        fontFamily: "monospace",
        color: "#667788",
      }).setOrigin(0, 0.5);

      this.add.text(W / 2 + 160, y, stat.value, {
        fontSize: "22px",
        fontFamily: "monospace",
        color: stat.color,
      }).setOrigin(1, 0.5);
    });

    const isLastLevel = data?.level === 3;

    this.createButton(
      W / 2,
      H / 2 + 120,
      isLastLevel ? "★  FINAL VICTORY" : `▶  LEVEL ${(data?.level ?? 1) + 1}`,
      "#00ff88",
      () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
          if (isLastLevel) {
            this.scene.start("VictoryScene", { score: data?.score, timeMs: cumMs });
          } else {
            this.scene.start(data?.nextScene ?? "Level2Scene", { score: data?.score, cumulativeTimeMs: cumMs });
          }
        });
      }
    );

    this.createButton(W / 2, H / 2 + 195, "⌂  MAIN MENU", "#aaaaff", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("MenuScene"));
    });

    // Auto-countdown (10 seconds)
    const countdownText = this.add
      .text(W / 2, H / 2 + 270, "Auto-continuing in 10...", {
        fontSize: "14px",
        fontFamily: "monospace",
        color: "#334455",
      })
      .setOrigin(0.5);

    let countdown = 10;
    const timer = this.time.addEvent({
      delay: 1000,
      repeat: 9,
      callback: () => {
        countdown--;
        if (countdown > 0) {
          countdownText.setText(`Auto-continuing in ${countdown}...`);
        } else {
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.time.delayedCall(300, () => {
            if (isLastLevel) {
              this.scene.start("VictoryScene", { score: data?.score, timeMs: cumMs });
            } else {
              this.scene.start(data?.nextScene ?? "Level2Scene", { score: data?.score, cumulativeTimeMs: cumMs });
            }
          });
        }
      },
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private createButton(x: number, y: number, label: string, color: string, cb: () => void) {
    const bg = this.add.graphics();
    bg.fillStyle(0x001a11, 0.85);
    bg.fillRoundedRect(x - 160, y - 22, 320, 44, 8);
    bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.7);
    bg.strokeRoundedRect(x - 160, y - 22, 320, 44, 8);

    const text = this.add
      .text(x, y, label, {
        fontSize: "22px",
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
