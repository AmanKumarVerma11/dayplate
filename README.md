# 🍳 DayPlate — AI Cooking To-Do List

**Live demo:** <https://dayplate.vercel.app>

DayPlate is a smart, dynamic cooking assistant. You describe your day — how many people
you're feeding, your diet, cuisine, budget, and how much time you have — and it generates a
complete, actionable plan in one request:

- **Breakfast / Lunch / Dinner** with descriptions, prep time, and a checkable cooking to-do list
- **A consolidated grocery list** you can tick off as you shop
- **Smart substitutions** to cut cost or handle allergies / missing ingredients
- **Budget feasibility logic** — a deterministic verdict on whether the plan fits your money

---

## Chosen vertical

**A cooking to-do list** (the meal-planning micro-app vertical). The structured meal-planning
flow produces a Breakfast/Lunch/Dinner plan, a grocery list, substitutions, and budget
feasibility logic — exactly the four required outputs.

## Approach & logic

The app splits work between the model and deterministic code, on purpose:

| Concern | Handled by | Why |
|---|---|---|
| Creative meal design, ingredients, steps, cost *estimates*, substitutions | **Google Gemini** (real API call) | Open-ended generation that benefits from a language model |
| **Budget feasibility verdict** | **Our own code** (`lib/budget.ts`) | Money math must be trustworthy and reproducible — never left to a model to "decide" you can afford it |
| **Input validation** | **Our own code** (`lib/validate.ts`) | Security: reject malformed/oversized input server-side before spending model quota |

This is the core of the "logical decision making based on user context" requirement: the model
is *constrained* by the user's context (people, diet, cuisine, budget, time, allergies), and the
final affordability decision is computed by summing the model's per-item cost estimates and
comparing against the budget — producing `comfortable` / `tight` / `over-budget`.

### Real GenAI — no canned data

Every plan is produced by a **live call to Google Gemini** (`gemini-flash-latest`) via the REST
`generateContent` endpoint, using a strict JSON `responseSchema` so output is structured and
reliable. There is **no mock mode, no hardcoded sample plan, no fallback fake data**. If the key
is missing or the model fails, the app surfaces a real error rather than fabricating a result.

## How it works (flow)

```
User fills the form
      │
      ▼
POST /api/plan  ──►  validatePlanRequest()   (reject bad input, 400)
                          │ ok
                          ▼
                     generatePlan()  ──►  Google Gemini (real call, JSON schema)
                          │
                          ▼
                  computeBudgetFeasibility()   (deterministic budget verdict)
                          │
                          ▼
                     JSON response  ──►  React UI renders meals, grocery
                                          checklist, substitutions, budget meter
```

- The **API key lives only on the server** (`GEMINI_API_KEY`); it is never shipped to the browser.
- The grocery list and cooking steps are **interactive checklists** — the actual "to-do list".

## Tech stack

- **Next.js 14 (App Router) + TypeScript** — server API route keeps the key private
- **Tailwind CSS** — accessible, responsive UI
- **Vitest** — unit tests for the deterministic logic
- **Google Gemini API** — the real GenAI call
- **Vercel** — hosting

## Running locally

```bash
npm install
cp .env.example .env.local        # then add your Gemini API key
npm run dev                       # http://localhost:3000
```

Get a **free** Gemini API key at <https://aistudio.google.com/app/apikey>.

### Environment variables

| Name | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (server-only) |
| `GEMINI_MODEL` | — | Override model (default `gemini-flash-latest`) |

## Testing

```bash
npm test        # runs the Vitest suite
```

The suite covers the two pieces of real, deterministic logic:
- **`validate.test.ts`** — accepts good input, trims strings, and rejects bad diet, currency,
  ranges, non-integers, missing cuisine, and oversized notes.
- **`budget.test.ts`** — grocery summation (including defensive handling of negative/NaN costs)
  and the `comfortable` / `tight` / `over-budget` verdict boundaries.

> The Gemini call itself is intentionally *not* mocked in tests — per the challenge rules, the
> live feature must genuinely run end-to-end, which is verified by running the app with a real key.

## No login required

The app is fully open — **no authentication**, so evaluators can use every feature immediately.
The only requirement to exercise the live AI feature is a valid `GEMINI_API_KEY` env var, which
is configured on the deployment.

## Security

- API key is server-side only and git-ignored (`.env*` never committed).
- All user input is validated and bounded server-side before any model call.
- Security headers (CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`) are set in `next.config.mjs`.
- A 30s timeout and structured error handling wrap the model call.

## Accessibility

- Semantic landmarks, a skip link, and labelled form controls.
- Live regions announce loading/errors; alerts use `role="alert"`.
- Visible keyboard focus, `prefers-reduced-motion` support, and an ARIA progress bar for budget.

## Assumptions

- Grocery cost estimates are model-provided approximations for a typical local market; they are
  guidance, not real-time prices. The **feasibility verdict**, however, is computed exactly from
  those estimates.
- "Total cooking time" is the combined time across all three meals for the day.
- Supported currencies are INR, USD, EUR, GBP (easy to extend).
- One day at a time (breakfast, lunch, dinner) — not a multi-day meal prep planner.

## Project structure

```
app/
  api/plan/route.ts   # server route: validate → Gemini → budget → JSON
  page.tsx            # client orchestration + states (loading/error/result)
  layout.tsx          # metadata, skip link
components/
  PlanForm.tsx        # accessible input form
  PlanResult.tsx      # meals, grocery checklist, substitutions, budget meter
lib/
  types.ts            # shared domain contract
  validate.ts (+test) # server-side input validation
  gemini.ts           # the real Gemini call + prompt + JSON schema
  budget.ts   (+test) # deterministic budget feasibility
```
