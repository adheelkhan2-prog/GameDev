export interface GameSettings {
  volume: number;
  soundEnabled: boolean;
}

const KEY = "chrono_shift_settings";
const DEFAULTS: GameSettings = { volume: 0.38, soundEnabled: true };

export function getSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: GameSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
