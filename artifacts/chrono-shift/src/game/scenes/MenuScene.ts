import Phaser from "phaser";
import { getScores, clearScores, formatTime, type LeaderboardEntry } from "../utils/leaderboard";
import { getSettings, saveSettings } from "../utils/settings";
import { soundManager } from "../managers/SoundManager";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Apply persisted settings
    const saved = getSettings();
    soundManager.volume = saved.volume;
    soundManager.enabled = saved.soundEnabled;

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
    this.createButton(W / 2, 375, "▶  PLAY GAME", "#00ff88", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("Level1Scene"));
    });

    this.createButton(W / 2, 432, "★  HIGH SCORES", "#ffd700", () => {
      this.showLeaderboard();
    });

    this.createButton(W / 2, 489, "⚙  SETTINGS", "#cc88ff", () => {
      this.showSettings();
    });

    this.createButton(W / 2, 546, "?  HOW TO PLAY", "#44aaff", () => {
      this.showInstructions();
    });

    this.createButton(W / 2, 603, "✦  CREDITS", "#ffaa44", () => {
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

  private showSettings() {
    const W = this.scale.width;
    const H = this.scale.height;

    const panelW = 540;
    const panelH = 370;
    const px = W / 2 - panelW / 2;
    const py = H / 2 - panelH / 2;

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88)
      .setDepth(50).setInteractive();

    const panel = this.add.graphics().setDepth(51);
    const drawPanel = () => {
      panel.clear();
      panel.fillStyle(0x0a0a1e, 0.98);
      panel.fillRoundedRect(px, py, panelW, panelH, 16);
      panel.lineStyle(2, 0xcc88ff, 0.7);
      panel.strokeRoundedRect(px, py, panelW, panelH, 16);
    };
    drawPanel();

    const allObjs: Phaser.GameObjects.GameObject[] = [overlay, panel];
    const closeAll = () => allObjs.forEach((o) => { if (o.active) o.destroy(); });

    const addText = (x: number, y: number, txt: string, style: Phaser.Types.GameObjects.Text.TextStyle) => {
      const t = this.add.text(x, y, txt, style).setDepth(52);
      allObjs.push(t);
      return t;
    };

    // Title
    addText(W / 2, py + 34, "⚙  SETTINGS", {
      fontSize: "28px", fontFamily: "monospace", color: "#cc88ff",
      stroke: "#330066", strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, color: "#9944ff", blur: 10, fill: true },
    }).setOrigin(0.5);

    // ✕ Close (top-right)
    const xBg = this.add.graphics().setDepth(52);
    xBg.fillStyle(0x220033, 0.85);
    xBg.fillRoundedRect(px + panelW - 46, py + 10, 36, 30, 6);
    allObjs.push(xBg);
    const xBtn = addText(px + panelW - 28, py + 25, "✕", {
      fontSize: "20px", fontFamily: "monospace", color: "#885599",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    xBtn.on("pointerover", () => xBtn.setColor("#ff88ff"));
    xBtn.on("pointerout",  () => xBtn.setColor("#885599"));
    xBtn.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, e: Event) => { e.stopPropagation(); closeAll(); });

    // ── VOLUME ──────────────────────────────────────────────────────────
    addText(px + 32, py + 90, "VOLUME", {
      fontSize: "16px", fontFamily: "monospace", color: "#aaaacc",
    });

    const trackX = px + 140;
    const trackY = py + 97;
    const trackW = 240;
    const trackH = 14;

    // Redraw volume bar and percentage label
    const volBarBg = this.add.graphics().setDepth(52);
    const volBarFill = this.add.graphics().setDepth(53);
    allObjs.push(volBarBg, volBarFill);

    const pctLabel = addText(trackX + trackW + 18, trackY + trackH / 2, "38%", {
      fontSize: "14px", fontFamily: "monospace", color: "#cc88ff",
    }).setOrigin(0, 0.5);

    const redrawVolume = () => {
      const v = soundManager.volume;
      pctLabel.setText(`${Math.round(v * 100)}%`);
      volBarBg.clear();
      volBarBg.fillStyle(0x221133, 1);
      volBarBg.fillRoundedRect(trackX, trackY, trackW, trackH, 4);
      volBarFill.clear();
      if (v > 0) {
        volBarFill.fillStyle(0xcc88ff, 1);
        volBarFill.fillRoundedRect(trackX, trackY, Math.max(trackH, trackW * v), trackH, 4);
      }
    };
    redrawVolume();

    // Clickable track
    const trackHit = this.add.rectangle(trackX + trackW / 2, trackY + trackH / 2, trackW, 28, 0xffffff, 0)
      .setDepth(54).setInteractive({ useHandCursor: true });
    allObjs.push(trackHit);
    trackHit.on("pointerdown", (ptr: Phaser.Input.Pointer, _lx: unknown, _ly: unknown, e: Event) => {
      e.stopPropagation();
      const ratio = Phaser.Math.Clamp((ptr.x - trackX) / trackW, 0, 1);
      soundManager.volume = ratio;
      soundManager.enabled = ratio > 0 ? true : soundManager.enabled;
      saveSettings({ volume: soundManager.volume, soundEnabled: soundManager.enabled });
      redrawVolume();
      refreshToggle();
    });

    // [−] button
    const makeSmallBtn = (label: string, bx: number, by: number, cb: () => void) => {
      const bg = this.add.graphics().setDepth(52);
      bg.fillStyle(0x221133, 0.9);
      bg.fillRoundedRect(bx - 18, by - 14, 36, 28, 6);
      bg.lineStyle(1, 0x9944cc, 0.6);
      bg.strokeRoundedRect(bx - 18, by - 14, 36, 28, 6);
      allObjs.push(bg);
      const t = addText(bx, by, label, { fontSize: "18px", fontFamily: "monospace", color: "#cc88ff" })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on("pointerover", () => t.setColor("#ffffff"));
      t.on("pointerout",  () => t.setColor("#cc88ff"));
      t.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, e: Event) => {
        e.stopPropagation();
        cb();
        saveSettings({ volume: soundManager.volume, soundEnabled: soundManager.enabled });
        redrawVolume();
        refreshToggle();
      });
    };

    makeSmallBtn("−", trackX - 26, trackY + trackH / 2, () => {
      soundManager.volume = Math.max(0, Math.round((soundManager.volume - 0.1) * 10) / 10);
    });
    makeSmallBtn("+", trackX + trackW + 70, trackY + trackH / 2, () => {
      soundManager.volume = Math.min(1, Math.round((soundManager.volume + 0.1) * 10) / 10);
      soundManager.enabled = true;
    });

    // ── SOUND TOGGLE ─────────────────────────────────────────────────
    addText(px + 32, py + 155, "SOUND", {
      fontSize: "16px", fontFamily: "monospace", color: "#aaaacc",
    });

    const toggleBg = this.add.graphics().setDepth(52);
    allObjs.push(toggleBg);
    const toggleLabel = addText(px + 200, py + 163, "", {
      fontSize: "15px", fontFamily: "monospace", color: "#00ff88",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const refreshToggle = () => {
      const on = soundManager.enabled;
      toggleBg.clear();
      toggleBg.fillStyle(on ? 0x003311 : 0x220011, 0.9);
      toggleBg.fillRoundedRect(px + 140, py + 150, 120, 28, 8);
      toggleBg.lineStyle(2, on ? 0x00ff88 : 0xff4455, 0.8);
      toggleBg.strokeRoundedRect(px + 140, py + 150, 120, 28, 8);
      toggleLabel.setText(on ? "✓  ON" : "✕  OFF");
      toggleLabel.setColor(on ? "#00ff88" : "#ff4455");
    };
    refreshToggle();

    toggleLabel.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, e: Event) => {
      e.stopPropagation();
      soundManager.enabled = !soundManager.enabled;
      saveSettings({ volume: soundManager.volume, soundEnabled: soundManager.enabled });
      refreshToggle();
    });
    toggleLabel.on("pointerover", () => toggleLabel.setScale(1.06));
    toggleLabel.on("pointerout",  () => toggleLabel.setScale(1));

    // ── FULLSCREEN ───────────────────────────────────────────────────
    addText(px + 32, py + 218, "FULLSCREEN", {
      fontSize: "16px", fontFamily: "monospace", color: "#aaaacc",
    });

    const fsBg = this.add.graphics().setDepth(52);
    allObjs.push(fsBg);
    const fsLabel = addText(px + 210, py + 226, "", {
      fontSize: "15px", fontFamily: "monospace", color: "#44aaff",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const refreshFs = () => {
      const full = this.scale.isFullscreen;
      fsBg.clear();
      fsBg.fillStyle(0x001122, 0.9);
      fsBg.fillRoundedRect(px + 140, py + 213, 140, 28, 8);
      fsBg.lineStyle(2, 0x44aaff, 0.7);
      fsBg.strokeRoundedRect(px + 140, py + 213, 140, 28, 8);
      fsLabel.setText(full ? "⤓  EXIT FULL" : "⤢  ENTER FULL");
      fsLabel.setColor(full ? "#aaccff" : "#44aaff");
    };
    refreshFs();

    fsLabel.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, e: Event) => {
      e.stopPropagation();
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
      this.time.delayedCall(120, refreshFs);
    });
    fsLabel.on("pointerover", () => fsLabel.setScale(1.06));
    fsLabel.on("pointerout",  () => fsLabel.setScale(1));

    this.scale.on("enterfullscreen",  refreshFs);
    this.scale.on("leavefullscreen",  refreshFs);

    // ── Divider lines ─────────────────────────────────────────────────
    const divG = this.add.graphics().setDepth(52);
    divG.lineStyle(1, 0xcc88ff, 0.18);
    divG.lineBetween(px + 20, py + 135, px + panelW - 20, py + 135);
    divG.lineBetween(px + 20, py + 198, px + panelW - 20, py + 198);
    divG.lineBetween(px + 20, py + 260, px + panelW - 20, py + 260);
    allObjs.push(divG);

    // ── CLOSE button ─────────────────────────────────────────────────
    const bottomY = py + panelH - 34;
    const closeBtnBg = this.add.graphics().setDepth(52);
    closeBtnBg.fillStyle(0x110022, 0.85);
    closeBtnBg.fillRoundedRect(W / 2 - 70, bottomY - 14, 140, 28, 8);
    closeBtnBg.lineStyle(1, 0xcc88ff, 0.5);
    closeBtnBg.strokeRoundedRect(W / 2 - 70, bottomY - 14, 140, 28, 8);
    allObjs.push(closeBtnBg);
    const closeTxt = addText(W / 2, bottomY, "[ CLOSE ]", {
      fontSize: "14px", fontFamily: "monospace", color: "#cc88ff",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeTxt.on("pointerover", () => closeTxt.setColor("#ffffff"));
    closeTxt.on("pointerout",  () => closeTxt.setColor("#cc88ff"));
    closeTxt.on("pointerdown", (_p: unknown, _lx: unknown, _ly: unknown, e: Event) => {
      e.stopPropagation();
      closeAll();
    });

    // Overlay closes only outside panel
    overlay.on("pointerdown", (ptr: Phaser.Input.Pointer) => {
      const inside = ptr.x >= px && ptr.x <= px + panelW && ptr.y >= py && ptr.y <= py + panelH;
      if (!inside) closeAll();
    });
  }

  private showLeaderboard() {
    const W = this.scale.width;
    const H = this.scale.height;

    const scores = getScores();

    const panelW = 700;
    const panelH = 560;
    const px = W / 2 - panelW / 2;
    const py = H / 2 - panelH / 2;

    // Dim overlay — only closes when clicking OUTSIDE the panel
    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.88)
      .setDepth(50)
      .setInteractive();

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0f1a, 0.98);
    panel.fillRoundedRect(px, py, panelW, panelH, 16);
    panel.lineStyle(2, 0xffd700, 0.7);
    panel.strokeRoundedRect(px, py, panelW, panelH, 16);
    panel.setDepth(51);

    const allObjs: Phaser.GameObjects.GameObject[] = [overlay, panel];

    const closeAll = () => allObjs.forEach((o) => { if (o.active) o.destroy(); });

    const addText = (x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle) => {
      const t = this.add.text(x, y, text, style).setDepth(52);
      allObjs.push(t);
      return t;
    };

    // Title
    addText(W / 2, py + 36, "HIGH SCORES", {
      fontSize: "32px", fontFamily: "monospace", color: "#ffd700",
      stroke: "#553300", strokeThickness: 3,
      shadow: { offsetX: 0, offsetY: 0, color: "#ffaa00", blur: 12, fill: true },
    }).setOrigin(0.5);

    // ✕ Close button (top-right of panel)
    const closeBtnBg = this.add.graphics().setDepth(52);
    closeBtnBg.fillStyle(0x220000, 0.85);
    closeBtnBg.fillRoundedRect(px + panelW - 46, py + 10, 36, 30, 6);
    allObjs.push(closeBtnBg);

    const closeBtn = addText(px + panelW - 28, py + 25, "✕", {
      fontSize: "20px", fontFamily: "monospace", color: "#885555",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on("pointerover", () => closeBtn.setColor("#ff6666"));
    closeBtn.on("pointerout", () => closeBtn.setColor("#885555"));
    closeBtn.on("pointerdown", (p: Phaser.Input.Pointer, lx: number, ly: number, e: Event) => {
      e.stopPropagation();
      closeAll();
    });

    // Column headers
    const headerY = py + 86;
    addText(px + 36,  headerY, "#",     { fontSize: "14px", fontFamily: "monospace", color: "#556677" }).setOrigin(0.5);
    addText(px + 148, headerY, "SCORE", { fontSize: "14px", fontFamily: "monospace", color: "#556677" }).setOrigin(0.5);
    addText(px + 268, headerY, "TIME",  { fontSize: "14px", fontFamily: "monospace", color: "#556677" }).setOrigin(0.5);
    addText(px + 378, headerY, "LVL",   { fontSize: "14px", fontFamily: "monospace", color: "#556677" }).setOrigin(0.5);
    addText(px + 498, headerY, "RANK",  { fontSize: "14px", fontFamily: "monospace", color: "#556677" }).setOrigin(0.5);
    addText(px + 635, headerY, "DATE",  { fontSize: "14px", fontFamily: "monospace", color: "#556677" }).setOrigin(0.5);

    // Divider
    const div = this.add.graphics().setDepth(52);
    div.lineStyle(1, 0xffd700, 0.25);
    div.lineBetween(px + 20, headerY + 18, px + panelW - 20, headerY + 18);
    allObjs.push(div);

    if (scores.length === 0) {
      addText(W / 2, H / 2 + 20, "No scores yet — complete a level to appear here!", {
        fontSize: "16px", fontFamily: "monospace", color: "#445566",
      }).setOrigin(0.5);
    } else {
      const rankColors: Record<string, string> = {
        "TEMPORAL MASTER": "#ffd700",
        "TIME SHIFTER":    "#00ffff",
        "CHRONO ADEPT":    "#88ff88",
        "CHRONO NOVICE":   "#778899",
      };
      const rowColors = ["#ffd700", "#aaaacc", "#cc8844"];

      scores.forEach((entry: LeaderboardEntry, i: number) => {
        const rowY = headerY + 32 + i * 42;
        const numColor   = i < 3 ? rowColors[i] : "#445566";
        const scoreColor = i === 0 ? "#ffee44" : "#aaccee";

        if (i < 3) {
          const rowBg = this.add.graphics().setDepth(51);
          rowBg.fillStyle(i === 0 ? 0x221a00 : 0x0d0d22, 0.5);
          rowBg.fillRoundedRect(px + 14, rowY - 14, panelW - 28, 34, 6);
          allObjs.push(rowBg);
        }

        const lvl = entry.levelsCompleted ?? 3;
        const lvlColor = lvl === 3 ? "#ffd700" : lvl === 2 ? "#aaccff" : "#778899";
        addText(px + 36,  rowY, `${i + 1}`,              { fontSize: "18px", fontFamily: "monospace", color: numColor }).setOrigin(0.5);
        addText(px + 148, rowY, `${entry.score}`,         { fontSize: "18px", fontFamily: "monospace", color: scoreColor }).setOrigin(0.5);
        addText(px + 268, rowY, formatTime(entry.timeMs), { fontSize: "18px", fontFamily: "monospace", color: "#aaccff" }).setOrigin(0.5);
        addText(px + 378, rowY, `${lvl}/3`,               { fontSize: "16px", fontFamily: "monospace", color: lvlColor }).setOrigin(0.5);
        addText(px + 498, rowY, entry.rank,               { fontSize: "12px", fontFamily: "monospace", color: rankColors[entry.rank] ?? "#aaaaaa" }).setOrigin(0.5);
        addText(px + 635, rowY, entry.date,               { fontSize: "12px", fontFamily: "monospace", color: "#445566" }).setOrigin(0.5);
      });
    }

    // Bottom row: CLEAR on left, CLOSE on right
    const bottomY = py + panelH - 34;

    const clearBg = this.add.graphics().setDepth(52);
    clearBg.fillStyle(0x110000, 0.8);
    clearBg.fillRoundedRect(px + 20, bottomY - 14, 140, 28, 6);
    clearBg.lineStyle(1, 0x882222, 0.6);
    clearBg.strokeRoundedRect(px + 20, bottomY - 14, 140, 28, 6);
    allObjs.push(clearBg);

    const clearBtn = addText(px + 90, bottomY, "CLEAR SCORES", {
      fontSize: "13px", fontFamily: "monospace", color: "#883333",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    clearBtn.on("pointerover", () => clearBtn.setColor("#ff4444"));
    clearBtn.on("pointerout",  () => clearBtn.setColor("#883333"));
    clearBtn.on("pointerdown", (p: Phaser.Input.Pointer, lx: number, ly: number, e: Event) => {
      e.stopPropagation();
      closeAll();
      clearScores();
      this.showLeaderboard();
    });

    const closeBtnBottom = addText(px + panelW - 90, bottomY, "[ CLOSE ]", {
      fontSize: "14px", fontFamily: "monospace", color: "#aaaaff",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtnBottom.on("pointerover", () => closeBtnBottom.setColor("#ffffff"));
    closeBtnBottom.on("pointerout",  () => closeBtnBottom.setColor("#aaaaff"));
    closeBtnBottom.on("pointerdown", (p: Phaser.Input.Pointer, lx: number, ly: number, e: Event) => {
      e.stopPropagation();
      closeAll();
    });

    // Overlay only closes when clicking OUTSIDE the panel bounds
    overlay.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const inside = pointer.x >= px && pointer.x <= px + panelW &&
                     pointer.y >= py && pointer.y <= py + panelH;
      if (!inside) closeAll();
    });
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
