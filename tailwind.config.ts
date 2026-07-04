import type { Config } from "tailwindcss";

/*
 * Warm, kitchen-paper palette in OKLCH. No pure black or white — every neutral
 * is tinted toward warm amber so the UI reads as appetising rather than clinical.
 * Accent is a confident paprika/terracotta (not the reflexive tomato-red +
 * basil-green a food app usually defaults to).
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // `<alpha-value>` lets Tailwind's /opacity modifier inject alpha into OKLCH.
        paper: "oklch(0.98 0.008 80 / <alpha-value>)",
        surface: "oklch(0.995 0.004 85 / <alpha-value>)",
        ink: "oklch(0.28 0.02 55 / <alpha-value>)",
        muted: "oklch(0.52 0.02 60 / <alpha-value>)",
        line: "oklch(0.9 0.014 75 / <alpha-value>)",
        accent: {
          DEFAULT: "oklch(0.62 0.16 42 / <alpha-value>)",
          dark: "oklch(0.54 0.15 42 / <alpha-value>)",
          soft: "oklch(0.95 0.03 60 / <alpha-value>)",
        },
        ok: "oklch(0.58 0.1 150 / <alpha-value>)",
        warn: "oklch(0.72 0.13 75 / <alpha-value>)",
        danger: "oklch(0.57 0.16 28 / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 1px 2px oklch(0.5 0.05 60 / 0.04), 0 8px 24px oklch(0.5 0.05 60 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
