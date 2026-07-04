"use client";

import { useState } from "react";
import type { BudgetFeasibility, Meal, PlanResponse } from "@/lib/types";
import { formatMoney } from "@/lib/budget";

const VERDICT_STYLES: Record<BudgetFeasibility["verdict"], string> = {
  comfortable: "bg-emerald-50 border-emerald-300 text-emerald-900",
  tight: "bg-amber-50 border-amber-300 text-amber-900",
  "over-budget": "bg-rose-50 border-rose-300 text-rose-900",
};

const VERDICT_BAR: Record<BudgetFeasibility["verdict"], string> = {
  comfortable: "bg-emerald-500",
  tight: "bg-amber-500",
  "over-budget": "bg-rose-500",
};

export default function PlanResult({ data }: { data: PlanResponse }) {
  const { plan, budget, request } = data;
  return (
    <div className="space-y-8">
      <BudgetMeter budget={budget} />

      <section aria-labelledby="meals-heading" className="space-y-5">
        <h2 id="meals-heading" className="text-xl font-bold">
          Your meals
        </h2>
        <MealCard label="Breakfast" meal={plan.breakfast} currency={request.currency} />
        <MealCard label="Lunch" meal={plan.lunch} currency={request.currency} />
        <MealCard label="Dinner" meal={plan.dinner} currency={request.currency} />
      </section>

      <GroceryList items={data.plan.grocery} currency={request.currency} />

      {plan.substitutions.length > 0 && (
        <section aria-labelledby="subs-heading" className="space-y-3">
          <h2 id="subs-heading" className="text-xl font-bold">
            Smart substitutions
          </h2>
          <ul className="space-y-3">
            {plan.substitutions.map((s, i) => (
              <li key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-semibold">
                  {s.ingredient} →{" "}
                  <span className="font-normal">{s.alternatives.join(", ")}</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">{s.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function BudgetMeter({ budget }: { budget: BudgetFeasibility }) {
  const width = Math.min(100, Math.max(2, budget.utilizationPct));
  return (
    <section
      aria-labelledby="budget-heading"
      className={`rounded-xl border p-5 ${VERDICT_STYLES[budget.verdict]}`}
    >
      <h2 id="budget-heading" className="text-lg font-bold">
        Budget check: {budget.feasible ? "fits your budget" : "over budget"}
      </h2>
      <p className="mt-1 text-sm">{budget.message}</p>
      <div
        className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/60"
        role="progressbar"
        aria-valuenow={budget.utilizationPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Budget utilisation"
      >
        <div
          className={`h-full ${VERDICT_BAR[budget.verdict]}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium">
        <span>Estimated: {formatMoney(budget.estimatedTotal, budget.currency)}</span>
        <span>Budget: {formatMoney(budget.budget, budget.currency)}</span>
      </div>
    </section>
  );
}

function MealCard({
  label,
  meal,
  currency,
}: {
  label: string;
  meal: Meal;
  currency: PlanResponse["request"]["currency"];
}) {
  const [done, setDone] = useState<boolean[]>(() => meal.steps.map(() => false));

  function toggle(i: number) {
    setDone((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  const mealCost = meal.ingredients.reduce((t, ing) => t + (ing.estimatedCost || 0), 0);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold">
          <span className="text-brand">{label}:</span> {meal.title}
        </h3>
        <p className="text-sm text-slate-500">
          {meal.prepTimeMinutes} min · ~{formatMoney(mealCost, currency)}
        </p>
      </header>
      <p className="mt-1 text-sm text-slate-600">{meal.description}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Ingredients
          </h4>
          <ul className="space-y-1 text-sm">
            {meal.ingredients.map((ing, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>
                  {ing.name} <span className="text-slate-400">({ing.quantity})</span>
                </span>
                <span className="tabular-nums text-slate-500">
                  {formatMoney(ing.estimatedCost, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Cooking to-do
          </h4>
          <ul className="space-y-1.5 text-sm">
            {meal.steps.map((step, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    checked={done[i]}
                    onChange={() => toggle(i)}
                    className="mt-1 h-4 w-4 shrink-0 accent-brand"
                  />
                  <span className={done[i] ? "text-slate-400 line-through" : ""}>{step}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function GroceryList({
  items,
  currency,
}: {
  items: PlanResponse["plan"]["grocery"];
  currency: PlanResponse["request"]["currency"];
}) {
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const remaining = checked.filter((c) => !c).length;

  return (
    <section aria-labelledby="grocery-heading" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 id="grocery-heading" className="text-xl font-bold">
          Grocery list
        </h2>
        <p className="text-sm text-slate-500" aria-live="polite">
          {remaining} of {items.length} left
        </p>
      </div>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5">
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() =>
                    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
                  }
                  className="h-4 w-4 accent-brand"
                />
                <span className={checked[i] ? "text-slate-400 line-through" : ""}>
                  {item.name} <span className="text-slate-400">({item.quantity})</span>
                </span>
              </span>
              <span className="tabular-nums text-sm text-slate-500">
                {formatMoney(item.estimatedCost, currency)}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
