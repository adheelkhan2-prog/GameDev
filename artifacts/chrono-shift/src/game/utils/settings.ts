export interface UnlockedAbilities {
  doubleJump: boolean;
  dash: boolean;
  wallClimb: boolean;
  shoot: boolean;
}

export interface GameSettings {
  volume: number;
  soundEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  showGhostReplay: boolean;
  cameraShake: boolean;
  showMinimap: boolean;
  unlockedAbilities: UnlockedAbilities;
}

const KEY = "chrono_shift_settings_v2";

const DEFAULT_ABILITIES: UnlockedAbilities = {
  doubleJump: false,
  dash: false,
  wallClimb: false,
  shoot: false,
};

const DEFAULTS: GameSettings = {
  volume: 0.38,
  soundEnabled: true,
  difficulty: 'normal',
  showGhostReplay: true,
  cameraShake: true,
  showMinimap: true,
  unlockedAbilities: { ...DEFAULT_ABILITIES },
};

export function getSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, unlockedAbilities: { ...DEFAULT_ABILITIES } };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      unlockedAbilities: { ...DEFAULT_ABILITIES, ...(parsed.unlockedAbilities ?? {}) },
    };
  } catch {
    return { ...DEFAULTS, unlockedAbilities: { ...DEFAULT_ABILITIES } };
  }
}

export function saveSettings(s: Partial<GameSettings>): void {
  try {
    const current = getSettings();
    const merged: GameSettings = {
      ...current,
      ...s,
      unlockedAbilities: {
        ...current.unlockedAbilities,
        ...(s.unlockedAbilities ?? {}),
      },
    };
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {}
}

export function unlockAbility(ability: keyof UnlockedAbilities): void {
  const s = getSettings();
  if (!s.unlockedAbilities[ability]) {
    s.unlockedAbilities[ability] = true;
    saveSettings(s);
  }
}

export function resetAbilities(): void {
  const s = getSettings();
  s.unlockedAbilities = { ...DEFAULT_ABILITIES };
  saveSettings(s);
}

export function hasCutscenePlayed(): boolean {
  try { return localStorage.getItem("chrono_cutscene_seen") === "1"; } catch { return false; }
}

export function markCutscenePlayed(): void {
  try { localStorage.setItem("chrono_cutscene_seen", "1"); } catch {}
}
