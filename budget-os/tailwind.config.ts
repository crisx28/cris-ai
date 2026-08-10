import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calm, premium neutrals (Linear / Notion / Apple Health feel)
        canvas: "#f8f8f7",
        ink: "#111827",
        subtle: "#6b7280",
        hairline: "#e5e7eb",
        grouped: "#f3f4f6",

        // Semantic
        success: "#22c55e", // green — ONLY for positive financial health
        warning: "#f59e0b",
        danger: "#ef4444",

        // Accent — Apple Action Blue. See .claude/design.md: color usage is
        // Apple's responsibility and Apple specifies exactly ONE interactive
        // accent. `brand` is the alias every component already uses, so the
        // whole app re-skins from this ramp alone. Nothing decorative may be
        // painted in it.
        accent: "#0066cc",
        brand: {
          50: "#f0f6fd",
          100: "#e8f0fa",
          200: "#c8ddf5",
          300: "#8fbdea",
          400: "#3d90db",
          500: "#0066cc", // Action Blue — the single accent
          600: "#005bb5",
          700: "#004f9e",
          800: "#003e7d",
          900: "#002d5c",
        },

        // On-dark link blue, for the rare accent on a dark surface where
        // Action Blue would disappear (apple.md: "Sky Link Blue").
        "accent-on-dark": "#2997ff",

        // Category accents. Purple is deliberately absent — the design
        // authority's Avoid list rules it out.
        ios: {
          blue: "#0066cc",
          green: "#22c55e",
          mint: "#14b8a6",
          teal: "#0ea5e9",
          indigo: "#0066cc",
          pink: "#ec4899",
          red: "#ef4444",
          orange: "#f59e0b",
          yellow: "#eab308",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "18px",
        "4xl": "22px",
        "5xl": "28px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Inter",
          "Segoe UI",
          "Roboto",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,24,39,0.04), 0 1px 3px rgba(17,24,39,0.03)",
        soft: "0 4px 16px rgba(17,24,39,0.05)",
        float: "0 8px 30px rgba(17,24,39,0.10)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "60%": { opacity: "1", transform: "scale(1.01)" },
          "100%": { transform: "scale(1)" },
        },
        "grow-x": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0.9" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "pop-in": "pop-in 0.4s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
