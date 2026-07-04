import { describe, expect, it } from "vitest";
import { validatePlanRequest } from "./validate";

const valid = {
  people: 2,
  diet: "vegetarian",
  cuisine: "Indian",
  budget: 600,
  currency: "INR",
  cookingTimeMinutes: 90,
  notes: "no onion or garlic",
};

describe("validatePlanRequest", () => {
  it("accepts a well-formed request and trims strings", () => {
    const res = validatePlanRequest({ ...valid, cuisine: "  Italian  ", notes: "  hi  " });
    expect(res.ok).toBe(true);
    expect(res.value?.cuisine).toBe("Italian");
    expect(res.value?.notes).toBe("hi");
  });

  it("rejects a non-object body", () => {
    expect(validatePlanRequest(null).ok).toBe(false);
    expect(validatePlanRequest("nope").ok).toBe(false);
  });

  it("rejects an unknown diet", () => {
    const res = validatePlanRequest({ ...valid, diet: "carnivore" });
    expect(res.ok).toBe(false);
    expect(res.errors.join(" ")).toMatch(/diet/);
  });

  it("rejects an unsupported currency", () => {
    const res = validatePlanRequest({ ...valid, currency: "JPY" });
    expect(res.ok).toBe(false);
  });

  it("rejects non-integer people and out-of-range values", () => {
    expect(validatePlanRequest({ ...valid, people: 2.5 }).ok).toBe(false);
    expect(validatePlanRequest({ ...valid, people: 0 }).ok).toBe(false);
    expect(validatePlanRequest({ ...valid, people: 999 }).ok).toBe(false);
  });

  it("rejects a missing cuisine", () => {
    const res = validatePlanRequest({ ...valid, cuisine: "   " });
    expect(res.ok).toBe(false);
  });

  it("rejects budgets below the minimum", () => {
    expect(validatePlanRequest({ ...valid, budget: 0 }).ok).toBe(false);
  });

  it("rejects over-long notes", () => {
    const res = validatePlanRequest({ ...valid, notes: "x".repeat(501) });
    expect(res.ok).toBe(false);
  });

  it("collects multiple errors at once", () => {
    const res = validatePlanRequest({ people: -1, diet: "x", budget: "y" });
    expect(res.ok).toBe(false);
    expect(res.errors.length).toBeGreaterThan(1);
  });
});
