"use client";

import { useState } from "react";
import PlanForm from "@/components/PlanForm";
import PlanResult from "@/components/PlanResult";
import type { PlanRequest, PlanResponse } from "@/lib/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResponse | null>(null);

  async function handleSubmit(req: PlanRequest) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = Array.isArray(data?.details) ? ` (${data.details.join(" ")})` : "";
        throw new Error((data?.error ?? "Something went wrong.") + details);
      }
      setResult(data as PlanResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          🍳 DayPlate
        </h1>
        <p className="mt-2 text-slate-600">
          Your AI cooking to-do list — one request turns your day&apos;s context into a full
          meal plan, grocery list, substitutions, and a budget check.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PlanForm onSubmit={handleSubmit} loading={loading} />
      </section>

      <div aria-live="polite" aria-atomic="true" className="mt-6">
        {loading && (
          <p className="rounded-md bg-brand/10 px-4 py-3 text-brand-dark">
            Cooking up your plan with AI… this usually takes a few seconds.
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-rose-900"
          >
            <strong className="font-semibold">Couldn&apos;t generate a plan.</strong>{" "}
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="mt-8">
          <PlanResult data={result} />
        </div>
      )}

      <footer className="mt-14 border-t border-slate-200 pt-6 text-center text-sm text-slate-400">
        Meals generated live by Google Gemini · Budget math computed deterministically in-app.
      </footer>
    </main>
  );
}
