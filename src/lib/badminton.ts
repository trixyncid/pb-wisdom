// Badminton scoring (rally point, one game to 30), shared by the scorer UI and
// the server so both agree on what a valid result is.
//   The game is won at 30 with a 2-point lead; at 39-39 the next point (40) wins.
//   A match is best of N games (N odd: 1, 3, 5, ...). Older matches stored in
//   the 21-point format stay as they are; only new results are checked.

export type GameScore = [number, number]; // [team 1, team 2]

export const POINTS_TO_WIN = 30;
export const POINT_CAP = 40;
export const MAX_BEST_OF = 9;

/** 1 or 2 when that team has won the game, otherwise null (still running). */
export function gameWinner([a, b]: GameScore): 1 | 2 | null {
  if (a >= POINTS_TO_WIN && a - b >= 2) return 1;
  if (b >= POINTS_TO_WIN && b - a >= 2) return 2;
  if (a === POINT_CAP && b === POINT_CAP - 1) return 1;
  if (b === POINT_CAP && a === POINT_CAP - 1) return 2;
  return null;
}

/** A finished game that could really happen (e.g. 30-27, 32-30, 40-39; not 35-20). */
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

/** Games a team needs to take the match, e.g. 2 in a best of 3. */
export const gamesToWin = (bestOf: number) => Math.floor(bestOf / 2) + 1;

/**
 * Match winner for a list of finished games played as best of `bestOf`, or an
 * error message. No game may be played after a team already has enough.
 */
export function matchResult(games: GameScore[], bestOf: number): { winner: 1 | 2 } | { error: string } {
  if (!Number.isInteger(bestOf) || bestOf < 1 || bestOf > MAX_BEST_OF || bestOf % 2 === 0) return { error: "Format match tidak valid" };
  const need = gamesToWin(bestOf);
  if (games.length < need || games.length > bestOf) return { error: bestOf === 1 ? "Isi 1 game" : `Isi ${need} sampai ${bestOf} game` };
  let t1 = 0;
  let t2 = 0;
  for (const g of games) {
    if (t1 === need || t2 === need) return { error: "Match sudah selesai sebelum game terakhir" };
    if (!isValidFinishedGame(g)) return { error: `Skor ${g[0]}-${g[1]} tidak sesuai aturan (game ${POINTS_TO_WIN} poin)` };
    if (gameWinner(g) === 1) t1 += 1;
    else t2 += 1;
  }
  if (Math.max(t1, t2) !== need) return { error: `Belum ada tim yang menang ${need} game` };
  return { winner: t1 > t2 ? 1 : 2 };
}

/** "30-27, 28-30, 30-25" <-> [[30,27],[28,30],[30,25]] (team 1 first). */
export function formatGames(games: GameScore[]) {
  return games.map(([a, b]) => `${a}-${b}`).join(", ");
}

export function parseGames(score: string): GameScore[] {
  return score
    .split(",")
    .map((g) => g.trim().split("-").map(Number) as GameScore)
    .filter((g) => g.length === 2 && g.every(Number.isFinite));
}
