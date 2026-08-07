# 💚 Cris Budget OS

A **Personal Budget OS for a Filipino household** — income, expenses, debts,
savings goals, travel funds, reports, analytics, and an AI money assistant.
Built with **Next.js + TypeScript + Tailwind CSS + Recharts**, with an
optional **Supabase** backend for login & cloud sync.

> ✨ **It runs the moment you start it.** No accounts, no API keys, no database
> setup. The app opens with realistic Filipino household sample data so you can
> see everything working right away. Cloud login is an optional upgrade.

---

## ⚡ Run it in 60 seconds

```bash
cd budget-os
npm install
npm run dev
```

Open **http://localhost:3000**. That's it — your dashboard is live with sample
data. 🎉

---

## 📱 Install it as a phone app (PWA)

Cris Budget OS is a **Progressive Web App** — it installs to your home screen
with its own icon and opens fullscreen, just like a native app.

- **iPhone (Safari):** open your deployed link → tap **Share** → **Add to Home
  Screen**.
- **Android (Chrome):** open the link → tap the **⋮** menu → **Install app**.

The app works offline too (your data is stored on the device). Icons and the
web manifest live in `public/` and `src/app/manifest.ts`. To regenerate the
icons: `node scripts/make-icons.mjs` (dev-only).

## 🔐 Login

The app opens with a friendly welcome screen:

- **Demo mode (default):** just enter your name and go — data is saved on the
  device. Perfect for showing the app to someone.
- **Email login:** works out of the box for demos; when you configure Supabase
  (below), it becomes **real** secure sign-up / sign-in with per-user data
  isolation. Tap the avatar on the home screen to sign out.

> 💡 New here and want to sell this? Read **[PRESENTING.md](./PRESENTING.md)** —
> a plain-English script for demoing and pricing this for clients.

---

## 🧭 What's inside

| Feature | Where |
|---|---|
| Dashboard (income, expenses, cash, savings rate, debt, travel, health score) | `/` |
| Income tracking | `/income` |
| Expense tracking + filters | `/expenses` |
| Fixed / recurring expenses + bill alerts | `/fixed` |
| Debt tracker (Snowball + Avalanche + debt-free date) | `/debts` |
| Savings goals (progress + required monthly) | `/savings` |
| Travel funds (amount needed + recommended savings) | `/travel` |
| Reports + **PDF export** | `/reports` |
| Analytics (trends, forecast, emergency-fund & retirement calculators) | `/analytics` |
| AI Financial Assistant (chat, grounded in your data) | `/assistant` |
| Quick Add ("Grocery 1250" → auto-categorized) | on Dashboard & Expenses |

---

## 📁 Folder structure

```
budget-os/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx          # app shell + providers
│  │  ├─ page.tsx            # Dashboard
│  │  ├─ income/…            # feature pages
│  │  ├─ expenses/…
│  │  ├─ fixed/…
│  │  ├─ debts/…
│  │  ├─ savings/…
│  │  ├─ travel/…
│  │  ├─ reports/…
│  │  ├─ analytics/…
│  │  ├─ assistant/…
│  │  └─ api/assistant/route.ts   # AI endpoint (engine + optional Claude)
│  ├─ components/            # Shell, cards, charts, QuickAdd, HealthRing
│  └─ lib/
│     ├─ types.ts            # data model + categories
│     ├─ currency.ts         # ₱ (PHP) formatting
│     ├─ finance.ts          # all money math (health score, snowball…)
│     ├─ assistant.ts        # the AI money engine
│     ├─ parse.ts            # quick-add text parser
│     ├─ seed.ts             # realistic PH sample data
│     ├─ store.tsx           # data store (localStorage, seeded)
│     └─ supabase.ts         # optional Supabase client
├─ supabase/
│  ├─ schema.sql             # tables + Row Level Security
│  └─ seed.sql               # optional sample rows for Supabase
├─ .env.example
└─ package.json
```

---

## ☁️ Going live with Supabase (login + cloud sync)

The app works fully without this. Do it when you want your data saved online
and protected behind a login.

1. Create a free project at **https://supabase.com**.
2. Open **SQL Editor → New query**, paste all of `supabase/schema.sql`, and
   **Run**. This creates the tables and turns on Row Level Security (each
   household only sees its own data).
3. In **Settings → API**, copy your **Project URL** and **anon public key**.
4. Copy `.env.example` to `.env.local` and fill them in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
5. In Supabase **Authentication → Providers**, enable **Email**.
6. (Optional) Load sample data: follow the steps at the top of
   `supabase/seed.sql`.

> The data layer lives in one file (`src/lib/store.tsx`). It currently reads and
> writes `localStorage`. To switch to Supabase, replace each `add*/update*/
> delete*` function with the matching Supabase call — the table columns already
> line up with the app's types. `src/lib/supabase.ts` gives you the client and
> `isSupabaseEnabled()`.

---

## 🤖 Smarter AI answers (optional)

The assistant already answers your money questions using a built-in engine that
reads your real numbers — **no key required**. To have **Claude** phrase the
answers even more naturally:

```
ANTHROPIC_API_KEY=sk-ant-...
CRIS_MODEL=claude-sonnet-5
```

Get a key at **https://console.anthropic.com**. Without it, the assistant still
works — it just uses the built-in engine.

---

## 🚀 Deploy to Vercel

1. Push this repo to GitHub (already done if you're reading this there).
2. Go to **https://vercel.com → New Project → Import** your repo.
3. **Important:** set **Root Directory** to `budget-os`.
4. (Optional) Add the environment variables from `.env.example` under
   **Settings → Environment Variables**.
5. Click **Deploy**. Vercel auto-detects Next.js — no other config needed.

Your app will be live at `https://your-project.vercel.app`. 🌏

---

## 🇵🇭 Notes for a Filipino household

- All amounts are formatted in **Philippine pesos (₱)**.
- Categories and sample data reflect real PH life: Meralco, PLDT, Globe,
  palengke, school service, Mama allowance, and more.
- The **health score** rewards a 20%+ savings rate, a 3-month emergency fund,
  a manageable debt load, and steady goal progress.

Built with ❤️ using **Claude Code**.
