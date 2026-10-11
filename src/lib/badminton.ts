// Badminton scoring (BWF rally point), shared by the scorer UI and the server
// so both agree on what a valid result is.
//   A game is won at 21 with a 2-point lead; at 29-29 the next point (30) wins.
//   A match is one game, or best of three (2-0 / 2-1).

export type GameScore = [number, number]; // [team 1, team 2]

export const POINTS_TO_WIN = 21;
export const POINT_CAP = 30;

/** 1 or 2 when that team has won the game, otherwise null (still running). */
export function gameWinner([a, b]: GameScore): 1 | 2 | null {
  if (a >= POINTS_TO_WIN && a - b >= 2) return 1;
  if (b >= POINTS_TO_WIN && b - a >= 2) return 2;
  if (a === POINT_CAP && b === POINT_CAP - 1) return 1;
  if (b === POINT_CAP && a === POINT_CAP - 1) return 2;
  return null;
}

/** A finished game that could really happen (e.g. 21-19, 22-20, 30-29; not 25-10). */
export function isValidFinishedGame([a, b]: GameScore) {
  const w = Math.max(a, b);
  const l = Math.min(a, b);
  if (!Number.isInteger(a) || !Number.isInteger(b) || l < 0 || w > POINT_CAP) return false;
  if (w === POINTS_TO_WIN) return l <= POINTS_TO_WIN - 2;
  if (w === POINT_CAP) return l === POINT_CAP - 2 || l === POINT_CAP - 1;
  return w > POINTS_TO_WIN && w - l === 2;
}

/** Can a point still be added to `team` without breaking the rules? */
export function canScore([a, b]: GameScore, team: 1 | 2) {
  return gameWinner([a, b]) === null && (team === 1 ? a : b) < POINT_CAP;
}

/**
 * Match winner for a list of finished games, or an error message. One game,
 * 2-0 or 2-1; no game may be played after a team already has two.
 */
export function matchResult(games: GameScore[]): { winner: 1 | 2 } | { error: string } {
  if (games.length < 1 || games.length > 3) return { error: "Isi 1 sampai 3 game" };
  let t1 = 0;
  let t2 = 0;
  for (const g of games) {
    if (t1 === 2 || t2 === 2) return { error: "Match sudah selesai sebelum game terakhir" };
    if (!isValidFinishedGame(g)) return { error: `Skor ${g[0]}-${g[1]} tidak sesuai aturan badminton` };
    if (gameWinner(g) === 1) t1 += 1;
    else t2 += 1;
  }
  if (games.length === 2 && t1 === 1) return { error: "Skor 1-1: perlu game ketiga" };
  if (games.length === 3 && Math.max(t1, t2) !== 2) return { error: "Game ketiga tidak diperlukan" };
  return { winner: t1 > t2 ? 1 : 2 };
}

/** "21-19, 18-21, 21-15" <-> [[21,19],[18,21],[21,15]] (team 1 first). */
export function formatGames(games: GameScore[]) {
  return games.map(([a, b]) => `${a}-${b}`).join(", ");
}

export function parseGames(score: string): GameScore[] {
  return score
    .split(",")
    .map((g) => g.trim().split("-").map(Number) as GameScore)
    .filter((g) => g.length === 2 && g.every(Number.isFinite));
}
