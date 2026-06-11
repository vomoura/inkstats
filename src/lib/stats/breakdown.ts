import type { TournamentRecord, BreakdownStats, GroupedWinRate, MonthlyWinRate } from "./types";
import { safeWinRate, safeWinRateNoDraws } from "./utils";

const MIN_MATCHES_FOR_STORE = 3;

function isValidRecord(record: TournamentRecord): boolean {
  return record.wins >= 0 && record.losses >= 0 && record.draws >= 0;
}

function computeGroupedWinRate(
  records: TournamentRecord[],
  groupBy: (r: TournamentRecord) => string
): GroupedWinRate[] {
  const groups = new Map<
    string,
    { wins: number; losses: number; draws: number; tournaments: number }
  >();

  for (const record of records) {
    const key = groupBy(record);
    const existing = groups.get(key) ?? { wins: 0, losses: 0, draws: 0, tournaments: 0 };
    existing.wins += record.wins;
    existing.losses += record.losses;
    existing.draws += record.draws;
    existing.tournaments += 1;
    groups.set(key, existing);
  }

  return Array.from(groups.entries()).map(([name, data]) => ({
    name,
    winRate: safeWinRate(data.wins, data.losses, data.draws),
    winRateNoDraws: safeWinRateNoDraws(data.wins, data.losses),
    totalMatches: data.wins + data.losses + data.draws,
    wins: data.wins,
    losses: data.losses,
    draws: data.draws,
    tournaments: data.tournaments,
  }));
}

export function computeWinRateByStore(records: TournamentRecord[]): GroupedWinRate[] {
  const valid = records.filter(isValidRecord);
  const grouped = computeGroupedWinRate(valid, (r) => r.storeName ?? "Unknown Store");
  return grouped.filter((g) => g.totalMatches >= MIN_MATCHES_FOR_STORE);
}

export function computeWinRateByDeck(records: TournamentRecord[]): GroupedWinRate[] {
  const valid = records.filter(isValidRecord);
  return computeGroupedWinRate(valid, (r) => r.deckName ?? "Unknown Deck");
}

export function computeWinRateOverTime(records: TournamentRecord[]): MonthlyWinRate[] {
  const valid = records.filter(isValidRecord).filter((r) => r.date !== null);

  const months = new Map<string, { wins: number; losses: number; draws: number }>();

  for (const record of valid) {
    const date = record.date!;
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const existing = months.get(key) ?? { wins: 0, losses: 0, draws: 0 };
    existing.wins += record.wins;
    existing.losses += record.losses;
    existing.draws += record.draws;
    months.set(key, existing);
  }

  return Array.from(months.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      winRate: safeWinRate(data.wins, data.losses, data.draws),
      winRateNoDraws: safeWinRateNoDraws(data.wins, data.losses),
      totalMatches: data.wins + data.losses + data.draws,
      wins: data.wins,
      losses: data.losses,
      draws: data.draws,
    }));
}

export function computeBreakdownStats(records: TournamentRecord[]): BreakdownStats {
  return {
    byStore: computeWinRateByStore(records),
    byDeck: computeWinRateByDeck(records),
    overTime: computeWinRateOverTime(records),
  };
}
