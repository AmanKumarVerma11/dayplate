"use client";

import { useState } from "react";
import type { Currency, DietType, PlanRequest } from "@/lib/types";
import { CURRENCIES, DIETS, LIMITS } from "@/lib/validate";

const DIET_LABELS: Record<DietType, string> = {
  "no-preference": "No preference",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian",
  "non-vegetarian": "Non-vegetarian",
  pescatarian: "Pescatarian",
};

const fieldBase =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-ink shadow-sm transition-colors placeholder:text-muted focus:border-accent focus:outline-none";
const labelBase = "mb-1.5 block text-sm font-medium text-ink";

interface Props {
  onSubmit: (req: PlanRequest) => void;
  loading: boolean;
}

export default function PlanForm({ onSubmit, loading }: Props) {
  const [people, setPeople] = useState(2);
  const [diet, setDiet] = useState<DietType>("no-preference");
  const [cuisine, setCuisine] = useState("Indian");
  const [budget, setBudget] = useState(600);
  const [currency, setCurrency] = useState<Currency>("INR");
  const [cookingTimeMinutes, setCookingTimeMinutes] = useState(90);
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    onSubmit({ people, diet, cuisine, budget, currency, cookingTimeMinutes, notes });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-describedby="form-help">
      <p id="form-help" className="text-sm text-muted">
        Tell us about your day and we&apos;ll generate a full meal plan, grocery list,
        substitutions, and a budget check.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="people" className={labelBase}>
            People to feed
          </label>
          <input
            id="people"
            type="number"
            inputMode="numeric"
            min={LIMITS.people.min}
            max={LIMITS.people.max}
            required
            value={people}
            onChange={(e) => setPeople(Number(e.target.value))}
            className={fieldBase}
          />
        </div>

        <div>
          <label htmlFor="diet" className={labelBase}>
            Dietary preference
          </label>
          <select
            id="diet"
            value={diet}
            onChange={(e) => setDiet(e.target.value as DietType)}
            className={fieldBase}
          >
            {DIETS.map((d) => (
              <option key={d} value={d}>
                {DIET_LABELS[d]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cuisine" className={labelBase}>
            Preferred cuisine
          </label>
          <input
            id="cuisine"
            type="text"
            required
            maxLength={LIMITS.cuisineMax}
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="e.g. Indian, Italian, Thai"
            className={fieldBase}
          />
        </div>

        <div>
          <label htmlFor="cookingTime" className={labelBase}>
            Total cooking time (minutes)
          </label>
          <input
            id="cookingTime"
            type="number"
            inputMode="numeric"
            min={LIMITS.cookingTime.min}
            max={LIMITS.cookingTime.max}
            required
            value={cookingTimeMinutes}
            onChange={(e) => setCookingTimeMinutes(Number(e.target.value))}
            className={fieldBase}
          />
        </div>

        <div>
          <label htmlFor="budget" className={labelBase}>
            Budget for the day
          </label>
          <input
            id="budget"
            type="number"
            inputMode="decimal"
            min={LIMITS.budget.min}
            max={LIMITS.budget.max}
            required
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className={fieldBase}
          />
        </div>

        <div>
          <label htmlFor="currency" className={labelBase}>
            Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className={fieldBase}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelBase}>
          Notes <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          maxLength={LIMITS.notesMax}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ingredients you already have, allergies, appliances (e.g. only a microwave), how busy your day is…"
          className={`${fieldBase} resize-y`}
        />
        <p className="mt-1 text-right text-xs text-muted">
          {notes.length}/{LIMITS.notesMax}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-white shadow-soft transition-all hover:bg-accent-dark active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? (
          <>
            <Spinner /> Planning your day…
          </>
        ) : (
          <>Generate my meal plan</>
        )}
      </button>
    </form>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  );
}
