export interface LeaderboardEntry {
  score: number;
  timeMs: number;
  rank: string;
  date: string;
  levelsCompleted: number;
}

const STORAGE_KEY = "chrono_shift_leaderboard";
const MAX_ENTRIES = 10;

function getRank(score: number): string {
  if (score >= 2000) return "TEMPORAL MASTER";
  if (score >= 1200) return "TIME SHIFTER";
  if (score >= 600) return "CHRONO ADEPT";
  return "CHRONO NOVICE";
}

export function saveScore(score: number, timeMs: number, levelsCompleted: number): { isNewBest: boolean; position: number } {
  const entries = getScores();
  const newEntry: LeaderboardEntry = {
    score,
    timeMs,
    rank: getRank(score),
    date: new Date().toLocaleDateString(),
    levelsCompleted,
  };

  entries.push(newEntry);
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeMs - b.timeMs;
  });

  const position = entries.findIndex((e) => e === newEntry) + 1;
  const trimmed = entries.slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}

  const isNewBest = position === 1;
  return { isNewBest, position: Math.min(position, MAX_ENTRIES) };
}

export function getScores(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function clearScores(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function formatTime(ms: number): string {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
