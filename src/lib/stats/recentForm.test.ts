import { describe, it, expect } from "vitest";
import { computeRecentForm, computeRecentForms } from "./recentForm";
import type { MatchRecord } from "./types";

function makeMatch(result: "WIN" | "LOSS" | "DRAW", index: number): MatchRecord {
  return {
    eventId: `evt-${index}`,
    roundNumber: index,
    opponentName: `Opponent ${index}`,
    result,
    date: new Date(`2025-06-${String(index + 1).padStart(2, "0")}`),
  };
}

describe("computeRecentForm", () => {
  it("returns zeros for empty array", () => {
    const result = computeRecentForm([], 5);
    expect(result.matches).toBe(0);
    expect(result.wins).toBe(0);
    expect(result.losses).toBe(0);
    expect(result.draws).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.winRateNoDraws).toBe(0);
  });

  it("takes only the first N matches (most recent)", () => {
    const matches: MatchRecord[] = [
      makeMatch("WIN", 0),
      makeMatch("WIN", 1),
      makeMatch("LOSS", 2),
      makeMatch("WIN", 3),
      makeMatch("DRAW", 4),
      makeMatch("LOSS", 5),
      makeMatch("WIN", 6),
    ];
    const result = computeRecentForm(matches, 5);
    expect(result.matches).toBe(5);
    expect(result.wins).toBe(3);
    expect(result.losses).toBe(1);
    expect(result.draws).toBe(1);
  });

  it("computes winRate = wins/(wins+losses+draws)", () => {
    const matches: MatchRecord[] = [
      makeMatch("WIN", 0),
      makeMatch("WIN", 1),
      makeMatch("LOSS", 2),
      makeMatch("DRAW", 3),
      makeMatch("WIN", 4),
    ];
    const result = computeRecentForm(matches, 5);
    // 3 wins / 5 total = 60%
    expect(result.winRate).toBe(60.0);
  });

  it("computes winRateNoDraws = wins/(wins+losses)", () => {
    const matches: MatchRecord[] = [
      makeMatch("WIN", 0),
      makeMatch("WIN", 1),
      makeMatch("LOSS", 2),
      makeMatch("DRAW", 3),
      makeMatch("WIN", 4),
    ];
    const result = computeRecentForm(matches, 5);
    // 3 wins / 4 (wins+losses) = 75%
    expect(result.winRateNoDraws).toBe(75.0);
  });

  it("returns 0 winRateNoDraws when only draws", () => {
    const matches: MatchRecord[] = [
      makeMatch("DRAW", 0),
      makeMatch("DRAW", 1),
      makeMatch("DRAW", 2),
    ];
    const result = computeRecentForm(matches, 5);
    expect(result.winRate).toBe(0);
    expect(result.winRateNoDraws).toBe(0);
  });

  it("handles fewer matches than count", () => {
    const matches: MatchRecord[] = [
      makeMatch("WIN", 0),
      makeMatch("LOSS", 1),
    ];
    const result = computeRecentForm(matches, 5);
    expect(result.matches).toBe(2);
    expect(result.wins).toBe(1);
    expect(result.losses).toBe(1);
    expect(result.winRate).toBe(50.0);
  });

  it("handles all wins", () => {
    const matches: MatchRecord[] = [
      makeMatch("WIN", 0),
      makeMatch("WIN", 1),
      makeMatch("WIN", 2),
    ];
    const result = computeRecentForm(matches, 5);
    expect(result.winRate).toBe(100.0);
    expect(result.winRateNoDraws).toBe(100.0);
  });

  it("handles all losses", () => {
    const matches: MatchRecord[] = [
      makeMatch("LOSS", 0),
      makeMatch("LOSS", 1),
      makeMatch("LOSS", 2),
    ];
    const result = computeRecentForm(matches, 5);
    expect(result.winRate).toBe(0);
    expect(result.winRateNoDraws).toBe(0);
  });
});

describe("computeRecentForms", () => {
  it("returns form5 and form10", () => {
    const matches: MatchRecord[] = Array.from({ length: 12 }, (_, i) =>
      makeMatch(i % 2 === 0 ? "WIN" : "LOSS", i)
    );
    const { recentForm5, recentForm10 } = computeRecentForms(matches);
    expect(recentForm5.matches).toBe(5);
    expect(recentForm10.matches).toBe(10);
  });

  it("both return zeros for empty input", () => {
    const { recentForm5, recentForm10 } = computeRecentForms([]);
    expect(recentForm5.matches).toBe(0);
    expect(recentForm10.matches).toBe(0);
  });
});
