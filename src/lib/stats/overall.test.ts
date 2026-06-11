import { describe, it, expect } from "vitest";
import { computeOverallStats } from "./overall";
import type { TournamentRecord } from "./types";

function makeRecord(overrides: Partial<TournamentRecord> = {}): TournamentRecord {
  return {
    eventId: "evt-1",
    eventName: "Test Event",
    storeName: "Test Store",
    date: new Date("2025-06-01"),
    standing: 3,
    wins: 3,
    losses: 1,
    draws: 0,
    deckName: "Amethyst/Steel",
    totalPlayers: 16,
    ...overrides,
  };
}

describe("computeOverallStats", () => {
  it("returns zero metrics for empty array", () => {
    const result = computeOverallStats([]);
    expect(result.totalTournaments).toBe(0);
    expect(result.totalMatches).toBe(0);
    expect(result.wins).toBe(0);
    expect(result.losses).toBe(0);
    expect(result.draws).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.winRateNoDraws).toBe(0);
    expect(result.averageStanding).toBe(0);
    expect(result.bestStanding).toBeNull();
  });

  it("computes correct totals from single record", () => {
    const result = computeOverallStats([makeRecord()]);
    expect(result.totalTournaments).toBe(1);
    expect(result.totalMatches).toBe(4);
    expect(result.wins).toBe(3);
    expect(result.losses).toBe(1);
    expect(result.draws).toBe(0);
  });

  it("computes winRate = wins / (wins+losses+draws)", () => {
    const result = computeOverallStats([makeRecord({ wins: 3, losses: 1, draws: 0 })]);
    expect(result.winRate).toBe(75.0);
  });

  it("computes winRateNoDraws = wins / (wins+losses)", () => {
    const result = computeOverallStats([makeRecord({ wins: 3, losses: 1, draws: 2 })]);
    // winRate: 3/6 = 50%
    expect(result.winRate).toBe(50.0);
    // winRateNoDraws: 3/4 = 75%
    expect(result.winRateNoDraws).toBe(75.0);
  });

  it("returns 0 for winRate when no matches", () => {
    const result = computeOverallStats([makeRecord({ wins: 0, losses: 0, draws: 0 })]);
    expect(result.winRate).toBe(0);
    expect(result.winRateNoDraws).toBe(0);
  });

  it("computes win rates correctly across multiple records", () => {
    const records = [
      makeRecord({ wins: 4, losses: 1, draws: 0 }),
      makeRecord({ wins: 3, losses: 0, draws: 1, eventId: "evt-2" }),
    ];
    const result = computeOverallStats(records);
    // 7 wins / 9 total = 77.8%
    expect(result.winRate).toBe(77.8);
    // 7 wins / 8 (wins+losses) = 87.5%
    expect(result.winRateNoDraws).toBe(87.5);
    expect(result.totalMatches).toBe(9);
  });

  it("computes average standing", () => {
    const records = [
      makeRecord({ standing: 3 }),
      makeRecord({ standing: 1, eventId: "evt-2" }),
    ];
    const result = computeOverallStats(records);
    expect(result.averageStanding).toBe(2.0);
  });

  it("computes best standing as lowest value", () => {
    const records = [
      makeRecord({ standing: 5 }),
      makeRecord({ standing: 1, eventId: "evt-2" }),
      makeRecord({ standing: 3, eventId: "evt-3" }),
    ];
    const result = computeOverallStats(records);
    expect(result.bestStanding).toBe(1);
  });

  it("ignores records with null standings for average/best", () => {
    const records = [
      makeRecord({ standing: null }),
      makeRecord({ standing: 2, eventId: "evt-2" }),
    ];
    const result = computeOverallStats(records);
    expect(result.averageStanding).toBe(2.0);
    expect(result.bestStanding).toBe(2);
  });

  it("excludes records with negative values", () => {
    const records = [
      makeRecord({ wins: -1, losses: 2, draws: 0 }),
      makeRecord({ wins: 4, losses: 1, draws: 0, eventId: "evt-2" }),
    ];
    const result = computeOverallStats(records);
    expect(result.totalTournaments).toBe(1);
    expect(result.wins).toBe(4);
  });

  it("is deterministic — same input gives same output", () => {
    const records = [
      makeRecord({ wins: 3, losses: 1, draws: 1 }),
      makeRecord({ wins: 2, losses: 2, draws: 0, eventId: "evt-2" }),
    ];
    const result1 = computeOverallStats(records);
    const result2 = computeOverallStats(records);
    expect(result1).toEqual(result2);
  });

  it("invariant: totalMatches equals wins + losses + draws", () => {
    const records = [
      makeRecord({ wins: 5, losses: 2, draws: 1 }),
      makeRecord({ wins: 3, losses: 3, draws: 0, eventId: "evt-2" }),
    ];
    const result = computeOverallStats(records);
    expect(result.totalMatches).toBe(result.wins + result.losses + result.draws);
  });
});
