// Turns quick-add text like "Grocery 1250" or "School Service 2600"
// into a structured expense with a best-guess category.

import { ExpenseCategory, EXPENSE_CATEGORIES } from "./types";

// Keyword → category hints (Filipino household vocabulary included).
const HINTS: Array<{ words: string[]; category: ExpenseCategory }> = [
  { words: ["grocery", "supermarket", "sm", "puregold", "palengke", "market", "grab groceries"], category: "Grocery" },
  { words: ["food", "jollibee", "mcdo", "lunch", "dinner", "merienda", "kain", "restaurant", "ulam"], category: "Food" },
  { words: ["grab", "transport", "jeep", "bus", "taxi", "gas", "diesel", "fare", "toll", "mrt", "lrt"], category: "Transportation" },
  { words: ["electric", "electricity", "meralco", "water", "maynilad", "utility", "utilities"], category: "Utilities" },
  { words: ["internet", "pldt", "fibr", "converge", "sky", "wifi"], category: "Internet" },
  { words: ["mobile", "globe", "smart", "load", "postpaid", "prepaid", "sim"], category: "Mobile" },
  { words: ["rent", "apartment", "condo", "boarding", "upa"], category: "Rent" },
  { words: ["school", "tuition", "supplies", "book", "uniform", "matricula"], category: "School" },
  { words: ["school service", "child", "kid", "baby", "diaper", "milk", "gatas", "allowance kid"], category: "Child Expenses" },
  { words: ["debt", "loan", "credit card", "installment", "utang", "payment card"], category: "Debt Payment" },
  { words: ["medicine", "hospital", "doctor", "mercury", "health", "gamot", "clinic", "dental"], category: "Healthcare" },
  { words: ["netflix", "spotify", "movie", "game", "entertainment", "cinema", "concert"], category: "Entertainment" },
  { words: ["travel", "flight", "hotel", "trip", "fund", "vacation"], category: "Travel" },
];

export interface ParsedExpense {
  description: string;
  category: ExpenseCategory;
  amount: number;
  confident: boolean;
}

// Pull the first sensible number out of the text (supports "1,250" and "1.2k").
function extractAmount(text: string): number | null {
  const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
  const cleaned = text.replace(/,/g, "");
  const m = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return parseFloat(m[1]);
}

export function parseQuickAdd(input: string): ParsedExpense | null {
  const text = input.trim();
  if (!text) return null;
  const amount = extractAmount(text);
  if (amount === null || amount <= 0) return null;

  const lower = text.toLowerCase();

  // Prefer the most specific (longest) matching keyword.
  let best: { category: ExpenseCategory; len: number } | null = null;
  for (const hint of HINTS) {
    for (const w of hint.words) {
      if (lower.includes(w) && (!best || w.length > best.len)) {
        best = { category: hint.category, len: w.length };
      }
    }
  }

  // Description = the text minus the amount token, tidied up.
  const description =
    text
      .replace(/₱/g, "")
      .replace(/(\d+(?:\.\d+)?)\s*k\b/i, "")
      .replace(/[\d,]+(?:\.\d+)?/g, "")
      .replace(/\s+/g, " ")
      .trim() || (best ? best.category : "Expense");

  return {
    description: description.charAt(0).toUpperCase() + description.slice(1),
    category: best?.category ?? "Miscellaneous",
    amount,
    confident: best !== null,
  };
}

export { EXPENSE_CATEGORIES };
