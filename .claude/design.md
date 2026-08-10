# Design Authority

This file governs all UI work in this repository. It outranks any default
styling instinct and any pattern already present in the codebase — existing
code is not evidence of correctness.

## The Hierarchy

**Information Architecture → Notion.** Structure, navigation, hierarchy,
density, how information is organized and found.

**Visual Design → Apple.** Type, spacing, color, motion, polish, restraint.

When Apple and Notion conflict:

1. Notion decides workflow structure.
2. Apple decides visual presentation.
3. Prefer clarity over decoration.
4. Prefer calm over flashy.
5. Prefer productivity over novelty.

### Notion owns

Sidebar structure · Navigation · Workspace organization · Information
architecture · Page hierarchy · Tables · Planning workflows · Knowledge
organization · Data density · Dashboard layouts · Goal management · Financial
records · Reports

### Apple owns

Typography · Spacing · Motion · Animations · Empty states · Visual hierarchy ·
Accessibility · Color usage · Component polish · Transitions ·
Micro-interactions · Visual calmness

## Primary References

Before any visual work — components, styling, color, type, spacing, layout —
read both reference documents in full. They are the source of truth for tokens
and patterns. Do not style from memory.

- `./design/apple.md` — visual system, token set, restraint rules
- `./design/notion.md` — structural system, surfaces, density patterns

## Product Identity

This is a **Financial Planning Platform**. It is **not** an AI application.

Primary features, in priority order:

1. Financial Calendar
2. Fixed Expenses
3. Recurring Bills
4. Paycheck Allocation
5. Goals
6. Reports
7. Cash Flow Forecasting
8. Motion Integration
9. AI Financial Coach

AI is an assistant. AI is never the primary interface. AI is the last item on
that list and must never occupy the position, prominence, or screen area of the
first eight.

## Financial Product Rules

The application must feel trustworthy, calm, professional, predictable,
family-friendly, and desktop-first.

On first paint, before touching anything AI, a user must immediately understand:

1. Available cash
2. Upcoming obligations
3. Financial calendar
4. Goals
5. Reports

**Desktop-first means desktop-first.** Layouts are designed for a wide viewport
and adapted down — not a phone column centered in an empty desktop window. Use
the available width for real information density (Notion) rather than stacking
single-file cards.

## Resolved Decisions

These resolve conflicts already found in this codebase. They are binding.

- **Accent color is Apple Action Blue `#0066cc`.** Color usage is Apple's
  responsibility, and Apple specifies exactly one interactive accent. The
  current indigo `#6366f1` is neither reference's accent, and its dark siblings
  (`#4f46e5`, `#4338ca`) read as violet — which the Avoid list forbids.
  One accent. Blue. Nothing decorative gets painted in it.
- **No gradients.** Apple's system defines zero gradient tokens; atmosphere
  comes from photography and surface changes. `bg-gradient-*` is prohibited.
- **Icons, not emoji, in chrome.** Navigation, buttons, tabs, section headers
  and status indicators use a real icon set (`lucide-react`, already a
  dependency). Emoji are content, not interface. Notion's sidebar uses icons;
  Apple would never ship emoji as a nav glyph.
- **Tables are the correct primitive for financial records.** Reports,
  transaction lists, fixed-expense registers and obligation lists render as
  tables with aligned numeric columns — not as rounded cards. See
  `ex-data-table-cell` in `notion.md`.
- **Numeric alignment.** All currency and dates are tabular-aligned
  (`font-variant-numeric: tabular-nums`), right-aligned in columns.
- **Radii come down.** Apple's scale tops out at 18px for cards; Notion's at
  12px. The current 22–28px (`rounded-4xl`, `rounded-5xl`) reads consumer-app,
  not professional. Cards use 12px. Inputs use 4–8px, never pill.
- **Motion is subtle and interruptible.** Apple's only micro-interaction is
  `scale(0.95)` on press. Entrance staggers, confetti, and celebratory motion
  do not belong in a financial tool. Every animation must be wrapped in a
  `prefers-reduced-motion: reduce` guard.
- **One shadow discipline.** Elevation is hairline borders and surface-color
  change. No floating, no lift-on-hover, no glassmorphism / `backdrop-blur`
  on chrome.

## Avoid

Do not generate:

- AI chatbot-first layouts
- ChatGPT clones
- Purple gradients
- Crypto or Web3 aesthetics
- Neon colors
- Excessive glassmorphism
- Generic fintech templates
- Floating AI assistants as the primary experience

The interface must not resemble ChatGPT, Claude, Cursor, Perplexity, or an AI
playground. If a screen's dominant element is a chat transcript or a prompt
box, it is wrong.

## Privacy Requirements

Never use real developer names, personal or family names, personal debts,
budgets, goals, travel plans, receipts, or transactions — in code, comments,
seed data, fixtures, tests, or copy.

Use only generic demo personas, generic sample data, and generic financial
examples. Demo personas must be obviously fictional and must not reuse a real
person's surname.

This applies to strings that ship in the client bundle, including migration and
cleanup lists — a hardcoded list of personal terms is itself a disclosure.
