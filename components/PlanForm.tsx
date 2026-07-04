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
    <form onSubmit={handleSubmit} className="space-y-5" aria-describedby="form-help">
      <p id="form-help" className="text-sm text-slate-600">
        Tell us about your day and we&apos;ll generate a full meal plan, grocery list,
        substitutions, and a budget check.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="people" className="mb-1 block text-sm font-medium">
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
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="diet" className="mb-1 block text-sm font-medium">
            Dietary preference
          </label>
          <select
            id="diet"
            value={diet}
            onChange={(e) => setDiet(e.target.value as DietType)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
          >
            {DIETS.map((d) => (
              <option key={d} value={d}>
                {DIET_LABELS[d]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cuisine" className="mb-1 block text-sm font-medium">
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
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="cookingTime" className="mb-1 block text-sm font-medium">
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
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="budget" className="mb-1 block text-sm font-medium">
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
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="currency" className="mb-1 block text-sm font-medium">
            Currency
          </label>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
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
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Notes <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          maxLength={LIMITS.notesMax}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ingredients you already have, allergies, appliances (e.g. only a microwave), how busy your day is…"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        />
        <p className="mt-1 text-right text-xs text-slate-500">
          {notes.length}/{LIMITS.notesMax}
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-brand px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Planning your day…" : "Generate my meal plan"}
      </button>
    </form>
  );
}
