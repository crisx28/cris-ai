"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useWorkspace } from "@/lib/workspace";
import { ModeChoice } from "@/components/ModeChoice";

// Gates the app: sign in → choose Start Fresh / Demo → app.
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, signedIn } = useAuth();
  const { ready: storeReady, mode } = useStore();

  if (!ready || !storeReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-2xl bg-brand-500" />
      </div>
    );
  }

  if (!signedIn) return <LoginScreen />;
  if (mode === null) return <ModeChoice />; // first launch: pick a starting point
  return <>{children}</>;
}

function LoginScreen() {
  const { signInDemo, signInWithEmail, supabaseEnabled } = useAuth();
  const { name: appName } = useWorkspace();
  const [mode, setMode] = useState<"welcome" | "email">("welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!email || !password) return setErr("Please enter your email and password.");
    setBusy(true);
    const { error } = await signInWithEmail(
      email,
      password,
      isSignup ? "signup" : "signin"
    );
    setBusy(false);
    if (error) setErr(error);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-[380px] animate-fade-up">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[16px] bg-brand-500 text-4xl font-semibold text-white">
            ₱
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-ink">
            {appName}
          </h1>
          <p className="mt-1 text-[15px] text-subtle">
            Your family money, in control. 💚
          </p>
        </div>

        {mode === "welcome" && (
          <div className="space-y-3">
            <div className="card p-5">
              <label className="label">👋 What should we call you?</label>
              <input
                className="input"
                placeholder="Your first name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && signInDemo(name)}
              />
              <button
                className="btn-primary mt-3 w-full"
                onClick={() => signInDemo(name)}
                disabled={!name.trim()}
              >
                Get Started →
              </button>
            </div>

            <button
              className="w-full rounded-2xl bg-white py-3 text-[15px] font-semibold text-ios-blue shadow-card transition active:scale-[0.98]"
              onClick={() => setMode("email")}
            >
              📧 Continue with email
            </button>

            <button
              className="w-full py-2 text-[14px] font-medium text-subtle"
              onClick={() => signInDemo("")}
            >
              Skip — explore the demo
            </button>

            <p className="px-2 pt-2 text-center text-[12px] leading-relaxed text-subtle">
              Demo mode saves data on this device. Sign in with email for cloud
              sync across devices.
            </p>
          </div>
        )}

        {mode === "email" && (
          <form onSubmit={submitEmail} className="card space-y-3 p-5">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {err && (
              <p className="rounded-xl bg-ios-red/10 px-3 py-2 text-[13px] text-ios-red">
                {err}
              </p>
            )}
            <button className="btn-primary w-full" type="submit" disabled={busy}>
              {busy ? "Please wait…" : isSignup ? "Create Account" : "Sign In"}
            </button>
            <button
              type="button"
              className="w-full text-center text-[14px] font-medium text-ios-blue"
              onClick={() => setIsSignup((s) => !s)}
            >
              {isSignup
                ? "Already have an account? Sign in"
                : "New here? Create an account"}
            </button>
            {!supabaseEnabled && (
              <p className="text-center text-[12px] text-subtle">
                No backend configured yet — this signs you in locally for the demo.
              </p>
            )}
            <button
              type="button"
              className="w-full pt-1 text-center text-[13px] font-medium text-subtle"
              onClick={() => setMode("welcome")}
            >
              ← Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
