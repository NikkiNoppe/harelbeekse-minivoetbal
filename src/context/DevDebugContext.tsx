import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface DevDebugContextValue {
  matchFormModalCount: number;
  registerMatchFormModal: () => () => void;
}

const DevDebugContext = createContext<DevDebugContextValue | null>(null);

/** Dev-only: track open wedstrijdformulieren voor TenantDebugPanel (gast-knop verbergen). */
export function DevDebugProvider({ children }: { children: React.ReactNode }) {
  const [matchFormModalCount, setMatchFormModalCount] = useState(0);

  const registerMatchFormModal = useCallback(() => {
    setMatchFormModalCount((count) => count + 1);
    return () => setMatchFormModalCount((count) => Math.max(0, count - 1));
  }, []);

  const value = useMemo(
    () => ({ matchFormModalCount, registerMatchFormModal }),
    [matchFormModalCount, registerMatchFormModal],
  );

  return <DevDebugContext.Provider value={value}>{children}</DevDebugContext.Provider>;
}

export function useDevDebugContext(): DevDebugContextValue | null {
  return useContext(DevDebugContext);
}

/** Registreer een open wedstrijdformulier-modal voor dev-toolbar gedrag. */
export function useRegisterDevMatchFormModal(open: boolean): void {
  const ctx = useDevDebugContext();

  useEffect(() => {
    if (!open || !ctx) return;
    return ctx.registerMatchFormModal();
  }, [open, ctx]);
}
