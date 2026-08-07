"use client";

import { useState } from "react";
import { Zap, Check } from "lucide-react";
import { parseQuickAdd, ParsedExpense } from "@/lib/parse";
import { CATEGORY_META } from "@/lib/types";
import { peso } from "@/lib/currency";
import { useStore } from "@/lib/store";

const EXAMPLES = ["Grocery 1250", "School Service 2600", "Electricity 5800", "Jollibee 890"];

export function QuickAdd() {
  const { addExpense } = useStore();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedExpense | null>(null);
  const [saved, setSaved] = useState(false);

  function onChange(v: string) {
    setText(v);
    setSaved(false);
    setPreview(parseQuickAdd(v));
  }

  function save() {
    if (!preview) return;
    addExpense({
      date: new Date().toISOString().slice(0, 10),
      description: preview.description,
      category: preview.category,
      amount: preview.amount,
      notes: "Added via Quick Add",
    });
    setText("");
    setPreview(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Zap size={18} />
        </span>
        <div>
          <h2 className="font-semibold text-slate-900">Quick Add Expense</h2>
          <p className="text-xs text-slate-400">
            Just type it like a text message — we&apos;ll categorize it.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex gap-2"
      >
        <input
          className="input"
          placeholder="e.g. Grocery 1250"
          value={text}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={!preview}>
          Add
        </button>
      </form>

      {preview && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
          <span className="flex items-center gap-2">
            <span>{CATEGORY_META[preview.category].emoji}</span>
            <span className="font-medium text-slate-700">
              {preview.description}
            </span>
            <span
              className="chip"
              style={{
                background: CATEGORY_META[preview.category].color + "22",
                color: CATEGORY_META[preview.category].color,
              }}
            >
              {preview.category}
            </span>
          </span>
          <span className="font-bold text-slate-900">{peso(preview.amount)}</span>
        </div>
      )}

      {saved && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check size={16} /> Saved! 🎉
        </div>
      )}

      {!preview && !saved && (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onChange(ex)}
              className="chip bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
