import type { MatchRecord, RecentForm } from "./types";
import { safeWinRate, safeWinRateNoDraws } from "./utils";

/**
 * Compute recent form from the last N matches.
 * Matches should already be filtered to:
 * - isUserMatch === true
 * - result !== "UNKNOWN"
 * - sorted by date/round descending (most recent first)
 */
export function computeRecentForm(matches: MatchRecord[], count: number): RecentForm {
  const recent = matches.slice(0, count);

  if (recent.length === 0) {
    return {
      matches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      winRateNoDraws: 0,
    };
  }

  const wins = recent.filter((m) => m.result === "WIN").length;
  const losses = recent.filter((m) => m.result === "LOSS").length;
  const draws = recent.filter((m) => m.result === "DRAW").length;

  return {
    matches: recent.length,
    wins,
    losses,
    draws,
    winRate: safeWinRate(wins, losses, draws),
    winRateNoDraws: safeWinRateNoDraws(wins, losses),
  };
}

/**
 * Compute recent form for last 5 and last 10 matches.
 */
export function computeRecentForms(matches: MatchRecord[]): {
  recentForm5: RecentForm;
  recentForm10: RecentForm;
} {
  return {
    recentForm5: computeRecentForm(matches, 5),
    recentForm10: computeRecentForm(matches, 10),
  };
}
