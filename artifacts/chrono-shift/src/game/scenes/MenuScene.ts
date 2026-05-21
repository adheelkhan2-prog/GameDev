import Phaser from "phaser";
import { getScores, clearScores, formatTime, type LeaderboardEntry } from "../utils/leaderboard";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Background gradient effect
    this.add.rectangle(W / 2, H / 2, W, H, 0x000f1f);

    // Stars
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const s = this.add.image(x, y, "star").setAlpha(Phaser.Math.FloatBetween(0.3, 1));
      this.tweens.add({
        targets: s,
        alpha: Phaser.Math.FloatBetween(0.1, 0.3),
        duration: Phaser.Math.Between(500, 2000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    // Decorative grid
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x112233, 0.3);
    for (let y = 0; y < H; y += 60) grid.lineBetween(0, y, W, y);
    for (let x = 0; x < W; x += 80) grid.lineBetween(x, 0, x, H);

    // Title glow
    const titleGlow = this.add.graphics();
    titleGlow.fillStyle(0x00ffff, 0.06);
    titleGlow.fillEllipse(W / 2, 130, 600, 120);
    this.tweens.add({
      targets: titleGlow,
      alpha: { from: 0.5, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    // Title
    const title = this.add
      .text(W / 2, 110, "CHRONO SHIFT", {
        fontSize: "78px",
        fontFamily: "monospace",
        color: "#00ffff",
        stroke: "#004488",
        strokeThickness: 5,
        shadow: { offsetX: 0, offsetY: 0, color: "#0088ff", blur: 20, fill: true },
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.tweens.add({
      targets: title,
      scaleX: { from: 1, to: 1.02 },
      scaleY: { from: 1, to: 1.02 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Subtitle
    this.add
      .text(W / 2, 180, "A TIME MANIPULATION PUZZLE PLATFORMER", {
        fontSize: "18px",
        fontFamily: "monospace",
        color: "#ffee44",
        stroke: "#443300",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Decorative line
    const line = this.add.graphics();
    line.lineStyle(2, 0x00ffff, 0.4);
    line.lineBetween(W / 2 - 300, 205, W / 2 + 300, 205);
    line.setDepth(10);

    // Player preview art
    this.createPlayerPreview(W / 2, 290);

    // Buttons
    this.createButton(W / 2, 390, "▶  PLAY GAME", "#00ff88", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("Level1Scene"));
    });

    this.createButton(W / 2, 450, "★  HIGH SCORES", "#ffd700", () => {
      this.showLeaderboard();
    });

    this.createButton(W / 2, 515, "?  HOW TO PLAY", "#44aaff", () => {
      this.showInstructions();
    });

    this.createButton(W / 2, 580, "✦  CREDITS", "#ffaa44", () => {
      this.showCredits();
    });

    // Footer
    this.add
      .text(W / 2, H - 30, "DUT PBDV301 — Game Development Project  |  CHRONO SHIFT © 2026", {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#334455",
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Control hint
    this.add
      .text(W / 2, H - 60, "Arrow Keys / WASD to move  •  SPACE to jump  •  E = Time Slow  •  R = Time Rewind", {
        fontSize: "13px",
        fontFamily: "monospace",
        color: "#446677",
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private createPlayerPreview(x: number, y: number) {
    // Mini animated player showcase
    const container = this.add.container(x, y);

    const body = this.add.graphics();
    body.fillStyle(0x00ffff, 1);
    body.fillRect(-14, -22, 20, 36);
    body.fillRect(-16, 14, 12, 8);
    body.fillRect(4, 14, 12, 8);
    body.fillStyle(0x0088ff, 0.7);
    body.fillRect(-10, -18, 12, 14);
    container.add(body);

    const glow = this.add.graphics();
    glow.fillStyle(0x0088ff, 0.25);
    glow.fillCircle(0, 0, 28);
    container.add(glow);
    container.sendToBack(glow);

    this.tweens.add({
      targets: container,
      y: y - 8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 0.9 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  private createButton(x: number, y: number, label: string, color: string, cb: () => void) {
    const bg = this.add.graphics();
    bg.fillStyle(0x001122, 0.85);
    bg.fillRoundedRect(x - 170, y - 22, 340, 44, 8);
    bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.7);
    bg.strokeRoundedRect(x - 170, y - 22, 340, 44, 8);
    bg.setDepth(9);

    const text = this.add
      .text(x, y, label, {
        fontSize: "24px",
        fontFamily: "monospace",
        color,
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });

    text.on("pointerover", () => {
      text.setScale(1.08);
      bg.clear();
      bg.fillStyle(0x002244, 0.95);
      bg.fillRoundedRect(x - 170, y - 22, 340, 44, 8);
      bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 1);
      bg.strokeRoundedRect(x - 170, y - 22, 340, 44, 8);
      this.cameras.main.shake(30, 0.001);
    });

    text.on("pointerout", () => {
      text.setScale(1);
      bg.clear();
      bg.fillStyle(0x001122, 0.85);
      bg.fillRoundedRect(x - 170, y - 22, 340, 44, 8);
      bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(color).color, 0.7);
      bg.strokeRoundedRect(x - 170, y - 22, 340, 44, 8);
    });

    text.on("pointerdown", cb);
    return text;
  }

  private showLeaderboard() {
    const W = this.scale.width;
    const H = this.scale.height;

    const scores = getScores();

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88).setDepth(50).setInteractive();
    const panel = this.add.graphics();
    const panelW = 700;
    const panelH = 560;
    const px = W / 2 - panelW / 2;
    const py = H / 2 - panelH / 2;
    panel.fillStyle(0x0a0f1a, 0.98);
    panel.fillRoundedRect(px, py, panelW, panelH, 16);
    panel.lineStyle(2, 0xffd700, 0.7);
    panel.strokeRoundedRect(px, py, panelW, panelH, 16);
    panel.setDepth(51);

    const allObjs: Phaser.GameObjects.GameObject[] = [overlay, panel];

    const addText = (x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle) => {
      const t = this.add.text(x, y, text, style).setDepth(52);
      allObjs.push(t);
      return t;
    };

    addText(W / 2, py + 36, "HIGH SCORES", {
      fontSize: "32px", fontFamily: "monospace", color: "#ffd700",
      stroke: "#553300", strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, color: "#ffaa00", blur: 12, fill: true },
    }).setOrigin(0.5);

    // Column headers
    const headerY = py + 86;
    addText(px + 56, headerY, "#", { fontSize: "14px", fontFamily: "monospace", color: "#556677" }).setOrigin(0.5);
    addText(px + 180, headerY, "SCORE", { fontSize: "14px", fontFamily: "monospace", color: "#556677" }).setOrigin(0.5);
    addText(px + 320, headerY, "TIME", { fontSize: "14px", fontFamily: "monospace", color: "#556677" }).setOrigin(0.5);
    addText(px + 480, headerY, "RANK", { fontSize: "14px", fontFamily: "monospace", color: "#556677" }).setOrigin(0.5);
    addText(px + 630, headerY, "DATE", { fontSize: "14px", fontFamily: "monospace", color: "#556677" }).setOrigin(0.5);

    // Divider
    const div = this.add.graphics().setDepth(52);
    div.lineStyle(1, 0xffd700, 0.25);
    div.lineBetween(px + 20, headerY + 18, px + panelW - 20, headerY + 18);
    allObjs.push(div);

    if (scores.length === 0) {
      addText(W / 2, H / 2 + 20, "No scores yet — complete the game to appear here!", {
        fontSize: "16px", fontFamily: "monospace", color: "#445566",
      }).setOrigin(0.5);
    } else {
      const rankColors: Record<string, string> = {
        "TEMPORAL MASTER": "#ffd700",
        "TIME SHIFTER": "#00ffff",
        "CHRONO ADEPT": "#88ff88",
        "CHRONO NOVICE": "#778899",
      };
      const rowColors = ["#ffd700", "#aaaacc", "#cc8844"];

      scores.forEach((entry: LeaderboardEntry, i: number) => {
        const rowY = headerY + 32 + i * 42;
        const numColor = i < 3 ? rowColors[i] : "#445566";
        const scoreColor = i === 0 ? "#ffee44" : "#aaccee";

        // Row highlight for top 3
        if (i < 3) {
          const rowBg = this.add.graphics().setDepth(51);
          rowBg.fillStyle(i === 0 ? 0x221a00 : 0x0d0d22, 0.5);
          rowBg.fillRoundedRect(px + 14, rowY - 14, panelW - 28, 34, 6);
          allObjs.push(rowBg);
        }

        addText(px + 56, rowY, `${i + 1}`, { fontSize: "18px", fontFamily: "monospace", color: numColor }).setOrigin(0.5);
        addText(px + 180, rowY, `${entry.score}`, { fontSize: "18px", fontFamily: "monospace", color: scoreColor }).setOrigin(0.5);
        addText(px + 320, rowY, formatTime(entry.timeMs), { fontSize: "18px", fontFamily: "monospace", color: "#aaccff" }).setOrigin(0.5);
        addText(px + 480, rowY, entry.rank, { fontSize: "13px", fontFamily: "monospace", color: rankColors[entry.rank] ?? "#aaaaaa" }).setOrigin(0.5);
        addText(px + 630, rowY, entry.date, { fontSize: "13px", fontFamily: "monospace", color: "#445566" }).setOrigin(0.5);
      });
    }

    // Clear button
    const clearBg = this.add.graphics().setDepth(52);
    const clearY = py + panelH - 50;
    clearBg.fillStyle(0x110000, 0.8);
    clearBg.fillRoundedRect(W / 2 - 80, clearY - 16, 160, 32, 6);
    clearBg.lineStyle(1, 0x882222, 0.6);
    clearBg.strokeRoundedRect(W / 2 - 80, clearY - 16, 160, 32, 6);
    allObjs.push(clearBg);

    const clearBtn = addText(W / 2, clearY, "CLEAR SCORES", {
      fontSize: "14px", fontFamily: "monospace", color: "#883333",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    clearBtn.on("pointerover", () => clearBtn.setColor("#ff4444"));
    clearBtn.on("pointerout", () => clearBtn.setColor("#883333"));
    clearBtn.on("pointerdown", () => {
      clearScores();
      allObjs.forEach((o) => o.destroy());
      this.showLeaderboard();
    });

    addText(W / 2, py + panelH - 16, "Click anywhere outside to close", {
      fontSize: "12px", fontFamily: "monospace", color: "#334455",
    }).setOrigin(0.5);

    overlay.on("pointerdown", () => allObjs.forEach((o) => o.destroy()));
  }

  private showInstructions() {
    const W = this.scale.width;
    const H = this.scale.height;

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(50).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x001a33, 0.97);
    panel.fillRoundedRect(W / 2 - 360, H / 2 - 270, 720, 540, 16);
    panel.lineStyle(2, 0x00ffff, 0.6);
    panel.strokeRoundedRect(W / 2 - 360, H / 2 - 270, 720, 540, 16);
    panel.setDepth(51);

    const lines = [
      { text: "HOW TO PLAY", color: "#00ffff", size: "28px", y: -220 },
      { text: "─────────────────────────────────", color: "#224455", size: "16px", y: -185 },
      { text: "MOVEMENT", color: "#ffee44", size: "20px", y: -155 },
      { text: "← → / A D  —  Move left/right", color: "#aaccee", size: "16px", y: -130 },
      { text: "SPACE / W  —  Jump", color: "#aaccee", size: "16px", y: -108 },
      { text: "─────────────────────────────────", color: "#224455", size: "16px", y: -80 },
      { text: "TIME ABILITIES", color: "#ffee44", size: "20px", y: -55 },
      { text: "E  —  Time Slow (5s active, 3s cooldown)", color: "#66aaff", size: "16px", y: -28 },
      { text: "      Enemies slow to 20% speed. You move normally.", color: "#557799", size: "14px", y: -8 },
      { text: "R  —  Time Rewind (rewinds enemies 2s)", color: "#ff88aa", size: "16px", y: 18 },
      { text: "      Sends enemies back in time. Cooldown 4s.", color: "#775566", size: "14px", y: 38 },
      { text: "─────────────────────────────────", color: "#224455", size: "16px", y: 66 },
      { text: "OBJECTIVE", color: "#ffee44", size: "20px", y: 92 },
      { text: "Collect all 5 golden crystals in each level,", color: "#aaccee", size: "16px", y: 118 },
      { text: "then reach the glowing EXIT portal.", color: "#aaccee", size: "16px", y: 140 },
      { text: "─────────────────────────────────", color: "#224455", size: "16px", y: 168 },
      { text: "Click anywhere to close", color: "#446688", size: "14px", y: 208 },
    ];

    const textObjs: Phaser.GameObjects.Text[] = [];
    for (const l of lines) {
      const t = this.add
        .text(W / 2, H / 2 + l.y, l.text, {
          fontSize: l.size,
          fontFamily: "monospace",
          color: l.color,
        })
        .setOrigin(0.5)
        .setDepth(52);
      textObjs.push(t);
    }

    const close = () => {
      overlay.destroy();
      panel.destroy();
      textObjs.forEach((t) => t.destroy());
    };

    overlay.on("pointerdown", close);
  }

  private showCredits() {
    const W = this.scale.width;
    const H = this.scale.height;

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85).setDepth(50).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0x001a33, 0.97);
    panel.fillRoundedRect(W / 2 - 280, H / 2 - 200, 560, 400, 16);
    panel.lineStyle(2, 0xffaa44, 0.6);
    panel.strokeRoundedRect(W / 2 - 280, H / 2 - 200, 560, 400, 16);
    panel.setDepth(51);

    const lines = [
      { text: "CREDITS", color: "#ffaa44", size: "28px", y: -170 },
      { text: "─────────────────────────────────", color: "#443322", size: "16px", y: -138 },
      { text: "CHRONO SHIFT", color: "#00ffff", size: "20px", y: -108 },
      { text: "DUT PBDV301 — Game Development", color: "#aaccee", size: "16px", y: -82 },
      { text: "University Project, 2026", color: "#557799", size: "14px", y: -58 },
      { text: "─────────────────────────────────", color: "#443322", size: "16px", y: -34 },
      { text: "Built With", color: "#ffee44", size: "18px", y: -8 },
      { text: "Phaser 3 — Game Framework", color: "#aaccee", size: "15px", y: 20 },
      { text: "TypeScript — Language", color: "#aaccee", size: "15px", y: 42 },
      { text: "React + Vite — Web Integration", color: "#aaccee", size: "15px", y: 64 },
      { text: "─────────────────────────────────", color: "#443322", size: "16px", y: 90 },
      { text: "All assets procedurally generated", color: "#557799", size: "13px", y: 114 },
      { text: "Click anywhere to close", color: "#446688", size: "14px", y: 158 },
    ];

    const textObjs: Phaser.GameObjects.Text[] = [];
    for (const l of lines) {
      const t = this.add
        .text(W / 2, H / 2 + l.y, l.text, {
          fontSize: l.size,
          fontFamily: "monospace",
          color: l.color,
        })
        .setOrigin(0.5)
        .setDepth(52);
      textObjs.push(t);
    }

    overlay.on("pointerdown", () => {
      overlay.destroy();
      panel.destroy();
      textObjs.forEach((t) => t.destroy());
    });
  }
}
