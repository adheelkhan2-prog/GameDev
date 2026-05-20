import Phaser from "phaser";
import { Player } from "../objects/Player";
import { TimeManager } from "../managers/TimeManager";
import { UIManager } from "../managers/UIManager";
import { TemporalDrone } from "../objects/enemies/TemporalDrone";
import { PhaseShifter } from "../objects/enemies/PhaseShifter";
import { Pulsar } from "../objects/enemies/Pulsar";
import { Projectile } from "../objects/Projectile";
import { Collectible } from "../objects/Collectible";
import { EnemyBase } from "../objects/enemies/EnemyBase";
import { CRYSTALS_PER_LEVEL, COLORS, COLLAPSE_DELAY, COLLAPSE_RESPAWN } from "../constants";

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  h?: number;
  type?: "normal" | "collapse";
  tileKey?: string;
}

export interface EnemyDef {
  type: "drone" | "phase_shifter" | "pulsar";
  x: number;
  y: number;
  patrolMin?: number;
  patrolMax?: number;
  fireAngle?: number;
}

export interface CollectibleDef {
  type: "crystal" | "shard" | "health";
  x: number;
  y: number;
}

export interface SpikeDef {
  x: number;
  y: number;
  count?: number;
}

export interface VortexDef {
  x: number;
  y: number;
}

export abstract class GameScene extends Phaser.Scene {
  protected player!: Player;
  protected timeManager!: TimeManager;
  protected uiManager!: UIManager;

  protected platforms!: Phaser.Physics.Arcade.StaticGroup;
  protected enemies!: Phaser.Physics.Arcade.Group;
  protected enemyList: EnemyBase[] = [];
  protected projectiles!: Phaser.Physics.Arcade.Group;
  protected crystals!: Phaser.Physics.Arcade.StaticGroup;
  protected collectibles: Collectible[] = [];
  protected spikes!: Phaser.Physics.Arcade.StaticGroup;
  protected exitSprite!: Phaser.Physics.Arcade.Sprite;

  protected crystalsCollected = 0;
  protected totalCrystals = CRYSTALS_PER_LEVEL;
  protected levelComplete = false;
  protected gameOver = false;

  protected abstract levelNumber: number;
  protected abstract worldWidth: number;
  protected abstract worldHeight: number;
  protected abstract spawnX: number;
  protected abstract spawnY: number;
  protected abstract exitX: number;
  protected abstract exitY: number;
  protected abstract nextScene: string;

  protected abstract buildPlatforms(): PlatformDef[];
  protected abstract buildEnemies(): EnemyDef[];
  protected abstract buildCollectibles(): CollectibleDef[];
  protected abstract buildSpikes(): SpikeDef[];
  protected abstract buildVortexes?(): VortexDef[];

  create() {
    this.levelComplete = false;
    this.gameOver = false;
    this.crystalsCollected = 0;
    this.enemyList = [];
    this.collectibles = [];

    this.createBackground();
    this.createPlatforms();
    this.createSpikes();
    this.createVortexes();
    this.createExit();
    this.createCollectibles();

    this.timeManager = new TimeManager(this);

    this.player = new Player(this, this.spawnX, this.spawnY, this.timeManager);
    this.player.onDamage = () => this.uiManager?.flashDamage();
    this.player.onDeath = () => this.handleGameOver();

    this.createEnemies();
    this.setupCollisions();
    this.setupCamera();

    this.uiManager = new UIManager(this, this.timeManager, this.levelNumber);
  }

