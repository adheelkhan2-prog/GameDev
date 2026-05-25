import Phaser from "phaser";
import { markCutscenePlayed } from "../utils/settings";

const PANELS = [
  {
    title: "2087 — THE TEMPORAL BREACH",
    lines: [
      "A catastrophic experiment fractured the space-time continuum.",
      "Echoes of past and future now collide across five shattered eras.",
      "Reality itself hangs in the balance...",
    ],
    titleColor: "#00ffff",
    bgColor: 0x000f1f,
    accentColor: 0x00ffff,
  },
  {
    title: "YOUR MISSION",
    lines: [
      "You are ECHO-7, a Chrono Operative equipped with",
      "experimental time-manipulation technology.",
      "Navigate the fractured timeline. Stabilise each era.",
    ],
    titleColor: "#ffee44",
    bgColor: 0x0a0900,
    accentColor: 0xffee44,
  },
  {
    title: "YOUR TOOLS",
    lines: [
      "[E]  TIME SLOW  —  freeze the temporal field around you.",
      "Master it to survive what awaits.",
    ],
    titleColor: "#66aaff",
    bgColor: 0x00050f,
    accentColor: 0x4477ff,
  },
  {
    title: "THE DANGERS",
    lines: [
      "Temporal Drones patrol the fractured zones.",
      "Phase Shifters blink through space without warning.",
      "And something far worse lurks at the end of the timeline...",
    ],
    titleColor: "#ff6644",
    bgColor: 0x120000,
    accentColor: 0xff4422,
  },
  {
    title: "BEGIN OPERATION: CHRONO SHIFT",
    lines: [
      "Five eras. Five stabilisation crystals each.",
      "One final guardian between chaos and order.",
      "The timeline is counting on you, ECHO-7.",
    ],
    titleColor: "#00ff88",
    bgColor: 0x001008,
    accentColor: 0x00cc66,
  },
];

export class CutsceneScene extends Phaser.Scene {
  private panelIndex = 0;
  private typing = false;
  private canAdvance = false;
  private disposables: Phaser.GameObjects.GameObject[] = [];
  private hintText!: Phaser.GameObjects.Text;
  private activeTimers: Phaser.Time.TimerEvent[] = [];
  private inputLocked = false;

  constructor() {
    super("CutsceneScene");
  }

  create() {
    this.panelIndex = 0;
    this.inputLocked = true;
    this.showPanel(0, false);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.input.keyboard!.on("keydown-SPACE", () => this.onAdvance());
    this.input.keyboard!.on("keydown-ENTER", () => this.onAdvance());
    this.input.on("pointerdown", () => this.onAdvance());
    this.input.keyboard!.on("keydown-ESC", () => this.exitToMenu());

    this.time.delayedCall(600, () => { this.inputLocked = false; });
  }

  private onAdvance() {
    if (this.inputLocked) return;
    if (this.typing) {
      this.skipTyping();
      return;
    }
    if (!this.canAdvance) return;
    this.nextPanel();
  }

  private nextPanel() {
    this.panelIndex++;
    if (this.panelIndex >= PANELS.length) {
      this.exitToMenu();
      return;
    }
    this.inputLocked = true;
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.time.delayedCall(240, () => {
      this.cameras.main.fadeIn(220, 0, 0, 0);
      this.showPanel(this.panelIndex, false);
      this.time.delayedCall(300, () => { this.inputLocked = false; });
    });
  }

  private exitToMenu() {
    markCutscenePlayed();
    this.cameras.main.fadeOut(350, 0, 0, 0);
    this.time.delayedCall(370, () => this.scene.start("MenuScene"));
  }

  private clearPanel() {
    this.activeTimers.forEach(t => t.destroy());
    this.activeTimers = [];
    this.disposables.forEach(o => { if (o.active) o.destroy(); });
    this.disposables = [];
  }

  private skipTyping() {
    this.activeTimers.forEach(t => t.destroy());
    this.activeTimers = [];
    this.typing = false;
    this.showPanel(this.panelIndex, true);
  }

