import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

export interface TeacherUser {
  uid: string;
  email: string;
  name: string;
}

interface AuthValue {
  teacher: TeacherUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthValue | null>(null);
const LOCAL_KEY = "oqp.teacher";

export function TeacherAuthProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState<TeacherUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (auth) {
      return onAuthStateChanged(auth, (u) => {
        setTeacher(
          u ? { uid: u.uid, email: u.email ?? "", name: u.displayName ?? (u.email ?? "teacher").split("@")[0] ?? "Teacher" } : null,
        );
        setLoading(false);
      });
    }
    const raw = localStorage.getItem(LOCAL_KEY);
    setTeacher(raw ? (JSON.parse(raw) as TeacherUser) : null);
    setLoading(false);
    return;
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      teacher,
      loading,
      async login(email, password) {
        const auth = getFirebaseAuth();
        if (auth) {
          await signInWithEmailAndPassword(auth, email, password);
          return;
        }
        if (password.length < 4) throw new Error("Password must be at least 4 characters");
        const user: TeacherUser = { uid: `local:${email}`, email, name: email.split("@")[0] ?? "Teacher" };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(user));
        setTeacher(user);
      },
      async register(name, email, password) {
        const auth = getFirebaseAuth();
        if (auth) {
          await createUserWithEmailAndPassword(auth, email, password);
          return;
        }
        if (password.length < 4) throw new Error("Password must be at least 4 characters");
        const user: TeacherUser = { uid: `local:${email}`, email, name };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(user));
        setTeacher(user);
      },
      async logout() {
        const auth = getFirebaseAuth();
        if (auth) await signOut(auth);
        localStorage.removeItem(LOCAL_KEY);
        setTeacher(null);
      },
    }),
    [teacher, loading],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTeacherAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTeacherAuth must be used inside TeacherAuthProvider");
  return ctx;
}

export const cloudConfigured = isFirebaseConfigured;
