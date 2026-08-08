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

        // Accent (indigo) — replaces the old dominant green.
        // `brand` is remapped to indigo so every existing brand-* class
        // becomes the new accent automatically.
        accent: "#6366f1",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },

        // Semantic tokens kept for category accents & links.
        ios: {
          blue: "#6366f1", // links now use the indigo accent
          green: "#22c55e",
          mint: "#14b8a6",
          teal: "#0ea5e9",
          indigo: "#6366f1",
          purple: "#8b5cf6",
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
