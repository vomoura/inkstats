import { describe, it, expect } from "vitest";
import {
  computeWinRateByStore,
  computeWinRateByDeck,
  computeWinRateOverTime,
  computeBreakdownStats,
} from "./breakdown";
import type { TournamentRecord } from "./types";

function makeRecord(overrides: Partial<TournamentRecord> = {}): TournamentRecord {
  return {
    eventId: "evt-1",
    eventName: "Test Event",
    storeName: "Store A",
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

describe("computeWinRateByStore", () => {
  it("returns empty array for empty input", () => {
    expect(computeWinRateByStore([])).toEqual([]);
  });

  it("excludes stores with fewer than 3 matches", () => {
    const records = [makeRecord({ wins: 1, losses: 1, draws: 0 })];
    expect(computeWinRateByStore(records)).toEqual([]);
  });

  it("includes stores with 3+ matches", () => {
    const records = [makeRecord({ wins: 2, losses: 1, draws: 0 })];
    const result = computeWinRateByStore(records);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Store A");
    expect(result[0].winRate).toBe(66.7);
    expect(result[0].winRateNoDraws).toBe(66.7);
  });

  it("computes winRateNoDraws separately", () => {
    const records = [makeRecord({ wins: 2, losses: 1, draws: 1 })];
    const result = computeWinRateByStore(records);
    // winRate: 2/4 = 50%
    expect(result[0].winRate).toBe(50.0);
    // winRateNoDraws: 2/3 = 66.7%
    expect(result[0].winRateNoDraws).toBe(66.7);
  });

  it("groups by store name", () => {
    const records = [
      makeRecord({ storeName: "Store A", wins: 3, losses: 0, draws: 0 }),
      makeRecord({ storeName: "Store B", wins: 1, losses: 2, draws: 0, eventId: "evt-2" }),
    ];
    const result = computeWinRateByStore(records);
    expect(result).toHaveLength(2);
    const storeA = result.find((r) => r.name === "Store A")!;
    const storeB = result.find((r) => r.name === "Store B")!;
    expect(storeA.winRate).toBe(100.0);
    expect(storeB.winRate).toBe(33.3);
  });

  it("groups null store as 'Unknown Store'", () => {
    const records = [makeRecord({ storeName: null, wins: 2, losses: 1, draws: 0 })];
    const result = computeWinRateByStore(records);
    expect(result[0].name).toBe("Unknown Store");
  });
});

describe("computeWinRateByDeck", () => {
  it("returns empty array for empty input", () => {
    expect(computeWinRateByDeck([])).toEqual([]);
  });

  it("groups by deck name", () => {
    const records = [
      makeRecord({ deckName: "Ruby/Sapphire", wins: 4, losses: 0, draws: 0 }),
      makeRecord({ deckName: "Amethyst/Steel", wins: 2, losses: 2, draws: 0, eventId: "evt-2" }),
    ];
    const result = computeWinRateByDeck(records);
    expect(result).toHaveLength(2);
    const ruby = result.find((r) => r.name === "Ruby/Sapphire")!;
    expect(ruby.winRate).toBe(100.0);
    expect(ruby.winRateNoDraws).toBe(100.0);
  });

  it("groups null deck as 'Unknown Deck'", () => {
    const records = [makeRecord({ deckName: null, wins: 1, losses: 1, draws: 0 })];
    const result = computeWinRateByDeck(records);
    expect(result[0].name).toBe("Unknown Deck");
  });
});

describe("computeWinRateOverTime", () => {
  it("returns empty array for empty input", () => {
    expect(computeWinRateOverTime([])).toEqual([]);
  });

  it("groups by month and sorts chronologically", () => {
    const records = [
      makeRecord({ date: new Date("2025-06-15"), wins: 4, losses: 1, draws: 0 }),
      makeRecord({ date: new Date("2025-07-01"), wins: 2, losses: 2, draws: 0, eventId: "evt-2" }),
      makeRecord({ date: new Date("2025-06-20"), wins: 3, losses: 0, draws: 1, eventId: "evt-3" }),
    ];
    const result = computeWinRateOverTime(records);
    expect(result).toHaveLength(2);
    expect(result[0].month).toBe("2025-06");
    expect(result[1].month).toBe("2025-07");
    // June: 7 wins, 1 loss, 1 draw = 7/9 = 77.8%
    expect(result[0].winRate).toBe(77.8);
    expect(result[0].winRateNoDraws).toBe(87.5); // 7/8
    // July: 2 wins, 2 losses = 2/4 = 50%
    expect(result[1].winRate).toBe(50.0);
    expect(result[1].winRateNoDraws).toBe(50.0);
  });

  it("skips records with null date", () => {
    const records = [
      makeRecord({ date: null, wins: 3, losses: 0, draws: 0 }),
      makeRecord({ date: new Date("2025-06-01"), wins: 2, losses: 1, draws: 0, eventId: "evt-2" }),
    ];
    const result = computeWinRateOverTime(records);
    expect(result).toHaveLength(1);
    expect(result[0].month).toBe("2025-06");
  });
});

describe("computeBreakdownStats", () => {
  it("returns all three breakdowns", () => {
    const records = [makeRecord({ wins: 3, losses: 0, draws: 0 })];
    const result = computeBreakdownStats(records);
    expect(result).toHaveProperty("byStore");
    expect(result).toHaveProperty("byDeck");
    expect(result).toHaveProperty("overTime");
  });

  it("returns empty breakdowns for empty input", () => {
    const result = computeBreakdownStats([]);
    expect(result.byStore).toEqual([]);
    expect(result.byDeck).toEqual([]);
    expect(result.overTime).toEqual([]);
  });
});
