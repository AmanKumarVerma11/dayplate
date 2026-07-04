import type { Currency, DietType, PlanRequest } from "./types";

/**
 * Input validation for the plan request.
 *
 * This is deliberately hand-rolled (no runtime dependency) and pure, so it is
 * cheap to unit-test and impossible for the client to bypass — the API route
 * runs it server-side before any model call is made. Guarding here protects the
 * upstream model quota from garbage/oversized input (a real security concern).
 */

export const DIETS: DietType[] = [
  "no-preference",
  "vegetarian",
  "vegan",
  "eggetarian",
  "non-vegetarian",
  "pescatarian",
];

export const CURRENCIES: Currency[] = ["INR", "USD", "EUR", "GBP"];

export const LIMITS = {
  people: { min: 1, max: 20 },
  budget: { min: 1, max: 1_000_000 },
  cookingTime: { min: 5, max: 24 * 60 },
  cuisineMax: 60,
  notesMax: 500,
} as const;

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  value?: PlanRequest;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Validate and normalise an untrusted payload into a PlanRequest. */
export function validatePlanRequest(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }

  const raw = input as Record<string, unknown>;

  const people = raw.people;
  if (!isFiniteNumber(people) || !Number.isInteger(people)) {
    errors.push("`people` must be an integer.");
  } else if (people < LIMITS.people.min || people > LIMITS.people.max) {
    errors.push(`\`people\` must be between ${LIMITS.people.min} and ${LIMITS.people.max}.`);
  }

  const diet = raw.diet;
  if (typeof diet !== "string" || !DIETS.includes(diet as DietType)) {
    errors.push("`diet` must be one of: " + DIETS.join(", ") + ".");
  }

  const currency = raw.currency;
  if (typeof currency !== "string" || !CURRENCIES.includes(currency as Currency)) {
    errors.push("`currency` must be one of: " + CURRENCIES.join(", ") + ".");
  }

  const budget = raw.budget;
  if (!isFiniteNumber(budget)) {
    errors.push("`budget` must be a number.");
  } else if (budget < LIMITS.budget.min || budget > LIMITS.budget.max) {
    errors.push(`\`budget\` must be between ${LIMITS.budget.min} and ${LIMITS.budget.max}.`);
  }

  const cookingTimeMinutes = raw.cookingTimeMinutes;
  if (!isFiniteNumber(cookingTimeMinutes) || !Number.isInteger(cookingTimeMinutes)) {
    errors.push("`cookingTimeMinutes` must be an integer.");
  } else if (
    cookingTimeMinutes < LIMITS.cookingTime.min ||
    cookingTimeMinutes > LIMITS.cookingTime.max
  ) {
    errors.push(
      `\`cookingTimeMinutes\` must be between ${LIMITS.cookingTime.min} and ${LIMITS.cookingTime.max}.`
    );
  }

  const cuisineRaw = typeof raw.cuisine === "string" ? raw.cuisine.trim() : "";
  if (cuisineRaw.length === 0) {
    errors.push("`cuisine` is required.");
  } else if (cuisineRaw.length > LIMITS.cuisineMax) {
    errors.push(`\`cuisine\` must be at most ${LIMITS.cuisineMax} characters.`);
  }

  const notesRaw = typeof raw.notes === "string" ? raw.notes.trim() : "";
  if (notesRaw.length > LIMITS.notesMax) {
    errors.push(`\`notes\` must be at most ${LIMITS.notesMax} characters.`);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: [],
    value: {
      people: people as number,
      diet: diet as DietType,
      cuisine: cuisineRaw,
      budget: budget as number,
      currency: currency as Currency,
      cookingTimeMinutes: cookingTimeMinutes as number,
      notes: notesRaw,
    },
  };
}
