import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { CutsceneScene } from "./scenes/CutsceneScene";
import { Level1Scene } from "./scenes/Level1Scene";
import { Level2Scene } from "./scenes/Level2Scene";
import { Level3Scene } from "./scenes/Level3Scene";
import { Level4Scene } from "./scenes/Level4Scene";
import { Level5Scene } from "./scenes/Level5Scene";
import { BossScene } from "./scenes/BossScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { VictoryScene } from "./scenes/VictoryScene";
import { LevelCompleteScene } from "./scenes/LevelCompleteScene";
import { UIScene } from "./scenes/UIScene";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export function createGame(containerId: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: containerId,
    backgroundColor: "#000f1f",
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 600 },
        debug: false,
      },
    },
    scene: [
      BootScene,
      CutsceneScene,
      MenuScene,
      Level1Scene,
      Level2Scene,
      Level3Scene,
      Level4Scene,
      Level5Scene,
      BossScene,
      GameOverScene,
      VictoryScene,
      LevelCompleteScene,
      UIScene,
    ],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
  };

  return new Phaser.Game(config);
}
