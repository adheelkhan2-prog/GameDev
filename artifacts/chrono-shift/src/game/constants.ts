export const PLAYER_SPEED = 220;
export const PLAYER_JUMP_VELOCITY = -520;
export const PLAYER_MAX_HEALTH = 3;
export const PLAYER_INVINCIBILITY_TIME = 1200;

export const TIME_SLOW_DURATION = 5000;
export const TIME_SLOW_COOLDOWN = 3000;
export const TIME_SLOW_SCALE = 0.2;


export const CRYSTALS_PER_LEVEL = 5;

export const DRONE_SPEED = 80;
export const CHASER_SPEED = 115;
export const CHASER_AGGRO_RANGE = 380;
export const PHASE_SHIFTER_TELEPORT_INTERVAL = 2500;
export const PULSAR_FIRE_INTERVAL = 2000;
export const PROJECTILE_SPEED = 280;

export const COLLAPSE_DELAY = 800;
export const COLLAPSE_RESPAWN = 3000;

export const DASH_SPEED = 560;
export const DASH_DURATION = 190;
export const DASH_COOLDOWN = 2200;
export const DOUBLE_JUMP_VELOCITY = -460;
export const WALL_JUMP_VX = 270;
export const WALL_JUMP_VY = -490;

export const PLAYER_SHOOT_COOLDOWN = 1500;
export const PLAYER_PROJECTILE_SPEED = 520;
export const PLAYER_PROJECTILE_COLOR = 0x00ffcc;

export const BOSS_MAX_HP = 15;
export const BOSS_SPEED = 95;
export const BOSS_CHARGE_SPEED = 330;
export const BOSS_FIRE_INTERVAL = 1800;

export const DIFFICULTY = {
  easy:   { enemySpeed: 0.65, playerHealth: 5, scoreBonus: 0.7  },
  normal: { enemySpeed: 1.0,  playerHealth: 3, scoreBonus: 1.0  },
  hard:   { enemySpeed: 1.4,  playerHealth: 2, scoreBonus: 1.5  },
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY;

export const COLORS = {
  PLAYER: 0x00ffff,
  PLAYER_GLOW: 0x0088ff,
  PLATFORM: 0x1a5c3a,
  PLATFORM_LIGHT: 0x228b52,
  GROUND: 0x0d3d26,
  CRYSTAL: 0xffd700,
  CRYSTAL_GLOW: 0xffaa00,
  SHARD: 0x8866ff,
  HEALTH_PICKUP: 0xff4466,
  DRONE: 0xcc2200,
  CHASER: 0xff2266,
  PHASE_SHIFTER: 0xff6600,
  PULSAR: 0xff3300,
  PROJECTILE: 0xff8800,
  SPIKE: 0x444455,
  EXIT: 0xff00ff,
  EXIT_GLOW: 0xaa00ff,
  BG: 0x000f1f,
  BG2: 0x001a33,
  TIME_SLOW_TINT: 0x4444ff,
  COLLAPSE_PLATFORM: 0x7a4a1a,
  UI_TEXT: 0xffffff,
  UI_BG: 0x000000,
  STAR: 0x334455,
  BOSS: 0xdd0022,
  BOSS_GLOW: 0xff4400,
  RUINS_PLATFORM: 0x6b4226,
  RUINS_LIGHT: 0x8b6240,
  RUINS_GROUND: 0x3d2010,
  FUTURE_PLATFORM: 0x1a3a6b,
  FUTURE_LIGHT: 0x2a5aab,
  FUTURE_GROUND: 0x0d1f3d,
};
