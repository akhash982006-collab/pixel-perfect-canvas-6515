import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDbFirestore } from "./firebase";

/**
 * Pre-approved coordinator / admin Gmail accounts.
 * The authoritative list lives in Firestore at `admins/{uid}`
 * ({ email, role: "admin", active: true }); this list is the bootstrap
 * fallback so the first coordinators can always sign in.
 */
export const ADMIN_EMAILS: string[] = [
  "aithera.coordinator@gmail.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());
}

export interface AdminRecord {
  email: string;
  role: "admin";
  active: boolean;
}

/** Resolves whether a signed-in Google account is an approved, active admin. */
export async function resolveIsAdmin(uid: string, email: string | null): Promise<boolean> {
  const db = getDbFirestore();
  if (db) {
    try {
      const snap = await getDoc(doc(db, "admins", uid));
      if (snap.exists()) {
        const data = snap.data() as Partial<AdminRecord>;
        return data.role === "admin" && data.active === true;
      }
    } catch {
      // offline or rules blocked the read -> fall back to the known list
    }
  }

  if (!isAdminEmail(email)) return false;

  // Bootstrap: record the approved coordinator so the list lives in Firestore too.
  if (db && email) {
    try {
      await setDoc(doc(db, "admins", uid), { email, role: "admin", active: true } satisfies AdminRecord, {
        merge: true,
      });
    } catch {
      // ignore — read path already granted access
    }
  }
  return true;
}
