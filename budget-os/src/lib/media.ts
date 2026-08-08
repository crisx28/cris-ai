// Central config for onboarding video + the Learn (Help Center) library.
// Drop in your own YouTube ID or MP4 URL and everything else just works.

export type VideoSource =
  | { type: "youtube"; id: string }
  | { type: "mp4"; url: string }
  | { type: "none" };

// The 60-second product demo shown in the onboarding hero.
// To enable a real video, set e.g. { type: "youtube", id: "dQw4w9WgXcQ" }
// or { type: "mp4", url: "/demo.mp4" }.
export const DEMO_VIDEO: VideoSource = { type: "none" };

export const DEMO_FEATURES = [
  "Track expenses",
  "Scan receipts",
  "Plan meals from your budget",
  "Pay off debt faster",
  "Reach savings goals",
];

export interface Lesson {
  title: string;
  minutes: number;
  text: string;
  video: VideoSource;
}

export interface LessonGroup {
  group: string;
  emoji: string;
  items: Lesson[];
}

export const LEARN: LessonGroup[] = [
  {
    group: "Getting Started",
    emoji: "🎥",
    items: [
      {
        title: "Dashboard Overview",
        minutes: 2,
        text: "Your dashboard answers one question fast: “Am I okay?” The top row shows Available Cash, Income, Expenses and Debt. Daily Safe Spend tells you how much you can spend today. The right panel is your AI Coach.",
        video: { type: "none" },
      },
      {
        title: "Adding Expenses",
        minutes: 2,
        text: "Tap ➕ Add and type it like a text message — e.g. “Grocery 1250”. The app auto-categorizes it. You can also add income, fixed bills, and goals from the same screen.",
        video: { type: "none" },
      },
      {
        title: "Uploading Receipts",
        minutes: 1,
        text: "On the Add screen, tap 📸 Scan a receipt to snap or choose a photo. Confirm the amount and category, and it’s saved with the rest of your spending.",
        video: { type: "none" },
      },
      {
        title: "Using AI Coach",
        minutes: 3,
        text: "Ask real questions: “Which debt should I pay first?”, “Can I afford a ₱30,000 trip in December?”, “How much can I safely spend today?”. The coach answers from your actual numbers.",
        video: { type: "none" },
      },
    ],
  },
  {
    group: "Reports",
    emoji: "📊",
    items: [
      {
        title: "Expense Comparison",
        minutes: 2,
        text: "Reports compares this month vs last — per category, with % change — so you can see exactly what moved.",
        video: { type: "none" },
      },
      {
        title: "Monthly Reviews",
        minutes: 2,
        text: "Download a full Monthly Financial Review as PDF, Excel or CSV — income, expenses, savings, debt, goals and AI recommendations.",
        video: { type: "none" },
      },
      {
        title: "Budget Analysis",
        minutes: 3,
        text: "The payday-cycle view shows your burn rate and how much cash is left before your next paycheck.",
        video: { type: "none" },
      },
    ],
  },
  {
    group: "Goals",
    emoji: "🎯",
    items: [
      {
        title: "Emergency Fund",
        minutes: 2,
        text: "Set a target and the coach tells you how much to save each month and when you’ll reach it.",
        video: { type: "none" },
      },
      {
        title: "Travel Savings",
        minutes: 2,
        text: "Plan a trip, set the date, and get a recommended monthly savings amount. Confetti when you fund it! 🎉",
        video: { type: "none" },
      },
      {
        title: "Debt Payoff",
        minutes: 3,
        text: "Compare Snowball vs Avalanche strategies and see your projected debt-free date.",
        video: { type: "none" },
      },
    ],
  },
];
