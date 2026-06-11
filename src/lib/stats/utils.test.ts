import { describe, it, expect } from "vitest";
import { safeWinRate, safeWinRateNoDraws } from "./utils";

describe("safeWinRate", () => {
  it("returns 0 when all values are 0", () => {
    expect(safeWinRate(0, 0, 0)).toBe(0);
  });

  it("computes wins / (wins+losses+draws) * 100", () => {
    expect(safeWinRate(3, 1, 0)).toBe(75.0);
    expect(safeWinRate(1, 1, 1)).toBe(33.3);
    expect(safeWinRate(5, 0, 0)).toBe(100.0);
    expect(safeWinRate(0, 5, 0)).toBe(0);
  });

  it("never returns NaN", () => {
    expect(safeWinRate(0, 0, 0)).not.toBeNaN();
  });
});

describe("safeWinRateNoDraws", () => {
  it("returns 0 when wins and losses are both 0", () => {
    expect(safeWinRateNoDraws(0, 0)).toBe(0);
  });

  it("computes wins / (wins+losses) * 100", () => {
    expect(safeWinRateNoDraws(3, 1)).toBe(75.0);
    expect(safeWinRateNoDraws(1, 1)).toBe(50.0);
    expect(safeWinRateNoDraws(5, 0)).toBe(100.0);
    expect(safeWinRateNoDraws(0, 3)).toBe(0);
  });

  it("never returns NaN", () => {
    expect(safeWinRateNoDraws(0, 0)).not.toBeNaN();
  });
});
