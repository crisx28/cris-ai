"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const KEY = "cris-budget-os:workspace-name";
export const DEFAULT_NAME = "Cris Budget OS";

// Non-React accessor for libs (e.g. exporters) — SSR-safe.
export function getWorkspaceName(): string {
  if (typeof window === "undefined") return DEFAULT_NAME;
  try {
    return localStorage.getItem(KEY) || DEFAULT_NAME;
  } catch {
    return DEFAULT_NAME;
  }
}

interface Ctx {
  name: string;
  setName: (n: string) => void;
}
const WorkspaceContext = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState(DEFAULT_NAME);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setNameState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      name,
      setName: (n: string) => {
        const clean = n.trim() || DEFAULT_NAME;
        setNameState(clean);
        try {
          localStorage.setItem(KEY, clean);
        } catch {
          /* ignore */
        }
      },
    }),
    [name]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): Ctx {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
