import Phaser from "phaser";
import { Player } from "../objects/Player";
import { TimeManager } from "../managers/TimeManager";
import { UIManager } from "../managers/UIManager";
import { TemporalDrone } from "../objects/enemies/TemporalDrone";
import { PhaseShifter } from "../objects/enemies/PhaseShifter";
import { Pulsar } from "../objects/enemies/Pulsar";
import { ChaserEnemy } from "../objects/enemies/ChaserEnemy";
import { BossEnemy } from "../objects/enemies/BossEnemy";
import { GhostReplayManager } from "../managers/GhostReplayManager";
import { Projectile } from "../objects/Projectile";
import { Collectible } from "../objects/Collectible";
import { EnemyBase } from "../objects/enemies/EnemyBase";
import {
  CRYSTALS_PER_LEVEL,
  COLORS,
  COLLAPSE_DELAY,
  COLLAPSE_RESPAWN,
  DIFFICULTY,
  type DifficultyKey,
  PLAYER_PROJECTILE_SPEED,
  PLAYER_PROJECTILE_COLOR,
} from "../constants";
import { soundManager } from "../managers/SoundManager";
import { getSettings, type UnlockedAbilities } from "../utils/settings";

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  h?: number;
  type?: "normal" | "collapse";
  collapse?: boolean;
  tileKey?: string;
}

export interface EnemyDef {
  type: "drone" | "phase_shifter" | "pulsar" | "chaser" | "boss";
  x: number;
  y: number;
  patrolMin?: number;
  patrolMax?: number;
  fireAngle?: number;
}

export interface CollectibleDef {
  type?: "crystal" | "shard" | "health";
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

interface CollapseData {
  originalX: number;
  originalY: number;
  triggered: boolean;
}

export abstract class GameScene extends Phaser.Scene {
  protected player!: Player;
  protected timeManager!: TimeManager;
  protected uiManager!: UIManager;

  protected platforms!: Phaser.Physics.Arcade.StaticGroup;
  protected enemies!: Phaser.Physics.Arcade.Group;
  protected enemyList: EnemyBase[] = [];
  protected projectiles!: Phaser.Physics.Arcade.Group;
  protected playerProjectiles!: Phaser.Physics.Arcade.Group;
  protected crystals!: Phaser.Physics.Arcade.StaticGroup;
  protected collectibles: Collectible[] = [];
  protected spikes!: Phaser.Physics.Arcade.StaticGroup;
  protected exitSprite!: Phaser.Physics.Arcade.Sprite;

  protected crystalsCollected = 0;
  protected totalCrystals = CRYSTALS_PER_LEVEL;
  private crystalPositions: Array<{ x: number; y: number }> = [];
  protected levelComplete = false;
  protected gameOver = false;
  protected paused = false;
  protected cumulativeTimeMs = 0;

  protected requiresBossDefeat = false;
  protected bossDefeated = false;
  protected boss: BossEnemy | null = null;
  protected ghostReplayManager: GhostReplayManager | null = null;
  protected defaultTileKey = "platform";
  protected bgColor: number = COLORS.BG2;
  protected difficultyKey: DifficultyKey = "normal";

  private comboCount = 0;
  private lastKillTime = 0;
  private readonly COMBO_WINDOW_MS = 2500;
  protected dropOrbs: Array<{ gfx: Phaser.GameObjects.Graphics; type: "health" | "slow_boost" }> = [];
  protected proximityHints: Array<{ x: number; text: string; triggered: boolean }> = [];

  private pauseContainer!: Phaser.GameObjects.Container;
  private pauseInfoText!: Phaser.GameObjects.Text;

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

  init(data: { score?: number; cumulativeTimeMs?: number; difficulty?: string }) {
    this.cumulativeTimeMs = data?.cumulativeTimeMs ?? 0;
    const raw = (data?.difficulty ?? getSettings().difficulty) as string;
    this.difficultyKey = (DIFFICULTY[raw as DifficultyKey] ? raw : "normal") as DifficultyKey;
  }

