import type { TournamentRecord, OverallStats } from "./types";
import { safeWinRate, safeWinRateNoDraws } from "./utils";

function isValidRecord(record: TournamentRecord): boolean {
  return record.wins >= 0 && record.losses >= 0 && record.draws >= 0;
}

export function computeOverallStats(records: TournamentRecord[]): OverallStats {
  const valid = records.filter(isValidRecord);

  if (valid.length === 0) {
    return {
      totalTournaments: 0,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      winRate: 0,
      winRateNoDraws: 0,
      averageStanding: 0,
      bestStanding: null,
    };
  }

  const wins = valid.reduce((sum, r) => sum + r.wins, 0);
  const losses = valid.reduce((sum, r) => sum + r.losses, 0);
  const draws = valid.reduce((sum, r) => sum + r.draws, 0);
  const totalMatches = wins + losses + draws;

  const standings = valid
    .map((r) => r.standing)
    .filter((s): s is number => s !== null && s > 0);

  const averageStanding =
    standings.length > 0
      ? Math.round((standings.reduce((a, b) => a + b, 0) / standings.length) * 10) / 10
      : 0;

  const bestStanding = standings.length > 0 ? Math.min(...standings) : null;

  return {
    totalTournaments: valid.length,
    totalMatches,
    wins,
    losses,
    draws,
    winRate: safeWinRate(wins, losses, draws),
    winRateNoDraws: safeWinRateNoDraws(wins, losses),
    averageStanding,
    bestStanding,
  };
}
