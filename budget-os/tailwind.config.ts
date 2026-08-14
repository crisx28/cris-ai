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
        // Youthful pastel neutrals — soft blush-cream ground + gentle ink
        canvas: "#fcf6f5",
        ink: "#4a4551",
        subtle: "#9a8f98",
        hairline: "#f0e4ea",
        grouped: "#f8eef2",

        // Semantic (soft pastels, still readable)
        success: "#5fb08a", // pastel mint-green for positive health
        warning: "#e3ac52", // soft butter
        danger: "#e17b84", // soft coral

        // Accent — pastel Rose. Following the single-accent discipline in
        // .claude/design.md, `brand` remains the ONE interactive accent every
        // component re-skins from; only its hue changes for a youthful,
        // playful pastel feel. Nothing decorative uses it.
        accent: "#dd6f92",
        brand: {
          50: "#fdf2f6",
          100: "#fbe3ec",
          200: "#f6c4d6",
          300: "#ef9fbb",
          400: "#e781a3",
          500: "#dd6f92", // pastel Rose — the single accent
          600: "#c8577c",
          700: "#a84667",
          800: "#8a3a55",
          900: "#723147",
        },

        // On-dark accent, for the rare accent on a dark surface.
        "accent-on-dark": "#f6c4d6",

        // Sky — pastel baby-blue secondary (travel, gentle highlights).
        sky: {
          50: "#eff8fb",
          100: "#dceff5",
          200: "#bce0ec",
          300: "#93cce0",
          400: "#66b4d3",
          500: "#4fa3c6",
        },

        // Blush — extra-soft pink tint.
        blush: {
          50: "#fdf2f5",
          100: "#fbe3ec",
          200: "#f6c4d6",
          300: "#ef9fbb",
          400: "#e781a3",
          500: "#dd6f92",
        },

        // Category accents — soft candy pastels.
        ios: {
          blue: "#dd6f92",
          green: "#5fb08a",
          mint: "#7fc7be",
          teal: "#5fb3c9",
          indigo: "#dd6f92",
          pink: "#ef9db4",
          red: "#e17b84",
          orange: "#e3ac52",
          yellow: "#e8c65e",
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
