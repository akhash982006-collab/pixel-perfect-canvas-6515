import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { resolveIsAdmin } from "@/lib/admins";

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
}

interface AuthValue {
  user: AdminUser | null;
  /** true while the stored session is being restored */
  loading: boolean;
  /** true while the signed-in account is being checked */
  checking: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);

/**
 * Coordinator-only authentication (Firebase email + password).
 * Participants never authenticate.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    void setPersistence(auth, browserLocalPersistence).catch(() => undefined);

    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      setLoading(false);
      setChecking(true);
      void resolveIsAdmin(u.uid, u.email)
        .then((ok) => {
          if (!ok) {
            setUser(null);
            void signOut(auth);
            return;
          }
          setUser({
            uid: u.uid,
            email: u.email ?? "",
            name: u.displayName ?? (u.email ?? "Coordinator").split("@")[0] ?? "Coordinator",
          });
        })
        .catch(() => setUser(null))
        .finally(() => setChecking(false));
    });
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      checking,
      async signIn(email, password) {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error("Sign-in is unavailable right now.");
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },
      async logout() {
        const auth = getFirebaseAuth();
        if (auth) await signOut(auth);
        setUser(null);
      },
    }),
    [user, loading, checking],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const cloudConfigured = isFirebaseConfigured;
