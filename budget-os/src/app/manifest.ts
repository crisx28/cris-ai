import type { MetadataRoute } from "next";

// Web App Manifest — makes Cris Budget OS installable to the home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cris Budget OS",
    short_name: "Budget OS",
    description:
      "Family money dashboard — income, expenses, debts, savings goals and travel funds, with an AI coach.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f2ea",
    theme_color: "#82964f",
    categories: ["finance", "productivity", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
