/**
 * Win rate = wins / (wins + losses + draws) * 100
 * Returns 0 if denominator is 0.
 */
export function safeWinRate(wins: number, losses: number, draws: number): number {
  const total = wins + losses + draws;
  if (total === 0) return 0;
  return Math.round((wins / total) * 1000) / 10;
}

/**
 * Win rate excluding draws = wins / (wins + losses) * 100
 * Returns 0 if denominator is 0.
 */
export function safeWinRateNoDraws(wins: number, losses: number): number {
  const total = wins + losses;
  if (total === 0) return 0;
  return Math.round((wins / total) * 1000) / 10;
}
