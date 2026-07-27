import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AuthGateModal } from "@/components/auth/AuthGateModal";

type AuthGateContextValue = {
  /** Returns true if signed in; otherwise opens the TikTok-style gate and returns false. */
  requireAuth: (reason?: string) => boolean;
  openAuthGate: (reason?: string) => void;
};

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({
  children,
  isSignedIn,
}: {
  children: ReactNode;
  isSignedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | undefined>();

  const openAuthGate = useCallback((nextReason?: string) => {
    setReason(nextReason);
    setOpen(true);
  }, []);

  const requireAuth = useCallback(
    (nextReason?: string) => {
      if (isSignedIn) return true;
      openAuthGate(nextReason);
      return false;
    },
    [isSignedIn, openAuthGate],
  );

  const value = useMemo(
    () => ({ requireAuth, openAuthGate }),
    [requireAuth, openAuthGate],
  );

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      <AuthGateModal open={open} onOpenChange={setOpen} reason={reason} />
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    return {
      requireAuth: () => true,
      openAuthGate: () => undefined,
    };
  }
  return ctx;
}