  private createBackground() {
    const W = this.worldWidth;
    const H = this.worldHeight;

    this.add.rectangle(W / 2, H / 2, W, H, COLORS.BG2).setDepth(0);

    // Animated star field
    const starCount = Math.floor(W / 12);
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const star = this.add.image(x, y, "star").setDepth(1).setAlpha(Phaser.Math.FloatBetween(0.2, 0.9));
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.05, 0.3),
        duration: Phaser.Math.Between(800, 2500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    // Horizontal grid lines (deep blue)
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x112233, 0.25);
    for (let y = 0; y < H; y += 60) {
      gridGfx.lineBetween(0, y, W, y);
    }
    for (let x = 0; x < W; x += 80) {
      gridGfx.lineBetween(x, 0, x, H);
    }
    gridGfx.setDepth(2);
  }

  private createPlatforms() {
    this.platforms = this.physics.add.staticGroup();
    const defs = this.buildPlatforms();

    for (const def of defs) {
      const w = def.w;
      const h = def.h ?? 24;
      const cols = Math.ceil(w / 32);
      const isCollapse = def.type === "collapse";
      const tileKey = isCollapse ? "platform_collapse" : (def.tileKey ?? "platform");

      for (let c = 0; c < cols; c++) {
        const tileW = Math.min(32, w - c * 32);
        const tx = def.x + c * 32 + tileW / 2;
        const ty = def.y;

        const tile = this.physics.add.staticImage(tx, ty, tileKey);
        tile.setDisplaySize(tileW, h);
        tile.refreshBody();
        this.platforms.add(tile);

        if (isCollapse) {
          (tile as Phaser.Physics.Arcade.Image & { collapseData?: CollapseData }).collapseData = {
            originalX: tx,
            originalY: ty,
            triggered: false,
          };
        }
      }
    }
  }

  private createSpikes() {
    this.spikes = this.physics.add.staticGroup();
    const defs = this.buildSpikes();
    for (const def of defs) {
      const count = def.count ?? 1;
      for (let i = 0; i < count; i++) {
        const spike = this.physics.add.staticImage(def.x + i * 16 + 8, def.y, "spike");
        spike.setDepth(8);
        this.spikes.add(spike);
      }
    }
  }

  private createVortexes() {
    if (!this.buildVortexes) return;
    const defs = this.buildVortexes();
    for (const def of defs) {
      const vortex = this.add.image(def.x + 100, def.y + 100, "vortex_zone").setDepth(4).setAlpha(0.7);
      this.tweens.add({
        targets: vortex,
        rotation: Math.PI * 2,
        duration: 6000,
        repeat: -1,
        ease: "Linear",
      });
      this.tweens.add({
        targets: vortex,
        alpha: { from: 0.4, to: 0.8 },
        duration: 2000,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createExit() {
    this.exitSprite = this.physics.add.sprite(this.exitX, this.exitY, "exit");
    this.exitSprite.setDepth(10);
    this.exitSprite.setImmovable(true);
    (this.exitSprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Pulse animation
    this.tweens.add({
      targets: this.exitSprite,
      scaleY: 1.15,
      scaleX: 0.9,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Rotate slightly
    this.tweens.add({
      targets: this.exitSprite,
      alpha: { from: 0.6, to: 1 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  private createCollectibles() {
    this.crystals = this.physics.add.staticGroup();
    const defs = this.buildCollectibles();
    for (const def of defs) {
      const c = new Collectible(this, def.x, def.y, def.type);
      this.collectibles.push(c);
      if (def.type === "crystal") {
        this.crystals.add(c);
      }
    }
  }

  private createEnemies() {
    this.enemies = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite });
    this.projectiles = this.physics.add.group({ classType: Projectile });

    const platformBoundsForPS = this.buildPlatforms().map((p) => ({
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h ?? 24,
    }));

    for (const def of this.buildEnemies()) {
      let enemy: EnemyBase;
      if (def.type === "drone") {
        const drone = new TemporalDrone(
          this,
          def.x,
          def.y,
          this.timeManager,
          def.patrolMin ?? def.x - 150,
          def.patrolMax ?? def.x + 150
        );
        this.timeManager.register(drone);
        enemy = drone;
      } else if (def.type === "phase_shifter") {
        enemy = new PhaseShifter(this, def.x, def.y, this.timeManager, platformBoundsForPS);
        this.timeManager.register(enemy);
      } else {
        enemy = new Pulsar(this, def.x, def.y, this.timeManager, this.projectiles, def.fireAngle ?? 180);
      }
      this.enemies.add(enemy, true);
      this.enemyList.push(enemy);
    }
  }

  private setupCollisions() {
    // Player ↔ platforms
    this.physics.add.collider(this.player, this.platforms, (_player, platform) => {
      this.handleCollapsePlatform(platform as Phaser.Physics.Arcade.Image);
    });

    // Player ↔ spikes
    this.physics.add.overlap(this.player, this.spikes, () => {
      if (!this.player.invincible && this.player.active) {
        this.player.health = 0;
        this.player.onDeath?.();
      }
    });

    // Collectibles handled via distance checks in update()

    // Player ↔ enemies
    this.physics.add.overlap(this.player, this.enemies, () => {
      if (this.player.active && !this.player.invincible) {
        this.player.takeDamage();
      }
    });

    // Player ↔ projectiles
    this.physics.add.overlap(this.player, this.projectiles, (_p, projSprite) => {
      const proj = projSprite as Projectile;
      if (!proj.active) return;
      proj.setActive(false).setVisible(false);
      if (!this.player.invincible && this.player.active) {
        this.player.takeDamage();
      }
    });

    // Player ↔ exit
    this.physics.add.overlap(this.player, this.exitSprite, () => {
      if (this.crystalsCollected >= this.totalCrystals && !this.levelComplete) {
        this.handleLevelComplete();
      }
    });

    // Enemies collide with platforms (drones)
    this.physics.add.collider(this.enemies, this.platforms);
  }

  private handleCollapsePlatform(platform: Phaser.Physics.Arcade.Image & { collapseData?: CollapseData }) {
    const cd = platform.collapseData;
    if (!cd || cd.triggered) return;
    cd.triggered = true;

    // Blink warning
    this.tweens.add({
      targets: platform,
      alpha: { from: 1, to: 0.2 },
      duration: 200,
      yoyo: true,
      repeat: Math.floor(COLLAPSE_DELAY / 400),
    });

    this.time.delayedCall(COLLAPSE_DELAY, () => {
      if (platform.active) {
        platform.setVisible(false);
        platform.setActive(false);
        (platform.body as Phaser.Physics.Arcade.StaticBody).enable = false;

        this.time.delayedCall(COLLAPSE_RESPAWN, () => {
          platform.setVisible(true).setActive(true).setAlpha(1);
          (platform.body as Phaser.Physics.Arcade.StaticBody).enable = true;
          cd.triggered = false;
        });
      }
    });
  }

  private setupCamera() {
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
    this.cameras.main.setZoom(1);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setBackgroundColor(COLORS.BG2);
  }

  private handleLevelComplete() {
    if (this.levelComplete) return;
    this.levelComplete = true;

    this.cameras.main.flash(400, 255, 255, 100);

    this.time.delayedCall(600, () => {
      const elapsed = this.uiManager.getElapsedTime();
      this.scene.start("LevelCompleteScene", {
        level: this.levelNumber,
        score: this.player.score,
        timeMs: elapsed,
        nextScene: this.nextScene,
        crystals: this.crystalsCollected,
      });
    });
  }

  private handleGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;

    this.cameras.main.shake(300, 0.015);
    this.cameras.main.fade(800, 0, 0, 0);

    this.time.delayedCall(1000, () => {
      this.scene.start("GameOverScene", {
        level: this.levelNumber,
        score: this.player.score,
      });
    });
  }

  update(time: number, delta: number) {
    if (this.gameOver || this.levelComplete) return;

    this.timeManager.update(delta);
    this.player.update();

    // Update all collectibles and check collection via distance
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      if (!c.active) {
        this.collectibles.splice(i, 1);
        continue;
      }
      c.update();
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, c.x, c.y);
      if (dist < 30) {
        if (c.collectibleType === "crystal") {
          this.crystalsCollected++;
          this.player.addScore(100);
          if (this.crystalsCollected >= this.totalCrystals) {
            this.uiManager?.showCrystalsComplete();
          }
        } else if (c.collectibleType === "shard") {
          this.player.addScore(50);
        } else if (c.collectibleType === "health") {
          if (this.player.health < 3) this.player.health++;
        }
        c.collect();
        this.collectibles.splice(i, 1);
      }
    }

    // Update enemies
    for (const e of this.enemyList) {
      if (e.active) e.update(delta);
    }

    // Update projectiles
    this.projectiles.getChildren().forEach((p) => {
      const proj = p as Projectile;
      if (proj.active) proj.update(delta);
    });

    this.uiManager.update(
      this.player.score,
      this.player.health,
      this.crystalsCollected,
      this.totalCrystals
    );
  }

  shutdown() {
    this.timeManager?.destroy();
  }
}

interface CollapseData {
  originalX: number;
  originalY: number;
  triggered: boolean;
}
