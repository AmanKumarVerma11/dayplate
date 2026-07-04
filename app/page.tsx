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
    <main id="main" className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <header className="mb-10">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-2xl"
          >
            🍳
          </span>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            DayPlate
          </h1>
        </div>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
          Your AI cooking to-do list. One request turns your day into a full meal plan,
          grocery list, smart substitutions, and an honest budget check.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8">
        <PlanForm onSubmit={handleSubmit} loading={loading} />
      </section>

      <div aria-live="polite" aria-atomic="true" className="mt-6">
        {loading && (
          <p className="flex items-center gap-2 rounded-xl bg-accent-soft px-4 py-3 text-accent-dark">
            Cooking up your plan with AI… this usually takes a few seconds.
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-xl border border-danger/40 bg-danger/5 px-4 py-3 text-danger"
          >
            <strong className="font-semibold">Couldn&apos;t generate a plan.</strong> {error}
          </div>
        )}
      </div>

      {result && (
        <div className="mt-10">
          <PlanResult data={result} />
        </div>
      )}

      <footer className="mt-16 border-t border-line pt-6 text-center text-sm text-muted">
        Meals generated live by Google Gemini. Budget math computed deterministically in-app.
      </footer>
    </main>
  );
}
