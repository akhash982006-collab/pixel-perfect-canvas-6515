import type { Attempt, Question, Quiz } from "./types";

/**
 * Per-attempt question and option shuffling for AITHERA QUIZ.
 *
 * The order is generated ONCE when an attempt is created and persisted with the
 * attempt, so refresh, offline recovery and navigation always rebuild the exact
 * same quiz. Rendering never shuffles.
 */

/** Stable, permanent id for an option of a question (works for legacy string[] options). */
export function optionIdFor(questionId: string, index: number) {
  return `${questionId}_option_${index + 1}`;
}

export interface NormalizedOption {
  id: string;
  text: string;
  /** Index in the original authoring order — the canonical value used for scoring. */
  index: number;
}

export interface NormalizedQuestion {
  id: string;
  text: string;
  marks: number;
  negativeMarks: number;
  options: NormalizedOption[];
  correctOptionId: string;
}

/** Normalizes any stored question shape into id-based options + correctOptionId. */
export function normalizeQuestion(question: Question): NormalizedQuestion {
  const raw = (question.options ?? []) as unknown[];
  const options: NormalizedOption[] = raw.map((opt, index) => {
    if (opt && typeof opt === "object") {
      const o = opt as { id?: string; text?: string };
      return { id: o.id ?? optionIdFor(question.id, index), text: String(o.text ?? ""), index };
    }
    return { id: optionIdFor(question.id, index), text: String(opt ?? ""), index };
  });

  const legacy = question as unknown as { correctOptionId?: string; correctAnswer?: unknown };
  let correctOptionId = legacy.correctOptionId;
  if (!correctOptionId) {
    let idx = question.correctIndex;
    if (typeof idx !== "number") {
      const ca = legacy.correctAnswer;
      if (typeof ca === "number") idx = ca;
      else if (typeof ca === "string" && /^[A-D]$/i.test(ca)) idx = ca.toUpperCase().charCodeAt(0) - 65;
      else idx = 0;
    }
    correctOptionId = options[idx]?.id ?? options[0]?.id ?? optionIdFor(question.id, 0);
  }

  return {
    id: question.id,
    text: question.text,
    marks: Number(question.marks) || 0,
    negativeMarks: Number(question.negativeMarks) || 0,
    options,
    correctOptionId,
  };
}

export function normalizeQuiz(quiz: Quiz): NormalizedQuestion[] {
  return (quiz.questions ?? []).map(normalizeQuestion);
}

/** Fisher-Yates. Never mutates the source array. */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

export interface AttemptOrder {
  questionOrder: string[];
  optionOrder: Record<string, string[]>;
}

/** Generates the attempt-specific order. Call this only when a new attempt is created. */
export function createAttemptOrder(quiz: Quiz): AttemptOrder {
  const questions = normalizeQuiz(quiz);
  const ids = questions.map((q) => q.id);
  const questionOrder = quiz.settings?.shuffleQuestions ? shuffleArray(ids) : ids;

  const optionOrder: Record<string, string[]> = {};
  for (const q of questions) {
    const optionIds = q.options.map((o) => o.id);
    optionOrder[q.id] = quiz.settings?.shuffleOptions ? shuffleArray(optionIds) : optionIds;
  }

  return { questionOrder, optionOrder };
}

/**
 * Rebuilds the participant's exact quiz view from the persisted order.
 * Missing/partial order data falls back to the original authoring order.
 */
export function buildAttemptView(quiz: Quiz, attempt: Pick<Attempt, "questionOrder" | "optionOrder">) {
  const questions = normalizeQuiz(quiz);
  const byId = new Map(questions.map((q) => [q.id, q]));

  const order = attempt.questionOrder?.filter((id) => byId.has(id)) ?? [];
  for (const q of questions) if (!order.includes(q.id)) order.push(q.id);

  return order.map((id) => {
    const q = byId.get(id)!;
    const optOrder = attempt.optionOrder?.[id];
    let options = q.options;
    if (optOrder && optOrder.length > 0) {
      const optById = new Map(q.options.map((o) => [o.id, o]));
      const ordered = optOrder.map((oid) => optById.get(oid)).filter(Boolean) as NormalizedOption[];
      for (const o of q.options) if (!ordered.some((x) => x.id === o.id)) ordered.push(o);
      options = ordered;
    }
    return { ...q, options };
  });
}
