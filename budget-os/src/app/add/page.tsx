"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Camera, Check } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { QuickAdd } from "@/components/QuickAdd";
import { useStore } from "@/lib/store";
import { EXPENSE_CATEGORIES, ExpenseCategory, CATEGORY_META } from "@/lib/types";
import { peso } from "@/lib/currency";

const SHORTCUTS = [
  { href: "/income", emoji: "💵", label: "Add Income", hint: "Salary, freelance…" },
  { href: "/savings", emoji: "🎯", label: "Add to Goal", hint: "Grow your savings" },
  { href: "/travel", emoji: "✈️", label: "Travel Fund", hint: "Save for a trip" },
  { href: "/debts", emoji: "💳", label: "Add Debt", hint: "Track a balance" },
  { href: "/fixed", emoji: "🔁", label: "Fixed Bill", hint: "Recurring monthly" },
  { href: "/expenses", emoji: "💸", label: "All Expenses", hint: "Detailed entry" },
];

export default function AddPage() {
  return (
    <Suspense fallback={null}>
      <AddInner />
    </Suspense>
  );
}

function AddInner() {
  const params = useSearchParams();
  const autoReceipt = params.get("receipt") === "1";

  return (
    <div className="space-y-5">
      <PageHeader title="Add" emoji="➕" subtitle="Log it in seconds." />

      <ReceiptCapture autoOpen={autoReceipt} />

      <QuickAdd />

      {/* Quick Add education */}
      <div className="card p-5">
        <p className="text-[15px] font-semibold text-ink">
          ✨ Simply type: <span className="text-brand-600">Description + Amount</span>
        </p>
        <p className="mt-1 text-[13px] text-subtle">
          Your AI Coach automatically categorizes every transaction — no menus.
        </p>
        <div className="mt-3 space-y-1.5">
          {["🍔 Jollibee 350", "🛒 Grocery 1200", "📚 School 2600", "💡 Electricity 5800", "⛽ Gas 1000"].map(
            (ex) => (
              <div key={ex} className="rounded-2xl bg-grouped px-4 py-2.5 text-[15px] text-ink">
                {ex}
              </div>
            )
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="section-title">Or add manually</p>
        <div className="grid grid-cols-2 gap-3">
          {SHORTCUTS.map((s) => (
            <Link key={s.href} href={s.href}>
              <div className="card-pressable flex items-center gap-3 p-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-grouped text-2xl">
                  {s.emoji}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-ink">{s.label}</p>
                  <p className="text-[12px] text-subtle">{s.hint}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReceiptCapture({ autoOpen }: { autoOpen: boolean }) {
  const { addExpense } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [img, setImg] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("Receipt");
  const [cat, setCat] = useState<ExpenseCategory>("Grocery");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (autoOpen) fileRef.current?.click();
  }, [autoOpen]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setImg(reader.result as string);
    reader.readAsDataURL(f);
    setSaved(false);
  }

  function save() {
    const a = parseFloat(amount);
    if (!a || a <= 0) return;
    addExpense({
      date: new Date().toISOString().slice(0, 10),
      description: desc.trim() || "Receipt",
      category: cat,
      amount: a,
      notes: "From receipt",
    });
    setImg(null);
    setAmount("");
    setDesc("Receipt");
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Camera size={18} />
        </span>
        <div>
          <h2 className="text-[16px] font-bold text-ink">Scan a Receipt</h2>
          <p className="text-[12px] text-subtle">Snap a photo, confirm the amount, done.</p>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        className="hidden"
      />

      {!img ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-hairline bg-grouped py-8 text-subtle transition hover:border-brand-300 active:scale-[0.99]"
        >
          <Camera size={28} className="text-brand-500" />
          <span className="text-[14px] font-medium text-ink">Take or choose a photo</span>
          <span className="text-[12px]">JPG or PNG</span>
        </button>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="Receipt preview" className="max-h-48 w-full rounded-2xl object-cover" />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input"
              placeholder="Description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <input
              className="input"
              type="number"
              inputMode="decimal"
              placeholder="Amount ₱"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <select className="input" value={cat} onChange={(e) => setCat(e.target.value as ExpenseCategory)}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c}>
                {CATEGORY_META[c].emoji} {c}
              </option>
            ))}
          </select>
          <button className="btn-primary w-full" onClick={save} disabled={!amount}>
            Save {amount ? peso(parseFloat(amount) || 0) : "expense"}
          </button>
        </div>
      )}

      {saved && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-[15px] font-medium text-brand-600">
          <Check size={16} /> Receipt saved! 🎉
        </div>
      )}
    </div>
  );
}
