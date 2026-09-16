"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type LoadingStep = "mental" | "blueprint" | "lesson" | null;
type DemoState = { mentalGenerated: boolean; mentalApproved: boolean; blueprintGenerated: boolean; blueprintApproved: boolean; lessonGenerated: boolean; articleEdited: boolean; published: boolean };
type DemoContextValue = DemoState & { loading: LoadingStep; generate: (step: Exclude<LoadingStep, null>) => void; approveMental: () => void; approveBlueprint: () => void; markArticleEdited: () => void; publish: () => void; reset: () => void };

const initialState: DemoState = { mentalGenerated: false, mentalApproved: false, blueprintGenerated: false, blueprintApproved: false, lessonGenerated: false, articleEdited: false, published: false };
const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(initialState);
  const [loading, setLoading] = useState<LoadingStep>(null);
  const generate = useCallback((step: Exclude<LoadingStep, null>) => { setLoading(step); window.setTimeout(() => { setState((current) => step === "mental" ? { ...current, mentalGenerated: true } : step === "blueprint" ? { ...current, blueprintGenerated: true } : { ...current, lessonGenerated: true }); setLoading(null); }, 650); }, []);
  const value = useMemo<DemoContextValue>(() => ({ ...state, loading, generate, approveMental: () => setState((current) => ({ ...current, mentalApproved: true })), approveBlueprint: () => setState((current) => ({ ...current, blueprintApproved: true })), markArticleEdited: () => setState((current) => ({ ...current, articleEdited: true })), publish: () => setState((current) => ({ ...current, published: true })), reset: () => { setLoading(null); setState(initialState); } }), [loading, state, generate]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() { const context = useContext(DemoContext); if (!context) throw new Error("useDemo must be used within DemoProvider"); return context; }