  private showPanel(index: number, instant: boolean) {
    this.clearPanel();
    this.canAdvance = false;
    this.typing = !instant;

    const panel = PANELS[index];
    const W = this.scale.width;
    const H = this.scale.height;

    const bg = this.add.rectangle(W / 2, H / 2, W, H, panel.bgColor);
    this.disposables.push(bg);

    const grid = this.add.graphics().setDepth(1);
    grid.lineStyle(1, panel.accentColor, 0.08);
    for (let y = 0; y < H; y += 60) grid.lineBetween(0, y, W, y);
    for (let x = 0; x < W; x += 80) grid.lineBetween(x, 0, x, H);
    this.disposables.push(grid);

    // Corner decor
    const corners = this.add.graphics().setDepth(5);
    corners.lineStyle(2, panel.accentColor, 0.4);
    const cs = 40;
    corners.lineBetween(30, 30, 30 + cs, 30);
    corners.lineBetween(30, 30, 30, 30 + cs);
    corners.lineBetween(W - 30, 30, W - 30 - cs, 30);
    corners.lineBetween(W - 30, 30, W - 30, 30 + cs);
    corners.lineBetween(30, H - 30, 30 + cs, H - 30);
    corners.lineBetween(30, H - 30, 30, H - 30 - cs);
    corners.lineBetween(W - 30, H - 30, W - 30 - cs, H - 30);
    corners.lineBetween(W - 30, H - 30, W - 30, H - 30 - cs);
    this.disposables.push(corners);

    // Panel counter
    const counter = this.add.text(W / 2, 44, `[ ${index + 1} / ${PANELS.length} ]`, {
      fontSize: "14px", fontFamily: "monospace", color: "#445566",
    }).setOrigin(0.5).setDepth(10);
    this.disposables.push(counter);

    // Title glow
    const titleGlow = this.add.graphics().setDepth(9);
    titleGlow.fillStyle(panel.accentColor, 0.06);
    titleGlow.fillEllipse(W / 2, H * 0.24, 700, 90);
    this.disposables.push(titleGlow);
    this.tweens.add({ targets: titleGlow, alpha: { from: 0.5, to: 1 }, duration: 900, yoyo: true, repeat: -1 });

    // Title
    const title = this.add.text(W / 2, H * 0.23, panel.title, {
      fontSize: "40px", fontFamily: "monospace", color: panel.titleColor,
      stroke: "#000022", strokeThickness: 4,
      shadow: { offsetX: 0, offsetY: 0, color: panel.titleColor, blur: 18, fill: true },
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.disposables.push(title);
    if (!instant) {
      this.tweens.add({ targets: title, alpha: 1, duration: 450, ease: "Power2" });
    } else {
      title.setAlpha(1);
    }

    // Divider
    const div = this.add.graphics().setDepth(10);
    div.lineStyle(2, Phaser.Display.Color.HexStringToColor(panel.titleColor).color, 0.35);
    div.lineBetween(W / 2 - 320, H * 0.32, W / 2 + 320, H * 0.32);
    this.disposables.push(div);

    const lineStartY = H * 0.43;
    const lineSpacing = 72;

    if (instant) {
      panel.lines.forEach((line, i) => {
        const t = this.add.text(W / 2, lineStartY + i * lineSpacing, line, {
          fontSize: "23px", fontFamily: "monospace", color: "#aaccee",
          stroke: "#00000a", strokeThickness: 2,
        }).setOrigin(0.5).setDepth(10);
        this.disposables.push(t);
      });
      this.typing = false;
      this.canAdvance = true;
      if (this.hintText?.active) this.hintText.setVisible(true);
    } else {
      this.typeLines(panel.lines, lineStartY, lineSpacing);
    }

    // Hint
    if (!this.hintText?.active) {
      this.hintText = this.add.text(W / 2, H - 40, "SPACE / CLICK to continue  •  ESC to skip all", {
        fontSize: "14px", fontFamily: "monospace", color: "#334455",
      }).setOrigin(0.5).setDepth(10);
    }
    if (!instant) this.hintText.setVisible(false);

    this.tweens.add({
      targets: this.hintText,
      alpha: { from: 0.4, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }

  private typeLines(lines: string[], startY: number, spacing: number) {
    const W = this.scale.width;

    const typeLine = (lineIdx: number) => {
      if (lineIdx >= lines.length) {
        this.typing = false;
        this.canAdvance = true;
        if (this.hintText?.active) this.hintText.setVisible(true);
        return;
      }
      const fullLine = lines[lineIdx];
      const textObj = this.add.text(W / 2, startY + lineIdx * spacing, "", {
        fontSize: "23px", fontFamily: "monospace", color: "#aaccee",
        stroke: "#00000a", strokeThickness: 2,
      }).setOrigin(0.5).setDepth(10);
      this.disposables.push(textObj);

      let charIdx = 0;
      const timer = this.time.addEvent({
        delay: 26,
        repeat: fullLine.length - 1,
        callback: () => {
          charIdx++;
          textObj.setText(fullLine.substring(0, charIdx));
          if (charIdx >= fullLine.length) {
            const pause = this.time.delayedCall(180, () => typeLine(lineIdx + 1));
            this.activeTimers.push(pause);
          }
        },
      });
      this.activeTimers.push(timer);
    };

    const startDelay = this.time.delayedCall(500, () => typeLine(0));
    this.activeTimers.push(startDelay);
  }

  update() {}
}
