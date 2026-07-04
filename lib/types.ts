// Shared domain types for DayPlate.
// These describe the *contract* between the client, the API route, and the model.

export type DietType =
  | "no-preference"
  | "vegetarian"
  | "vegan"
  | "eggetarian"
  | "non-vegetarian"
  | "pescatarian";

export type Currency = "INR" | "USD" | "EUR" | "GBP";

/** What the user tells us about their day. */
export interface PlanRequest {
  people: number;
  diet: DietType;
  cuisine: string;
  budget: number;
  currency: Currency;
  /** Minutes the user can realistically spend cooking across the whole day. */
  cookingTimeMinutes: number;
  /** Free-text: ingredients already at home, appliances, allergies, mood, etc. */
  notes: string;
}

export interface Ingredient {
  name: string;
  quantity: string;
  estimatedCost: number;
}

export interface Meal {
  title: string;
  description: string;
  prepTimeMinutes: number;
  ingredients: Ingredient[];
  steps: string[];
}

export interface GroceryItem {
  name: string;
  quantity: string;
  estimatedCost: number;
}

export interface Substitution {
  ingredient: string;
  alternatives: string[];
  reason: string;
}

/** The raw structured output we ask the model to return. */
export interface ModelPlan {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  grocery: GroceryItem[];
  substitutions: Substitution[];
}

/** Deterministic budget verdict computed in our own code from model costs. */
export interface BudgetFeasibility {
  currency: Currency;
  budget: number;
  estimatedTotal: number;
  remaining: number;
  feasible: boolean;
  utilizationPct: number;
  verdict: "comfortable" | "tight" | "over-budget";
  message: string;
}

/** Full response returned to the client. */
export interface PlanResponse {
  request: PlanRequest;
  plan: ModelPlan;
  budget: BudgetFeasibility;
  generatedAt: string;
}
