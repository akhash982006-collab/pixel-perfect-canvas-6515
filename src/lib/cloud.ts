import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getDbFirestore, isFirebaseConfigured } from "./firebase";
import {
  localCloudDeleteQuiz,
  localCloudListAttempts,
  localCloudListQuizzes,
  localCloudPutAttempt,
  localCloudPutQuiz,
} from "./db";
import type { Attempt, Quiz } from "./types";

/**
 * Cloud layer. Uses Firebase Cloud Firestore when credentials are present,
 * otherwise mirrors everything into a local store so the whole flow is
 * demonstrable without any credentials.
 */
export const cloudMode = () => (isFirebaseConfigured ? "firebase" : "local");

export async function saveQuizToCloud(quiz: Quiz) {
  const db = getDbFirestore();
  if (!db) return localCloudPutQuiz(quiz);
  await setDoc(doc(db, "quizzes", quiz.id), quiz);
}

export async function deleteQuizFromCloud(id: string) {
  const db = getDbFirestore();
  if (!db) return localCloudDeleteQuiz(id);
  await deleteDoc(doc(db, "quizzes", id));
}

export async function listTeacherQuizzes(teacherId: string): Promise<Quiz[]> {
  const db = getDbFirestore();
  if (!db) return (await localCloudListQuizzes()).filter((q) => q.teacherId === teacherId);
  const snap = await getDocs(query(collection(db, "quizzes"), where("teacherId", "==", teacherId)));
  return snap.docs.map((d) => d.data() as Quiz);
}

export async function findQuizByCode(code: string): Promise<Quiz | null> {
  const wanted = code.trim().toUpperCase();
  const db = getDbFirestore();
  if (!db) {
    const all = await localCloudListQuizzes();
    return all.find((q) => q.code === wanted && q.published) ?? null;
  }
  const snap = await getDocs(query(collection(db, "quizzes"), where("code", "==", wanted)));
  const found = snap.docs.map((d) => d.data() as Quiz).find((q) => q.published);
  return found ?? null;
}

export async function getQuizFromCloud(id: string): Promise<Quiz | null> {
  const db = getDbFirestore();
  if (!db) return (await localCloudListQuizzes()).find((q) => q.id === id) ?? null;
  const snap = await getDoc(doc(db, "quizzes", id));
  return snap.exists() ? (snap.data() as Quiz) : null;
}

export async function pushAttemptToCloud(attempt: Attempt) {
  const db = getDbFirestore();
  const payload: Attempt = { ...attempt, syncStatus: "SYNCED" };
  if (!db) return localCloudPutAttempt(payload);
  // attemptId is the document id -> re-sync can never duplicate a submission
  await setDoc(doc(db, "attempts", attempt.attemptId), payload, { merge: true });
}

export async function listCloudAttempts(teacherQuizIds: string[]): Promise<Attempt[]> {
  const db = getDbFirestore();
  if (!db) return (await localCloudListAttempts()).filter((a) => teacherQuizIds.includes(a.quizId));
  if (teacherQuizIds.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < teacherQuizIds.length; i += 10) chunks.push(teacherQuizIds.slice(i, i + 10));
  const results = await Promise.all(
    chunks.map((c) => getDocs(query(collection(db, "attempts"), where("quizId", "in", c)))),
  );
  return results.flatMap((snap) => snap.docs.map((d) => d.data() as Attempt));
}
