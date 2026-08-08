"use client";

import { useEffect, useState } from "react";
import { Check, Mic } from "lucide-react";
import { parseQuickAdd, ParsedExpense } from "@/lib/parse";
import { CATEGORY_META } from "@/lib/types";
import { peso } from "@/lib/currency";
import { useStore } from "@/lib/store";

const EXAMPLES = [
  "🍔 Lunch 350",
  "🛒 Grocery 1250",
  "⛽ Gas 1000",
  "📚 School 2600",
  "💡 Electricity 5800",
];

export function QuickAdd() {
  const { addExpense } = useStore();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParsedExpense | null>(null);
  const [saved, setSaved] = useState(false);
  const [voiceOK, setVoiceOK] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const w = window as any;
    setVoiceOK(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function onChange(v: string) {
    setText(v);
    setSaved(false);
    setPreview(parseQuickAdd(v));
  }

  function startVoice() {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-PH";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => onChange(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
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
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xl">
          ⚡
        </span>
        <div>
          <h2 className="text-[16px] font-bold text-ink">Quick Add</h2>
          <p className="text-[12px] text-subtle">
            Type it like a text message — we&apos;ll sort it out.
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
        {voiceOK && (
          <button
            type="button"
            onClick={startVoice}
            aria-label="Voice input"
            className={`flex shrink-0 items-center justify-center rounded-2xl border border-hairline px-3 transition active:scale-95 ${
              listening ? "bg-brand-500 text-white" : "bg-white text-brand-600"
            }`}
          >
            <Mic size={18} />
          </button>
        )}
        <button type="submit" className="btn-primary shrink-0" disabled={!preview}>
          Add
        </button>
      </form>
      {listening && (
        <p className="mt-2 text-[12px] text-brand-600">🎙️ Listening… say “Grocery 1250”.</p>
      )}

      {preview && (
        <div className="mt-3 flex animate-pop-in items-center justify-between rounded-2xl bg-grouped px-4 py-3 text-[15px]">
          <span className="flex items-center gap-2">
            <span className="text-xl">{CATEGORY_META[preview.category].emoji}</span>
            <span className="font-medium text-ink">{preview.description}</span>
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
          <span className="font-bold text-ink">{peso(preview.amount)}</span>
        </div>
      )}

      {saved && (
        <div className="mt-3 flex animate-pop-in items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-[15px] font-medium text-brand-600">
          <Check size={16} /> Saved! 🎉
        </div>
      )}

      {!preview && !saved && (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => onChange(ex.replace(/^[^\w]+/, ""))}
              className="chip bg-grouped text-subtle active:scale-95 transition"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
