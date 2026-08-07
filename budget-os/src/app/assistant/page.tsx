"use client";

import { useRef, useState, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { answerQuestion } from "@/lib/assistant";
import { PageHeader } from "@/components/ui";

interface Msg {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Can I afford a China trip next year?",
  "How much did I spend on food this month?",
  "Which debt should I pay first?",
  "How much can I safely spend today?",
  "Am I on track for my emergency fund?",
  "How much did my child cost this month?",
];

export default function AssistantPage() {
  const { data, ready } = useStore();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Kumusta! 👋 I'm your Financial Coach. I read your actual numbers, so I can give you real, personal answers — no judgment, just help. Tap a question below to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  // Phase 9: one tap populates the input so the user can edit before sending.
  function suggest(prompt: string) {
    setInput(prompt);
    inputRef.current?.focus();
  }

  async function ask(question: string) {
    if (!question.trim() || !ready) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setThinking(true);

    // Instant, grounded answer from the local engine.
    let answer = answerQuestion(data, question).text;

    // Try to upgrade via the API route (uses Claude if a key is configured).
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, data }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.answer) answer = json.answer;
      }
    } catch {
      /* offline — keep the local answer */
    }

    setThinking(false);
    setMessages((m) => [...m, { role: "assistant", text: answer }]);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Financial Coach"
        emoji="🤖"
        subtitle="Grounded in your real numbers. Ask me anything about your money."
      />

      <div className="card flex h-[calc(100vh-220px)] min-h-[420px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${
                m.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user"
                    ? "bg-slate-200 text-slate-600"
                    : "bg-brand-600 text-white"
                }`}
              >
                {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
                <Bot size={16} />
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="border-t border-hairline px-5 py-3">
            <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-subtle">
              <Sparkles size={13} /> Tap a question, then send
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => suggest(s)}
                  className="chip bg-brand-50 text-brand-700 transition active:scale-95 hover:bg-brand-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex gap-2 border-t border-hairline p-4"
        >
          <input
            ref={inputRef}
            className="input"
            placeholder="Ask about your budget…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary shrink-0"
            disabled={thinking || !input.trim()}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
