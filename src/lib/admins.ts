import { doc, getDoc } from "firebase/firestore";
import { getDbFirestore } from "./firebase";

/**
 * Coordinator (admin) accounts are created manually in Firebase Authentication.
 * An optional Firestore record at `admins/{uid}` can deactivate an account:
 *   { email, name, role: "admin", active: true }
 * When no record exists, any manually created Firebase user is treated as an
 * active coordinator (there is no public sign-up).
 */
export interface AdminRecord {
  email: string;
  name?: string;
  role: "admin";
  active: boolean;
}

export async function resolveIsAdmin(uid: string): Promise<boolean> {
  const db = getDbFirestore();
  if (!db) return true;
  try {
    const snap = await getDoc(doc(db, "admins", uid));
    if (!snap.exists()) return true;
    const data = snap.data() as Partial<AdminRecord>;
    return data.role === "admin" && data.active !== false;
  } catch {
    // offline or rules blocked the read -> the Firebase session is enough
    return true;
  }
}
