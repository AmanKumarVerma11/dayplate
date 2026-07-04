import { NextResponse } from "next/server";
import { validatePlanRequest } from "@/lib/validate";
import { generatePlan, GeminiError } from "@/lib/gemini";
import { computeBudgetFeasibility } from "@/lib/budget";
import type { PlanResponse } from "@/lib/types";

// Run on the Node.js runtime; never cache — every plan is generated live.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow the serverless function enough headroom for the model round-trip.
export const maxDuration = 60;

export async function POST(request: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const validation = validatePlanRequest(payload);
  if (!validation.ok || !validation.value) {
    return NextResponse.json(
      { error: "Invalid input.", details: validation.errors },
      { status: 400 }
    );
  }

  const req = validation.value;

  try {
    const plan = await generatePlan(req);
    const budget = computeBudgetFeasibility(plan.grocery, req.budget, req.currency);

    const response: PlanResponse = {
      request: req,
      plan,
      budget,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: "Unexpected error while generating your plan." },
      { status: 500 }
    );
  }
}
