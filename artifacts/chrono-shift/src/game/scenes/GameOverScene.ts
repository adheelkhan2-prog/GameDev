import Phaser from "phaser";

interface GameOverData {
  level: number;
  score: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(data: GameOverData) {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W / 2, H / 2, W, H, 0x050008);

    // Stars faint
    for (let i = 0; i < 80; i++) {
      this.add
        .image(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), "star")
        .setAlpha(Phaser.Math.FloatBetween(0.1, 0.4));
    }

    // Red glow
    const glow = this.add.graphics();
    glow.fillStyle(0xff0000, 0.06);
    glow.fillEllipse(W / 2, H / 2, 800, 400);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    // Game Over title
    const title = this.add
      .text(W / 2, H / 2 - 180, "GAME OVER", {
        fontSize: "80px",
        fontFamily: "monospace",
        color: "#ff3333",
        stroke: "#440000",
        strokeThickness: 6,
        shadow: { offsetX: 0, offsetY: 0, color: "#ff0000", blur: 20, fill: true },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 600 });

    this.add
      .text(W / 2, H / 2 - 100, "The timeline has fractured...", {
        fontSize: "22px",
        fontFamily: "monospace",
        color: "#aa4444",
      })
      .setOrigin(0.5);

    // Decorative line
    const line = this.add.graphics();
    line.lineStyle(2, 0xff3333, 0.4);
    line.lineBetween(W / 2 - 250, H / 2 - 60, W / 2 + 250, H / 2 - 60);

    // Stats
    this.add
      .text(W / 2, H / 2 - 20, `Level Reached: ${data?.level ?? 1}`, {
        fontSize: "24px",
        fontFamily: "monospace",
        color: "#ffaaaa",
      })
      .setOrigin(0.5);

    this.add
      .text(W / 2, H / 2 + 20, `Final Score: ${data?.score ?? 0}`, {
        fontSize: "24px",
        fontFamily: "monospace",
        color: "#ffcc88",
      })
      .setOrigin(0.5);

    // Buttons
    this.createButton(W / 2, H / 2 + 110, "↺  TRY AGAIN", "#ff6655", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        const levelScene = `Level${data?.level ?? 1}Scene`;
        this.scene.start(levelScene);
      });
    });

    this.createButton(W / 2, H / 2 + 180, "⌂  MAIN MENU", "#aaaaff", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("MenuScene"));
    });

    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private createButton(x: number, y: number, label: string, color: string, cb: () => void) {
    const bg = this.add.graphics();
    bg.fillStyle(0x110000, 0.85);
    bg.fillRoundedRect(x - 160, y - 22, 320, 44, 8);
    bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.6);
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
      bg.fillStyle(0x220000, 0.95);
      bg.fillRoundedRect(x - 160, y - 22, 320, 44, 8);
      bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
      bg.strokeRoundedRect(x - 160, y - 22, 320, 44, 8);
    });
    text.on("pointerout", () => {
      text.setScale(1);
      bg.clear();
      bg.fillStyle(0x110000, 0.85);
      bg.fillRoundedRect(x - 160, y - 22, 320, 44, 8);
      bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.6);
      bg.strokeRoundedRect(x - 160, y - 22, 320, 44, 8);
    });
    text.on("pointerdown", cb);
  }
}
