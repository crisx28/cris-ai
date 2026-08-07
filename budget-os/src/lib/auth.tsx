"use client";

// Lightweight auth layer.
// - Works out of the box in "demo mode": you enter your name and you're in
//   (profile saved locally). Perfect for showing the app to someone.
// - If Supabase is configured (.env.local), the email option performs REAL
//   sign-up / sign-in with secure per-user isolation.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSupabase, isSupabaseEnabled } from "./supabase";

interface Profile {
  name: string;
  email?: string;
}

interface AuthValue {
  ready: boolean;
  signedIn: boolean;
  name: string;
  email?: string;
  supabaseEnabled: boolean;
  signInDemo: (name: string, email?: string) => void;
  signInWithEmail: (
    email: string,
    password: string,
    mode: "signin" | "signup"
  ) => Promise<{ error?: string }>;
  signOut: () => void;
}

const KEY = "cris-budget-os:profile";
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const supabaseEnabled = isSupabaseEnabled();

  useEffect(() => {
    // Restore local profile.
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProfile(JSON.parse(raw));
    } catch {
      /* ignore */
    }

    // If Supabase is on, sync with any existing session.
    const supa = getSupabase();
    if (supa) {
      supa.auth.getSession().then(({ data }) => {
        const user = data.session?.user;
        if (user) {
          const p = {
            name: (user.user_metadata?.name as string) || user.email || "Friend",
            email: user.email ?? undefined,
          };
          setProfile(p);
          localStorage.setItem(KEY, JSON.stringify(p));
        }
        setReady(true);
      });
      const { data: sub } = supa.auth.onAuthStateChange((_e, session) => {
        if (!session) {
          setProfile(null);
          localStorage.removeItem(KEY);
        }
      });
      return () => sub.subscription.unsubscribe();
    }

    setReady(true);
  }, []);

  const persist = useCallback((p: Profile | null) => {
    setProfile(p);
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      ready,
      signedIn: !!profile,
      name: profile?.name ?? "",
      email: profile?.email,
      supabaseEnabled,
      signInDemo: (name, email) =>
        persist({ name: name.trim() || "Friend", email }),
      signInWithEmail: async (email, password, mode) => {
        const supa = getSupabase();
        if (!supa) {
          // No backend — treat as demo login using the email handle.
          persist({ name: email.split("@")[0] || "Friend", email });
          return {};
        }
        const fn =
          mode === "signup"
            ? supa.auth.signUp({ email, password })
            : supa.auth.signInWithPassword({ email, password });
        const { data, error } = await fn;
        if (error) return { error: error.message };
        const user = data.user;
        persist({
          name: (user?.user_metadata?.name as string) || email.split("@")[0],
          email,
        });
        return {};
      },
      signOut: () => {
        const supa = getSupabase();
        if (supa) supa.auth.signOut().catch(() => {});
        persist(null);
      },
    }),
    [ready, profile, supabaseEnabled, persist]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
