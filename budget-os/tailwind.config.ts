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
        brand: {
          50: "#eef7f2",
          100: "#d6ecdf",
          200: "#aedabf",
          300: "#7fc39a",
          400: "#4fa876",
          500: "#2f8d5b",
          600: "#217048",
          700: "#1b593a",
          800: "#164730",
          900: "#123a28",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
        soft: "0 4px 20px rgba(16,24,40,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
