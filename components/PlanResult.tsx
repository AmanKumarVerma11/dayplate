"use client";

import { useState } from "react";
import type { BudgetFeasibility, Meal, PlanResponse } from "@/lib/types";
import { formatMoney } from "@/lib/budget";

const VERDICT: Record<
  BudgetFeasibility["verdict"],
  { panel: string; bar: string; label: string }
> = {
  comfortable: {
    panel: "border-ok/30 bg-ok/5 text-ok",
    bar: "bg-ok",
    label: "Comfortably within budget",
  },
  tight: {
    panel: "border-warn/40 bg-warn/10 text-[oklch(0.45_0.09_75)]",
    bar: "bg-warn",
    label: "Fits, but tight",
  },
  "over-budget": {
    panel: "border-danger/30 bg-danger/5 text-danger",
    bar: "bg-danger",
    label: "Over budget",
  },
};

const MEALS = [
  { key: "breakfast", label: "Breakfast", icon: "🌅" },
  { key: "lunch", label: "Lunch", icon: "☀️" },
  { key: "dinner", label: "Dinner", icon: "🌙" },
] as const;

export default function PlanResult({ data }: { data: PlanResponse }) {
  const { plan, budget, request } = data;
  return (
    <div className="space-y-10">
      <BudgetMeter budget={budget} />

      <section aria-labelledby="meals-heading" className="space-y-5">
        <h2 id="meals-heading" className="font-serif text-2xl font-semibold text-ink">
          Your meals
        </h2>
        <div className="space-y-4">
          {MEALS.map(({ key, label, icon }) => (
            <MealCard
              key={key}
              label={label}
              icon={icon}
              meal={plan[key]}
              currency={request.currency}
            />
          ))}
        </div>
      </section>

      <GroceryList items={plan.grocery} currency={request.currency} />

      {plan.substitutions.length > 0 && (
        <section aria-labelledby="subs-heading" className="space-y-4">
          <h2 id="subs-heading" className="font-serif text-2xl font-semibold text-ink">
            Smart substitutions
          </h2>
          <ul className="space-y-3">
            {plan.substitutions.map((s, i) => (
              <li key={i} className="rounded-xl border border-line bg-surface p-4">
                <p className="font-medium text-ink">
                  {s.ingredient}{" "}
                  <span className="text-accent" aria-hidden>
                    →
                  </span>{" "}
                  <span className="font-normal text-ink">{s.alternatives.join(", ")}</span>
                </p>
                <p className="mt-1 text-sm text-muted">{s.reason}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function BudgetMeter({ budget }: { budget: BudgetFeasibility }) {
  const style = VERDICT[budget.verdict];
  const width = Math.min(100, Math.max(3, budget.utilizationPct));
  return (
    <section
      aria-labelledby="budget-heading"
      className={`rounded-2xl border p-5 ${style.panel}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="budget-heading" className="text-base font-semibold">
          {style.label}
        </h2>
        <span className="text-sm font-medium tabular-nums">{budget.utilizationPct}% used</span>
      </div>
      <p className="mt-1.5 text-sm opacity-90">{budget.message}</p>
      <div
        className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuenow={budget.utilizationPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Budget utilisation"
      >
        <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${width}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium opacity-80">
        <span>Estimated {formatMoney(budget.estimatedTotal, budget.currency)}</span>
        <span>Budget {formatMoney(budget.budget, budget.currency)}</span>
      </div>
    </section>
  );
}

function MealCard({
  label,
  icon,
  meal,
  currency,
}: {
  label: string;
  icon: string;
  meal: Meal;
  currency: PlanResponse["request"]["currency"];
}) {
  const [done, setDone] = useState<boolean[]>(() => meal.steps.map(() => false));
  const mealCost = meal.ingredients.reduce((t, ing) => t + (ing.estimatedCost || 0), 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface shadow-soft">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-line px-5 py-4">
        <div className="flex items-baseline gap-2.5">
          <span aria-hidden className="text-xl">
            {icon}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {label}
            </p>
            <h3 className="font-serif text-xl font-semibold text-ink">{meal.title}</h3>
          </div>
        </div>
        <p className="text-sm text-muted">
          {meal.prepTimeMinutes} min · ~{formatMoney(mealCost, currency)}
        </p>
      </header>

      <div className="px-5 py-4">
        <p className="text-sm text-muted">{meal.description}</p>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Ingredients
            </h4>
            <ul className="space-y-1.5 text-sm">
              {meal.ingredients.map((ing, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="text-ink">
                    {ing.name} <span className="text-muted">({ing.quantity})</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {formatMoney(ing.estimatedCost, currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Cooking to-do
            </h4>
            <ul className="space-y-2 text-sm">
              {meal.steps.map((step, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={done[i]}
                      onChange={() =>
                        setDone((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 accent-accent"
                    />
                    <span className={done[i] ? "text-muted line-through" : "text-ink"}>
                      {step}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
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
    <section aria-labelledby="grocery-heading" className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 id="grocery-heading" className="font-serif text-2xl font-semibold text-ink">
          Grocery list
        </h2>
        <p className="text-sm text-muted" aria-live="polite">
          {remaining} of {items.length} left
        </p>
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {items.map((item, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent-soft/40">
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked[i]}
                  onChange={() =>
                    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
                  }
                  className="h-4 w-4 accent-accent"
                />
                <span className={checked[i] ? "text-muted line-through" : "text-ink"}>
                  {item.name} <span className="text-muted">({item.quantity})</span>
                </span>
              </span>
              <span className="shrink-0 tabular-nums text-sm text-muted">
                {formatMoney(item.estimatedCost, currency)}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
