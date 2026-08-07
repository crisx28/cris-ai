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
        // iOS system palette
        ink: "#1c1c1e",
        subtle: "#8e8e93",
        hairline: "#e5e5ea",
        grouped: "#f2f2f7",
        ios: {
          blue: "#0a84ff",
          green: "#34c759",
          mint: "#00c7be",
          teal: "#30b0c7",
          indigo: "#5e5ce6",
          purple: "#af52de",
          pink: "#ff2d55",
          red: "#ff3b30",
          orange: "#ff9500",
          yellow: "#ffcc00",
        },
        brand: {
          50: "#e9faf0",
          100: "#c8f2d8",
          200: "#93e6b4",
          300: "#5bd98e",
          400: "#34c759", // iOS green
          500: "#28a745",
          600: "#1f8f3a",
          700: "#1a7331",
          800: "#165c29",
          900: "#124a22",
        },
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "24px",
        "5xl": "28px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.06)",
        float: "0 8px 30px rgba(16,24,40,0.12)",
        press: "inset 0 0 0 1px rgba(0,0,0,0.02)",
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
