import { describe, expect, it } from "vitest";
import { computeBudgetFeasibility, formatMoney, sumGroceryCost } from "./budget";
import type { GroceryItem } from "./types";

const items = (costs: number[]): GroceryItem[] =>
  costs.map((c, i) => ({ name: `item-${i}`, quantity: "1", estimatedCost: c }));

describe("sumGroceryCost", () => {
  it("sums positive costs", () => {
    expect(sumGroceryCost(items([100, 200, 50]))).toBe(350);
  });

  it("ignores negative and non-finite costs defensively", () => {
    const dirty = [
      { name: "a", quantity: "1", estimatedCost: -50 },
      { name: "b", quantity: "1", estimatedCost: NaN as unknown as number },
      { name: "c", quantity: "1", estimatedCost: 100 },
    ];
    expect(sumGroceryCost(dirty)).toBe(100);
  });
});

describe("computeBudgetFeasibility", () => {
  it("marks a cheap plan as comfortable and feasible", () => {
    const b = computeBudgetFeasibility(items([100, 100]), 600, "INR");
    expect(b.feasible).toBe(true);
    expect(b.verdict).toBe("comfortable");
    expect(b.estimatedTotal).toBe(200);
    expect(b.remaining).toBe(400);
    expect(b.utilizationPct).toBe(33);
  });

  it("marks a near-limit plan as tight", () => {
    const b = computeBudgetFeasibility(items([560]), 600, "INR");
    expect(b.feasible).toBe(true);
    expect(b.verdict).toBe("tight");
    expect(b.utilizationPct).toBeGreaterThanOrEqual(85);
  });

  it("marks an expensive plan as over-budget and not feasible", () => {
    const b = computeBudgetFeasibility(items([500, 300]), 600, "INR");
    expect(b.feasible).toBe(false);
    expect(b.verdict).toBe("over-budget");
    expect(b.remaining).toBeLessThan(0);
  });

  it("handles a zero-cost plan without dividing by zero issues", () => {
    const b = computeBudgetFeasibility([], 600, "USD");
    expect(b.estimatedTotal).toBe(0);
    expect(b.feasible).toBe(true);
  });
});

describe("formatMoney", () => {
  it("prefixes the right currency symbol and rounds", () => {
    expect(formatMoney(1234.567, "INR")).toBe("₹1,234.57");
    expect(formatMoney(10, "USD")).toBe("$10");
    expect(formatMoney(5.5, "EUR")).toBe("€5.5");
  });
});