  create() {
    this.levelComplete = false;
    this.gameOver = false;
    this.crystalsCollected = 0;
    this.enemyList = [];
    this.collectibles = [];
    this.bossDefeated = false;
    this.boss = null;
    this.comboCount = 0;
    this.lastKillTime = 0;
    this.dropOrbs = [];
    this.proximityHints = [];

    this.createBackground();
    this.createPlatforms();
    this.createSpikes();
    this.createVortexes();
    this.createExit();
    this.createCollectibles();

    this.timeManager = new TimeManager(this);

    const settings = getSettings();
    const diff = DIFFICULTY[this.difficultyKey];

    const levelAbilities = this.getPlayerAbilities(settings.unlockedAbilities);
    this.player = new Player(
      this,
      this.spawnX,
      this.spawnY,
      this.timeManager,
      diff.playerHealth,
      levelAbilities
    );
    this.player.onDamage = () => this.uiManager?.flashDamage();
    this.player.onDeath = () => this.handleGameOver();

    this.createEnemies();

    this.player.onShoot = (x, y, dir) => {
      const proj = new Projectile(this, x, y, this.timeManager);
      proj.setTint(PLAYER_PROJECTILE_COLOR);
      proj.fire(dir * PLAYER_PROJECTILE_SPEED, 0);
      this.playerProjectiles.add(proj, true);
      soundManager.playerShoot();
    };

    this.setupCollisions();
    this.setupCamera();

    this.uiManager = new UIManager(
      this,
      this.timeManager,
      this.levelNumber,
      levelAbilities,
      diff.playerHealth
    );

    this.input.keyboard!.on("keydown-ESC", () => this.togglePause());

    this.pauseContainer = this.add
      .container(0, 0)
      .setDepth(200)
      .setScrollFactor(0)
      .setVisible(false) as Phaser.GameObjects.Container;
    this.buildPauseMenu();

    this.uiManager.initMiniMap({
      worldWidth: this.worldWidth,
      worldHeight: this.worldHeight,
      crystals: this.crystalPositions,
      exitX: this.exitX,
      exitY: this.exitY,
      platforms: this.buildPlatforms().map((p) => ({
        x: p.x,
        y: p.y,
        w: p.w,
        h: p.h,
      })),
    });

    this.ghostReplayManager = new GhostReplayManager(this, this.levelNumber);

    if (this.levelNumber === 1) {
      soundManager.startAmbientMusic();
    }

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private createBackground() {
    const W = this.worldWidth;
    const H = this.worldHeight;
    const screenW = this.scale.width;
    const maxScroll = Math.max(0, W - screenW);

    this.add.rectangle(W / 2, H / 2, W, H, this.bgColor).setDepth(0);

    // Far parallax layer (slowest — distant nebula dust)
    const SF_FAR = 0.12;
    const farW = maxScroll * SF_FAR + screenW;
    const farGfx = this.add.graphics().setDepth(0.3).setScrollFactor(SF_FAR);
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, farW);
      const y = Phaser.Math.Between(0, H);
      const r = Phaser.Math.FloatBetween(0.4, 1.8);
      farGfx.fillStyle(0x2a3d5a, Phaser.Math.FloatBetween(0.35, 0.85));
      farGfx.fillCircle(x, y, r);
    }

    // Mid parallax layer (medium-speed — mid-field debris)
    const SF_MID = 0.36;
    const midW = maxScroll * SF_MID + screenW;
    const midGfx = this.add.graphics().setDepth(0.6).setScrollFactor(SF_MID);
    for (let i = 0; i < 70; i++) {
      const x = Phaser.Math.Between(0, midW);
      const y = Phaser.Math.Between(0, H);
      midGfx.fillStyle(0x334466, Phaser.Math.FloatBetween(0.12, 0.38));
      midGfx.fillCircle(x, y, Phaser.Math.FloatBetween(1.5, 4.5));
    }

    // Near stars (world-speed)
    const starCount = Math.floor(W / 14);
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const star = this.add
        .image(x, y, "star")
        .setDepth(1)
        .setAlpha(Phaser.Math.FloatBetween(0.2, 0.9));
      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.05, 0.3),
        duration: Phaser.Math.Between(800, 2500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(1, 0x112233, 0.22);
    for (let y = 0; y < H; y += 60) gridGfx.lineBetween(0, y, W, y);
    for (let x = 0; x < W; x += 80) gridGfx.lineBetween(x, 0, x, H);
    gridGfx.setDepth(2);
  }

