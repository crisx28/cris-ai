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
        // Warm, cozy neutrals — soft cream ground + warm ink
        canvas: "#f7f2ea",
        ink: "#3f3a31",
        subtle: "#8c8578",
        hairline: "#e8e0d3",
        grouped: "#f0e9dd",

        // Semantic (warm, softened)
        success: "#6f9350", // sage-green for positive financial health
        warning: "#cf9b3f", // mustard
        danger: "#c37368", // terracotta

        // Accent — Sage. Following the single-accent discipline in
        // .claude/design.md, `brand` remains the ONE interactive accent every
        // component re-skins from; only its hue changes (Action Blue → Sage)
        // for a warmer, more personal feel. Nothing decorative uses it.
        accent: "#82964f",
        brand: {
          50: "#f3f5ec",
          100: "#e6ead6",
          200: "#ccd5ae",
          300: "#b0bd84",
          400: "#97a664",
          500: "#82964f", // Sage — the single accent
          600: "#697b3f",
          700: "#536032",
          800: "#434d2b",
          900: "#394126",
        },

        // On-dark accent, for the rare accent on a dark surface where the
        // sage would disappear.
        "accent-on-dark": "#b0bd84",

        // Blush — soft pink for warmth (travel, gentle highlights).
        blush: {
          50: "#fdf1ef",
          100: "#f9e0dc",
          200: "#f0c4bd",
          300: "#e3a49b",
          400: "#d68b81",
          500: "#c67b71",
        },

        // Category accents — warm, earthy tones (no purple).
        ios: {
          blue: "#82964f",
          green: "#6f9350",
          mint: "#8fb0a2",
          teal: "#7fa8a0",
          indigo: "#82964f",
          pink: "#c98d94",
          red: "#c37368",
          orange: "#cf9b3f",
          yellow: "#d9b53c",
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
