import type { BudgetFeasibility, Currency, GroceryItem } from "./types";

/**
 * Deterministic budget feasibility.
 *
 * The model proposes meals and per-item grocery costs, but the *verdict* on
 * whether the plan fits the budget is computed here, in code we control and
 * test — not left to the model. This keeps the money math trustworthy and
 * reproducible (no hallucinated "you can afford it").
 */

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export function formatMoney(amount: number, currency: Currency): string {
  const rounded = Math.round(amount * 100) / 100;
  return `${CURRENCY_SYMBOLS[currency]}${rounded.toLocaleString()}`;
}

export function sumGroceryCost(items: GroceryItem[]): number {
  return items.reduce((total, item) => {
    const cost = Number.isFinite(item.estimatedCost) ? item.estimatedCost : 0;
    return total + Math.max(0, cost);
  }, 0);
}

export function computeBudgetFeasibility(
  grocery: GroceryItem[],
  budget: number,
  currency: Currency
): BudgetFeasibility {
  const estimatedTotal = Math.round(sumGroceryCost(grocery) * 100) / 100;
  const remaining = Math.round((budget - estimatedTotal) * 100) / 100;
  const utilizationPct =
    budget > 0 ? Math.round((estimatedTotal / budget) * 100) : 100;

  let verdict: BudgetFeasibility["verdict"];
  let message: string;

  if (estimatedTotal > budget) {
    verdict = "over-budget";
    message = `This plan costs about ${formatMoney(
      estimatedTotal,
      currency
    )}, which is ${formatMoney(
      Math.abs(remaining),
      currency
    )} over your ${formatMoney(budget, currency)} budget. Try the substitutions below to bring it down.`;
  } else if (utilizationPct >= 85) {
    verdict = "tight";
    message = `This plan fits, but it's tight — about ${formatMoney(
      estimatedTotal,
      currency
    )} of your ${formatMoney(budget, currency)} budget (${utilizationPct}%).`;
  } else {
    verdict = "comfortable";
    message = `Comfortably within budget: about ${formatMoney(
      estimatedTotal,
      currency
    )} of ${formatMoney(budget, currency)} (${utilizationPct}%). You have ${formatMoney(
      remaining,
      currency
    )} to spare.`;
  }

  return {
    currency,
    budget,
    estimatedTotal,
    remaining,
    feasible: estimatedTotal <= budget,
    utilizationPct,
    verdict,
    message,
  };
}