  private createPlatforms() {
    this.platforms = this.physics.add.staticGroup();
    for (const def of this.buildPlatforms()) {
      const w = def.w;
      const h = def.h ?? 24;
      const cols = Math.ceil(w / 32);
      const isCollapse = def.type === "collapse" || def.collapse === true;
      const tileKey = isCollapse
        ? "platform_collapse"
        : (def.tileKey ?? this.defaultTileKey);

      for (let c = 0; c < cols; c++) {
        const tileW = Math.min(32, w - c * 32);
        const tx = def.x + c * 32 + tileW / 2;
        const ty = def.y;

        const tile = this.physics.add.staticImage(tx, ty, tileKey);
        tile.setDisplaySize(tileW, h);
        tile.refreshBody();
        this.platforms.add(tile);

        if (isCollapse) {
          (
            tile as Phaser.Physics.Arcade.Image & { collapseData?: CollapseData }
          ).collapseData = {
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
    for (const def of this.buildSpikes()) {
      const count = def.count ?? 1;
      for (let i = 0; i < count; i++) {
        const spike = this.physics.add.staticImage(
          def.x + i * 16 + 8,
          def.y - 14,
          "spike"
        );
        spike.setDepth(8);
        this.spikes.add(spike);
      }
    }
  }

  private createVortexes() {
    if (!this.buildVortexes) return;
    for (const def of this.buildVortexes()) {
      const vortex = this.add
        .image(def.x + 100, def.y + 100, "vortex_zone")
        .setDepth(4)
        .setAlpha(0.7);
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
    this.tweens.add({
      targets: this.exitSprite,
      scaleY: 1.15,
      scaleX: 0.9,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
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
    this.crystalPositions = [];
    let crystalIdx = 0;

    // Non-crystal collectibles (shards, health) placed at their defined positions
    for (const def of this.buildCollectibles()) {
      const type = def.type ?? "crystal";
      if (type === "crystal") continue;
      const c = new Collectible(this, def.x, def.y, type);
      this.collectibles.push(c);
    }

    // Crystals spread evenly across the level: divide into zones, pick one platform per zone
    const allPlats = this.buildPlatforms();
    const candidates = allPlats.filter(
      (p) => p.type !== "collapse" && (p.w ?? 0) >= 80 && p.y < 620
    );
    const zoneWidth = this.worldWidth / this.totalCrystals;
    const chosen: typeof candidates = [];

    for (let z = 0; z < this.totalCrystals; z++) {
      const zoneMin = z * zoneWidth;
      const zoneMax = (z + 1) * zoneWidth;
      const inZone = candidates.filter(
        (p) => p.x + (p.w ?? 0) / 2 >= zoneMin && p.x + (p.w ?? 0) / 2 < zoneMax
      );
      const pool = inZone.length > 0 ? inZone : candidates;
      const pick = pool[Phaser.Math.Between(0, pool.length - 1)];
      if (pick && !chosen.includes(pick)) {
        chosen.push(pick);
      }
    }

    // Fallback: if zones didn't yield enough unique platforms, top up from remainder
    if (chosen.length < this.totalCrystals) {
      const remaining = (Phaser.Utils.Array.Shuffle([...candidates]) as typeof candidates)
        .filter((p) => !chosen.includes(p));
      chosen.push(...remaining.slice(0, this.totalCrystals - chosen.length));
    }

    for (const plat of chosen) {
      const margin = 24;
      const maxX = plat.x + (plat.w ?? 80) - margin;
      const minX = plat.x + margin;
      const cx = minX < maxX ? Phaser.Math.Between(minX, maxX) : plat.x + (plat.w ?? 80) / 2;
      const cy = plat.y - (plat.h ?? 24) - 20;
      this.crystalPositions.push({ x: cx, y: cy });
      const c = new Collectible(this, cx, cy, "crystal");
      (c as Collectible & { crystalIndex: number }).crystalIndex = crystalIdx++;
      this.collectibles.push(c);
      this.crystals.add(c);
    }
  }

  private createEnemies() {
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
    });
    this.projectiles = this.physics.add.group({ classType: Projectile });
    this.playerProjectiles = this.physics.add.group();

    const platformBounds = this.buildPlatforms().map((p) => ({
      x: p.x,
      y: p.y,
      w: p.w,
      h: p.h ?? 24,
    }));

    const diff = DIFFICULTY[this.difficultyKey];

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
        drone.baseSpeedMultiplier = diff.enemySpeed;
        enemy = drone;
      } else if (def.type === "phase_shifter") {
        const ps = new PhaseShifter(
          this,
          def.x,
          def.y,
          this.timeManager,
          platformBounds
        );
        (ps as EnemyBase & { baseSpeedMultiplier?: number }).baseSpeedMultiplier =
          diff.enemySpeed;
        enemy = ps;
      } else if (def.type === "chaser") {
        const chaser = new ChaserEnemy(
          this,
          def.x,
          def.y,
          this.timeManager,
          this.player,
          def.patrolMin ?? def.x - 200,
          def.patrolMax ?? def.x + 200
        );
        chaser.baseSpeedMultiplier = diff.enemySpeed;
        enemy = chaser;
      } else if (def.type === "boss") {
        const bossEnemy = new BossEnemy(
          this,
          def.x,
          def.y,
          this.timeManager,
          this.player,
          this.projectiles,
          def.patrolMin ?? 100,
          def.patrolMax ?? this.worldWidth - 100
        );
        bossEnemy.onDefeated = () => this.onBossDefeated();
        bossEnemy.onPhaseChange = (phase) => {
          soundManager.bossPhaseChange();
          this.cameras.main.flash(300, 255, 100, 0);
          this.cameras.main.shake(200, 0.01);
        };
        this.boss = bossEnemy;
        enemy = bossEnemy;
      } else {
        // pulsar
        enemy = new Pulsar(
          this,
          def.x,
          def.y,
          this.timeManager,
          this.projectiles,
          def.fireAngle ?? 180
        );
      }

      this.enemies.add(enemy, true);
      this.enemyList.push(enemy);
    }
  }

  private onBossDefeated() {
    this.bossDefeated = true;
    soundManager.bossDefeat();
    this.cameras.main.flash(600, 255, 180, 0);
    this.cameras.main.shake(400, 0.018);
    this.uiManager?.showBossDefeated();

    // Particle burst at boss position
    if (this.boss) {
      try {
        const bx = this.boss.x;
        const by = this.boss.y;
        const em = this.add.particles(bx, by, "particle", {
          speed: { min: 80, max: 400 },
          angle: { min: 0, max: 360 },
          scale: { start: 1.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: { min: 600, max: 1200 },
          quantity: 3,
          frequency: 30,
          tint: [0xff4400, 0xff8800, 0xffff00, 0xffffff],
        });
        this.time.delayedCall(1200, () => em.destroy());
      } catch {}
    }
  }

  private setupCollisions() {
    // Player ↔ platforms
    this.physics.add.collider(this.player, this.platforms, (_p, platform) => {
      this.handleCollapsePlatform(
        platform as Phaser.Physics.Arcade.Image & {
          collapseData?: CollapseData;
        }
      );
    });

    // Player ↔ spikes — instant death
    this.physics.add.overlap(this.player, this.spikes, () => {
      if (!this.player.invincible && this.player.active) {
        this.player.health = 0;
        this.player.onDeath?.();
      }
    });

    // Player ↔ enemies — with stomp detection
    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_playerObj, enemyObj) => {
        const enemy = enemyObj as EnemyBase;
        if (!enemy.active) return;

        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        const stompVelocity = 60;
        const isStomping =
          playerBody.velocity.y > stompVelocity &&
          this.player.y < enemy.y - 8;

        if (isStomping) {
          const died = enemy.takeDamage(1);
          this.player.setVelocityY(-370);
          soundManager.stomp();
          if (died) {
            this.player.addScore(Math.round(150 * DIFFICULTY[this.difficultyKey].scoreBonus));
            this.handleEnemyKill(enemy.x, enemy.y);
            this.maybeSpawnDrop(enemy.x, enemy.y);
          } else {
            this.player.addScore(30);
          }
          this.cameras.main.shake(70, 0.004);
          // Hit spark particles
          try {
            const em = this.add.particles(enemy.x, enemy.y, "particle", {
              speed: { min: 40, max: 160 },
              angle: { min: 200, max: 340 },
              scale: { start: 0.8, end: 0 },
              alpha: { start: 1, end: 0 },
              lifespan: 250,
              quantity: 10,
              tint: [0xffff00, 0xff8800, 0xffffff],
            });
            this.time.delayedCall(300, () => em.destroy());
          } catch {}
          if (enemy instanceof BossEnemy) soundManager.bossHit();
        } else if (!this.player.invincible && this.player.active) {
          this.player.takeDamage();
        }
      }
    );

    // Player ↔ projectiles
    this.physics.add.overlap(
      this.player,
      this.projectiles,
      (_p, projSprite) => {
        const proj = projSprite as Projectile;
        if (!proj.active) return;
        proj.setActive(false).setVisible(false);
        if (!this.player.invincible && this.player.active) {
          this.player.takeDamage();
        }
      }
    );

    // Player projectiles ↔ enemies
    this.physics.add.overlap(
      this.playerProjectiles,
      this.enemies,
      (_projSprite, _enemyObj) => {
        const proj = _projSprite as Projectile;
        const enemy = _enemyObj as EnemyBase;
        if (!proj.active || !enemy.active) return;
        proj.setActive(false).setVisible(false);

        // Boss weak-point: triple damage when exposed core is active
        let dmg = 1;
        if (enemy instanceof BossEnemy && enemy.weakPointActive) {
          dmg = 3;
          this.showWeakPointFlash(enemy.x, enemy.y);
        }

        const died = enemy.takeDamage(dmg);
        if (died) {
          this.player.addScore(Math.round(100 * DIFFICULTY[this.difficultyKey].scoreBonus));
          this.handleEnemyKill(enemy.x, enemy.y);
          this.maybeSpawnDrop(enemy.x, enemy.y);
        }
        try {
          const em = this.add.particles(enemy.x, enemy.y, "particle", {
            speed: { min: 40, max: 130 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 200,
            quantity: 8,
            tint: [0x00ffcc, 0x00ff88, 0xffffff],
          });
          this.time.delayedCall(260, () => em.destroy());
        } catch {}
      }
    );

    // Player ↔ exit
    this.physics.add.overlap(this.player, this.exitSprite, () => {
      const crystalsOk = this.crystalsCollected >= this.totalCrystals;
      const bossOk = !this.requiresBossDefeat || this.bossDefeated;
      if (crystalsOk && bossOk && !this.levelComplete) {
        this.handleLevelComplete();
      }
    });

    // Enemies ↔ platforms
    this.physics.add.collider(this.enemies, this.platforms);
  }

  private handleCollapsePlatform(
    platform: Phaser.Physics.Arcade.Image & { collapseData?: CollapseData }
  ) {
    const cd = platform.collapseData;
    if (!cd || cd.triggered) return;
    cd.triggered = true;

    this.tweens.add({
      targets: platform,
      alpha: { from: 1, to: 0.2 },
      duration: 200,
      yoyo: true,
      repeat: Math.floor(COLLAPSE_DELAY / 400),
    });

    this.time.delayedCall(COLLAPSE_DELAY, () => {
      if (platform.active) {
        platform.setVisible(false).setActive(false);
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
    this.cameras.main.setBackgroundColor(this.bgColor);
  }

  private buildPauseMenu() {
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const cy = H / 2;

    const overlay = this.add
      .rectangle(cx, cy, W, H, 0x000000, 0.72)
      .setInteractive();
    this.pauseContainer.add(overlay);

    const panel = this.add.graphics();
    panel.fillStyle(0x001a33, 0.97);
    panel.fillRoundedRect(cx - 200, cy - 200, 400, 400, 16);
    panel.lineStyle(2, 0x00ffcc, 0.6);
    panel.strokeRoundedRect(cx - 200, cy - 200, 400, 400, 16);
    this.pauseContainer.add(panel);

    const acc = this.add.graphics();
    acc.lineStyle(2, 0x00ffcc, 0.3);
    acc.lineBetween(cx - 200, cy - 200, cx - 160, cy - 200);
    acc.lineBetween(cx - 200, cy - 200, cx - 200, cy - 160);
    acc.lineBetween(cx + 200, cy - 200, cx + 160, cy - 200);
    acc.lineBetween(cx + 200, cy - 200, cx + 200, cy - 160);
    acc.lineBetween(cx - 200, cy + 200, cx - 160, cy + 200);
    acc.lineBetween(cx - 200, cy + 200, cx - 200, cy + 160);
    acc.lineBetween(cx + 200, cy + 200, cx + 160, cy + 200);
    acc.lineBetween(cx + 200, cy + 200, cx + 200, cy + 160);
    this.pauseContainer.add(acc);

    const title = this.add
      .text(cx, cy - 155, "PAUSED", {
        fontSize: "42px",
        fontFamily: "monospace",
        color: "#00ffcc",
        stroke: "#003322",
        strokeThickness: 4,
        shadow: { offsetX: 0, offsetY: 0, color: "#00ffcc", blur: 14, fill: true },
      })
      .setOrigin(0.5);
    this.pauseContainer.add(title);

    const div = this.add.graphics();
    div.lineStyle(1, 0x00ffcc, 0.3);
    div.lineBetween(cx - 150, cy - 108, cx + 150, cy - 108);
    this.pauseContainer.add(div);

    this.pauseInfoText = this.add
      .text(cx, cy - 80, `LEVEL ${this.levelNumber}`, {
        fontSize: "16px",
        fontFamily: "monospace",
        color: "#446677",
      })
      .setOrigin(0.5);
    this.pauseContainer.add(this.pauseInfoText);

    const btnDefs = [
      { label: "▶  RESUME",        color: "#00ff88", dy: -20,  action: () => this.togglePause() },
      { label: "↺  RESTART LEVEL", color: "#ffee44", dy: 55,   action: () => this.restartLevel() },
      { label: "⌂  MAIN MENU",     color: "#aaaaff", dy: 130,  action: () => this.goToMenu() },
    ];

    for (const def of btnDefs) {
      const by = cy + def.dy;
      const bg = this.add.graphics();
      bg.fillStyle(0x001122, 0.85);
      bg.fillRoundedRect(cx - 155, by - 24, 310, 48, 8);
      bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(def.color).color, 0.55);
      bg.strokeRoundedRect(cx - 155, by - 24, 310, 48, 8);
      this.pauseContainer.add(bg);

      const btn = this.add
        .text(cx, by, def.label, {
          fontSize: "22px",
          fontFamily: "monospace",
          color: def.color,
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on("pointerover", () => {
        btn.setScale(1.07);
        bg.clear();
        bg.fillStyle(0x002244, 0.95);
        bg.fillRoundedRect(cx - 155, by - 24, 310, 48, 8);
        bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(def.color).color, 1);
        bg.strokeRoundedRect(cx - 155, by - 24, 310, 48, 8);
      });
      btn.on("pointerout", () => {
        btn.setScale(1);
        bg.clear();
        bg.fillStyle(0x001122, 0.85);
        bg.fillRoundedRect(cx - 155, by - 24, 310, 48, 8);
        bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(def.color).color, 0.55);
        bg.strokeRoundedRect(cx - 155, by - 24, 310, 48, 8);
      });
      btn.on("pointerdown", def.action);
      this.pauseContainer.add(btn);
    }

    const hint = this.add
      .text(cx, cy + 175, "Press ESC to resume", {
        fontSize: "13px",
        fontFamily: "monospace",
        color: "#334455",
      })
      .setOrigin(0.5);
    this.pauseContainer.add(hint);
  }

  private togglePause() {
    if (this.gameOver || this.levelComplete) return;

    if (!this.paused) {
      this.paused = true;
      this.physics.pause();
      this.tweens.pauseAll();
      this.uiManager?.pauseTimer();
      const score = this.player?.score ?? 0;
      const diffLabel = this.difficultyKey.toUpperCase();
      this.pauseInfoText.setText(
        `LEVEL ${this.levelNumber}  •  SCORE: ${score}  •  ${diffLabel}`
      );
      this.pauseContainer.setVisible(true);
      this.tweens.add({
        targets: this.pauseContainer,
        alpha: { from: 0, to: 1 },
        duration: 150,
      });
      soundManager.pauseOpen();
    } else {
      this.tweens.resumeAll();
      this.tweens.add({
        targets: this.pauseContainer,
        alpha: { from: 1, to: 0 },
        duration: 120,
        onComplete: () => {
          this.pauseContainer.setVisible(false);
          this.uiManager?.resumeTimer();
          this.physics.resume();
          this.paused = false;
          soundManager.pauseClose();
        },
      });
    }
  }

  private restartLevel() {
    this.paused = false;
    this.uiManager?.resumeTimer();
    this.physics.resume();
    this.tweens.resumeAll();
    this.ghostReplayManager?.destroy();
    this.ghostReplayManager = null;
    soundManager.stopAmbientMusic();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => this.scene.restart());
  }

  private goToMenu() {
    this.paused = false;
    this.uiManager?.resumeTimer();
    this.physics.resume();
    this.tweens.resumeAll();
    this.ghostReplayManager?.destroy();
    this.ghostReplayManager = null;
    soundManager.stopAmbientMusic();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => this.scene.start("MenuScene"));
  }

  protected getPlayerAbilities(abilities: UnlockedAbilities): UnlockedAbilities {
    if (this.levelNumber >= 4) {
      return { ...abilities, wallClimb: false, shoot: true };
    }
    return abilities;
  }

  protected spawnSingleEnemy(def: EnemyDef): void {
    const platformBounds = this.buildPlatforms().map((p) => ({
      x: p.x, y: p.y, w: p.w, h: p.h ?? 24,
    }));
    const diff = DIFFICULTY[this.difficultyKey];
    let enemy: EnemyBase;

    if (def.type === "drone") {
      const drone = new TemporalDrone(
        this, def.x, def.y, this.timeManager,
        def.patrolMin ?? def.x - 150, def.patrolMax ?? def.x + 150
      );
      drone.baseSpeedMultiplier = diff.enemySpeed;
      enemy = drone;
    } else if (def.type === "phase_shifter") {
      const ps = new PhaseShifter(
        this, def.x, def.y, this.timeManager, platformBounds
      );
      (ps as EnemyBase & { baseSpeedMultiplier?: number }).baseSpeedMultiplier = diff.enemySpeed;
      enemy = ps;
    } else if (def.type === "chaser") {
      const chaser = new ChaserEnemy(
        this, def.x, def.y, this.timeManager, this.player,
        def.patrolMin ?? def.x - 200, def.patrolMax ?? def.x + 200
      );
      chaser.baseSpeedMultiplier = diff.enemySpeed;
      enemy = chaser;
    } else {
      enemy = new Pulsar(
        this, def.x, def.y, this.timeManager, this.projectiles,
        def.fireAngle ?? 180
      );
    }

    this.enemies.add(enemy, true);
    this.enemyList.push(enemy);
  }

  protected handleLevelComplete() {
    if (this.levelComplete) return;
    this.levelComplete = true;
    soundManager.levelComplete();
    soundManager.stopAmbientMusic();
    this.ghostReplayManager?.destroy();
    this.ghostReplayManager = null;

    this.cameras.main.flash(400, 255, 255, 100);

    this.time.delayedCall(600, () => {
      const elapsed = this.uiManager.getElapsedTime();
      this.scene.start("LevelCompleteScene", {
        level: this.levelNumber,
        score: this.player.score,
        timeMs: elapsed,
        cumulativeTimeMs: this.cumulativeTimeMs + elapsed,
        nextScene: this.nextScene,
        crystals: this.crystalsCollected,
        difficulty: this.difficultyKey,
      });
    });
  }

  private handleGameOver() {
    if (this.gameOver) return;
    this.gameOver = true;
    soundManager.gameOver();
    soundManager.stopAmbientMusic();
    this.ghostReplayManager?.destroy();
    this.ghostReplayManager = null;

    this.cameras.main.shake(300, 0.015);
    this.cameras.main.fade(800, 0, 0, 0);

    this.time.delayedCall(1000, () => {
      this.scene.start("GameOverScene", {
        level: this.levelNumber,
        score: this.player.score,
        retryScene: this.scene.key,
      });
    });
  }

  update(_time: number, delta: number) {
    if (this.gameOver || this.levelComplete || this.paused) return;

    this.timeManager.update(delta);
    this.player.update();
    this.checkProximityHints();

    // Ghost replay
    this.ghostReplayManager?.recordFrame(this.player);
    this.ghostReplayManager?.updatePlayback();

    // Drop orb pickups
    for (let i = this.dropOrbs.length - 1; i >= 0; i--) {
      const orb = this.dropOrbs[i];
      if (!orb.gfx || !orb.gfx.active) {
        this.dropOrbs.splice(i, 1);
        continue;
      }
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y, orb.gfx.x, orb.gfx.y
      );
      if (dist < 28) {
        this.collectDropOrb(orb.type);
        orb.gfx.destroy();
        this.dropOrbs.splice(i, 1);
      }
    }

    // Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      if (!c.active) {
        this.collectibles.splice(i, 1);
        continue;
      }
      c.update();
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        c.x,
        c.y
      );
      if (dist < 30) {
        const type = c.collectibleType;
        if (type === "crystal") {
          const idx =
            (c as Collectible & { crystalIndex?: number }).crystalIndex ?? -1;
          this.uiManager?.markCrystalCollected(idx);
          this.crystalsCollected++;
          this.player.addScore(
            Math.round(100 * DIFFICULTY[this.difficultyKey].scoreBonus)
          );
          if (this.crystalsCollected >= this.totalCrystals) {
            this.uiManager?.showCrystalsComplete();
            soundManager.allCrystals();
          } else {
            soundManager.crystalCollect();
          }
        } else if (type === "shard") {
          this.player.addScore(
            Math.round(50 * DIFFICULTY[this.difficultyKey].scoreBonus)
          );
          soundManager.shardCollect();
        } else if (type === "health") {
          if (this.player.health < this.player.maxHealth) {
            this.player.health++;
          }
          soundManager.healthCollect();
        }
        c.collect();
        this.collectibles.splice(i, 1);
      }
    }

