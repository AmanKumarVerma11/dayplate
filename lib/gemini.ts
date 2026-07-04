import type { ModelPlan, PlanRequest } from "./types";

/**
 * Real Google Gemini call.
 *
 * We use the REST `generateContent` endpoint with a strict `responseSchema` so
 * the model returns machine-readable JSON (not prose we'd have to scrape). The
 * API key is read from the server-only env var and is never sent to the client.
 */

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

// JSON schema handed to Gemini so structured output matches ModelPlan.
const responseSchema = {
  type: "object",
  properties: {
    breakfast: mealSchema(),
    lunch: mealSchema(),
    dinner: mealSchema(),
    grocery: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "string" },
          estimatedCost: { type: "number" },
        },
        required: ["name", "quantity", "estimatedCost"],
      },
    },
    substitutions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ingredient: { type: "string" },
          alternatives: { type: "array", items: { type: "string" } },
          reason: { type: "string" },
        },
        required: ["ingredient", "alternatives", "reason"],
      },
    },
  },
  required: ["breakfast", "lunch", "dinner", "grocery", "substitutions"],
} as const;

function mealSchema() {
  return {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      prepTimeMinutes: { type: "number" },
      ingredients: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            quantity: { type: "string" },
            estimatedCost: { type: "number" },
          },
          required: ["name", "quantity", "estimatedCost"],
        },
      },
      steps: { type: "array", items: { type: "string" } },
    },
    required: ["title", "description", "prepTimeMinutes", "ingredients", "steps"],
  };
}

export function buildPrompt(req: PlanRequest): string {
  return [
    "You are a practical home-cooking planner. Plan a full day of meals for a real household.",
    "",
    "Context for the day:",
    `- People to feed: ${req.people}`,
    `- Dietary preference: ${req.diet}`,
    `- Preferred cuisine: ${req.cuisine}`,
    `- Total food budget for the day: ${req.budget} ${req.currency}`,
    `- Total cooking time available across the whole day: ${req.cookingTimeMinutes} minutes`,
    req.notes ? `- Extra notes (ingredients on hand, allergies, appliances, mood): ${req.notes}` : "- Extra notes: none",
    "",
    "Requirements:",
    "1. Design breakfast, lunch, and dinner that respect the dietary preference and cuisine.",
    "2. Keep the SUM of all prepTimeMinutes at or below the available cooking time.",
    `3. Estimate realistic per-item grocery costs in ${req.currency} for the local market so the`,
    `   total grocery cost stays at or below ${req.budget} ${req.currency}. Be honest — do not`,
    "   fudge numbers to fit; if it cannot fit, cost it accurately and rely on substitutions.",
    "4. Provide a consolidated grocery list (aggregate duplicate ingredients across meals).",
    "5. Provide practical substitutions to cut cost or handle allergies/unavailable items.",
    "6. If any notes mention allergies, strictly avoid those ingredients.",
    "",
    "Return ONLY structured JSON that matches the provided schema.",
  ].join("\n");
}

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

export async function generatePlan(req: PlanRequest): Promise<ModelPlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError(
      "Server is missing GEMINI_API_KEY. Set it as an environment variable.",
      500
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  const body = {
    contents: [{ role: "user", parts: [{ text: buildPrompt(req) }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema,
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw new GeminiError(
      err instanceof Error && err.name === "AbortError"
        ? "The model took too long to respond. Please try again."
        : "Could not reach the model service.",
      504
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GeminiError(
      `Model request failed (${res.status}). ${detail.slice(0, 300)}`,
      502
    );
  }

  const data = (await res.json()) as GeminiApiResponse;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new GeminiError(
      blockReason
        ? `The request was blocked by the model (${blockReason}). Try rephrasing your notes.`
        : "The model returned an empty response.",
      502
    );
  }

  let parsed: ModelPlan;
  try {
    parsed = JSON.parse(text) as ModelPlan;
  } catch {
    throw new GeminiError("The model returned malformed JSON.", 502);
  }

  return parsed;
}

interface GeminiApiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  promptFeedback?: { blockReason?: string };
}
