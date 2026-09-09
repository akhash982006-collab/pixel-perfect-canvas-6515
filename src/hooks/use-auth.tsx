import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { resolveIsAdmin } from "@/lib/admins";

export type AppRole = "admin" | "participant";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
}

interface AuthValue {
  user: AppUser | null;
  role: AppRole | null;
  /** true while the initial session is being restored */
  loading: boolean;
  /** true while the signed-in account is being checked against the approved list */
  checking: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);
const CACHE_KEY = "aithera.session";

interface CachedSession {
  user: AppUser;
  role: AppRole;
}

function readCache(): CachedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedSession) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Restore the last session immediately so an offline reload keeps working.
    const cached = readCache();
    if (cached) {
      setUser(cached.user);
      setRole(cached.role);
    }

    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (u) => {
      if (!u) {
        setUser(null);
        setRole(null);
        localStorage.removeItem(CACHE_KEY);
        setLoading(false);
        return;
      }
      const next: AppUser = {
        uid: u.uid,
        email: u.email ?? "",
        name: u.displayName ?? (u.email ?? "Participant").split("@")[0] ?? "Participant",
        ...(u.photoURL ? { photoURL: u.photoURL } : {}),
      };
      setUser(next);
      setLoading(false);
      setChecking(true);
      void resolveIsAdmin(next.uid, next.email)
        .then((admin) => {
          const resolved: AppRole = admin ? "admin" : "participant";
          setRole(resolved);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ user: next, role: resolved } satisfies CachedSession));
        })
        .catch(() => setRole("participant"))
        .finally(() => setChecking(false));
    });
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      role,
      loading,
      checking,
      async signInWithGoogle() {
        const auth = getFirebaseAuth();
        if (!auth) throw new Error("Sign-in is unavailable right now. Please contact the event coordinator.");
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
      },
      async logout() {
        const auth = getFirebaseAuth();
        if (auth) await signOut(auth);
        localStorage.removeItem(CACHE_KEY);
        setUser(null);
        setRole(null);
      },
    }),
    [user, role, loading, checking],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const cloudConfigured = isFirebaseConfigured;