    // Enemies
    for (const e of this.enemyList) {
      if (e.active) e.update(delta);
    }

    // Enemy projectiles
    this.projectiles.getChildren().forEach((p) => {
      const proj = p as Projectile;
      if (proj.active) proj.update(delta);
    });

    // Player projectiles
    this.playerProjectiles.getChildren().forEach((p) => {
      const proj = p as Projectile;
      if (proj.active) proj.update(delta);
    });

    this.uiManager.update(
      this.player.score,
      this.player.health,
      this.crystalsCollected,
      this.totalCrystals,
      this.player.x,
      this.player.y,
      this.player.dashCooldownRemaining,
      this.player.dashActive,
      this.player.shootCooldownRemaining
    );
  }

  // ── Combo kill streak ──────────────────────────────────────────────────
  private handleEnemyKill(x: number, y: number) {
    void x; void y;
    const now = this.time.now;
    if (this.lastKillTime > 0 && now - this.lastKillTime < this.COMBO_WINDOW_MS) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastKillTime = now;
    if (this.comboCount >= 2) {
      const bonus = Math.round(this.comboCount * 60 * DIFFICULTY[this.difficultyKey].scoreBonus);
      this.player.addScore(bonus);
      this.uiManager?.showCombo(this.comboCount);
      soundManager.comboKill();
    }
  }

  // ── Enemy item drops ────────────────────────────────────────────────────
  private maybeSpawnDrop(wx: number, wy: number) {
    const roll = Math.random();
    if (roll >= 0.30) return;
    const type: "health" | "slow_boost" = roll < 0.20 ? "health" : "slow_boost";
    const color = type === "health" ? 0xff3366 : 0x33aaff;
    const gfx = this.add.graphics();
    gfx.fillStyle(color, 0.9);
    gfx.fillCircle(0, 0, 8);
    gfx.lineStyle(2, 0xffffff, 0.55);
    gfx.strokeCircle(0, 0, 8);
    gfx.setPosition(wx, wy - 14).setDepth(12);
    this.tweens.add({
      targets: gfx,
      y: gfx.y - 7,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    // Auto-destroy after 10s
    this.time.delayedCall(10000, () => {
      if (gfx.active) gfx.destroy();
      const idx = this.dropOrbs.findIndex(o => o.gfx === gfx);
      if (idx !== -1) this.dropOrbs.splice(idx, 1);
    });
    this.dropOrbs.push({ gfx, type });
  }

  private collectDropOrb(type: "health" | "slow_boost") {
    if (type === "health") {
      if (this.player.health < this.player.maxHealth) this.player.health++;
      soundManager.healthCollect();
      this.showPickupText("+1 HEALTH", "#ff4488");
    } else {
      if (!this.timeManager.slowActive && this.timeManager.slowReady) {
        this.timeManager.activateTimeSlow();
        this.showPickupText("TIME SLOW ACTIVATED!", "#33aaff");
      } else {
        this.player.addScore(Math.round(80 * DIFFICULTY[this.difficultyKey].scoreBonus));
        this.showPickupText("+TIME SLOW BOOST", "#33aaff");
      }
      soundManager.itemPickup();
    }
  }

  private showPickupText(text: string, color: string) {
    const txt = this.add
      .text(this.player.x, this.player.y - 30, text, {
        fontSize: "13px",
        fontFamily: "monospace",
        color,
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({
      targets: txt,
      y: txt.y - 44,
      alpha: 0,
      duration: 1100,
      ease: "Power2",
      onComplete: () => txt.destroy(),
    });
  }

  // ── Boss weak-point hit flash ────────────────────────────────────────────
  private showWeakPointFlash(wx: number, wy: number) {
    const txt = this.add
      .text(wx, wy - 22, "WEAK POINT \u00d73!", {
        fontSize: "16px",
        fontFamily: "monospace",
        color: "#00ffcc",
        stroke: "#002211",
        strokeThickness: 3,
        shadow: { offsetX: 0, offsetY: 0, color: "#00ffcc", blur: 10, fill: true },
      })
      .setOrigin(0.5)
      .setDepth(52);
    this.tweens.add({
      targets: txt,
      y: wy - 70,
      alpha: 0,
      duration: 1200,
      ease: "Power2",
      onComplete: () => txt.destroy(),
    });
    soundManager.weakPointHit();
  }

  // ── Proximity hint system ────────────────────────────────────────────────
  protected addProximityHint(x: number, text: string) {
    this.proximityHints.push({ x, text, triggered: false });
  }

  private checkProximityHints() {
    if (!this.player) return;
    for (const hint of this.proximityHints) {
      if (!hint.triggered && this.player.x >= hint.x) {
        hint.triggered = true;
        this.showHintBanner(hint.text);
      }
    }
  }

  private showHintBanner(text: string) {
    const W = this.scale.width;
    const banner = this.add
      .text(W / 2, 58, text, {
        fontSize: "15px",
        fontFamily: "monospace",
        color: "#ffffff",
        stroke: "#001122",
        strokeThickness: 3,
        backgroundColor: "#000000bb",
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(92)
      .setScrollFactor(0)
      .setAlpha(0);
    this.tweens.add({
      targets: banner,
      alpha: 1,
      duration: 320,
      onComplete: () => {
        this.time.delayedCall(2600, () => {
          this.tweens.add({
            targets: banner,
            alpha: 0,
            duration: 520,
            onComplete: () => banner.destroy(),
          });
        });
      },
    });
  }

  shutdown() {
    this.timeManager?.destroy();
    this.ghostReplayManager?.destroy();
    this.ghostReplayManager = null;
    this.dropOrbs.forEach(o => { try { o.gfx?.destroy(); } catch {} });
    this.dropOrbs = [];
  }
}
