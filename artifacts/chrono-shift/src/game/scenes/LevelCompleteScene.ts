import Phaser from "phaser";
import { saveScore } from "../utils/leaderboard";
import { unlockAbility, getSettings, saveSettings } from "../utils/settings";
import { soundManager } from "../managers/SoundManager";

interface LevelCompleteData {
  level: number;
  score: number;
  timeMs: number;
  cumulativeTimeMs: number;
  nextScene: string;
  crystals: number;
  difficulty?: string;
}

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super("LevelCompleteScene");
  }

  create(data: LevelCompleteData) {
    const W = this.scale.width;
    const H = this.scale.height;
    const level = data?.level ?? 1;
    const difficulty = data?.difficulty ?? "normal";

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
    this.tweens.add({ targets: glow, alpha: { from: 0.4, to: 1 }, duration: 1000, yoyo: true, repeat: -1 });

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
      .text(W / 2, H / 2 - 200, `LEVEL ${level} COMPLETE!`, {
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

    // Divider
    const line = this.add.graphics();
    line.lineStyle(2, 0x00ffcc, 0.4);
    line.lineBetween(W / 2 - 280, H / 2 - 150, W / 2 + 280, H / 2 - 150);

    const fmtMs = (ms: number) => {
      const secs = Math.floor(ms / 1000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const cumMs = data?.cumulativeTimeMs ?? data?.timeMs ?? 0;
    const isFirstLevel = level === 1;
    const isLastLevel = level === 5;

    const statLines = [
      { label: "Score",      value: `${data?.score ?? 0}`,          color: "#ffee44" },
      { label: "Crystals",   value: `${data?.crystals ?? 0} / 5`,    color: "#ffd700" },
      { label: "Level Time", value: fmtMs(data?.timeMs ?? 0),        color: "#aaccff" },
      ...(!isFirstLevel ? [{ label: "Total Time", value: fmtMs(cumMs), color: "#00ffcc" }] : []),
    ];

    statLines.forEach((stat, i) => {
      const y = H / 2 - 120 + i * 48;
      this.add.text(W / 2 - 160, y, stat.label, {
        fontSize: "22px", fontFamily: "monospace", color: "#667788",
      }).setOrigin(0, 0.5);
      this.add.text(W / 2 + 160, y, stat.value, {
        fontSize: "22px", fontFamily: "monospace", color: stat.color,
      }).setOrigin(1, 0.5);
    });

    // Ability unlock logic
    const newAbility = this.checkAbilityUnlock(level);

    saveScore(data?.score ?? 0, cumMs, level);

    // Buttons
    const btnY = H / 2 + (newAbility ? 168 : 130);

    this.createButton(
      W / 2,
      btnY,
      isLastLevel ? "▶  BOSS BATTLE!" : `▶  LEVEL ${level + 1}`,
      isLastLevel ? "#ff8800" : "#00ff88",
      () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
          this.scene.start(data?.nextScene ?? "Level2Scene", {
            score: data?.score,
            cumulativeTimeMs: cumMs,
            difficulty,
          });
        });
      }
    );

    this.createButton(W / 2, btnY + 60, "⌂  MAIN MENU", "#aaaaff", () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("MenuScene"));
    });

    // Ability unlock banner
    if (newAbility) {
      this.showAbilityUnlock(W, H, newAbility);
    }

    // Auto-countdown
    const countdownText = this.add
      .text(W / 2, btnY + 118, "Auto-continuing in 10...", {
        fontSize: "14px", fontFamily: "monospace", color: "#334455",
      })
      .setOrigin(0.5);

    let countdown = 10;
    this.time.addEvent({
      delay: 1000,
      repeat: 9,
      callback: () => {
        countdown--;
        if (countdown > 0) {
          countdownText.setText(`Auto-continuing in ${countdown}...`);
        } else {
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.time.delayedCall(300, () => {
            this.scene.start(data?.nextScene ?? "Level2Scene", {
              score: data?.score,
              cumulativeTimeMs: cumMs,
              difficulty,
            });
          });
        }
      },
    });

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private checkAbilityUnlock(level: number): string | null {
    const abilities = getSettings().unlockedAbilities;
    if (level === 1 && !abilities.doubleJump) {
      unlockAbility("doubleJump");
      soundManager.abilityUnlock();
      return "DOUBLE JUMP";
    }
    if (level === 2 && !abilities.dash) {
      unlockAbility("dash");
      soundManager.abilityUnlock();
      return "DASH  [Q]";
    }
    if (level === 3 && !abilities.shoot) {
      unlockAbility("shoot");
      soundManager.abilityUnlock();
      return "SHOOT  [F]";
    }
    return null;
  }

  private showAbilityUnlock(W: number, H: number, abilityName: string) {
    const bannerY = H / 2 + 76;

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x002200, 0.92);
    bannerBg.fillRoundedRect(W / 2 - 260, bannerY - 26, 520, 52, 10);
    bannerBg.lineStyle(2, 0x00ff88, 0.8);
    bannerBg.strokeRoundedRect(W / 2 - 260, bannerY - 26, 520, 52, 10);
    bannerBg.setAlpha(0);

    const icon = this.add
      .text(W / 2, bannerY - 4, `★  NEW ABILITY UNLOCKED: ${abilityName}  ★`, {
        fontSize: "20px",
        fontFamily: "monospace",
        color: "#00ff88",
        stroke: "#002200",
        strokeThickness: 3,
        shadow: { offsetX: 0, offsetY: 0, color: "#00ff88", blur: 12, fill: true },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({ targets: [bannerBg, icon], alpha: 1, duration: 500, ease: "Power2" });
    this.tweens.add({
      targets: icon,
      scaleX: { from: 0.97, to: 1.03 },
      scaleY: { from: 0.97, to: 1.03 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
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
