import type { Attempt, Quiz } from "./types";

export function generateQuizCode(subject: string) {
  const letters = (subject.replace(/[^a-zA-Z]/g, "").toUpperCase() + "QUIZ").slice(0, 4);
  const digits = Math.floor(100 + Math.random() * 900);
  return `${letters}${digits}`;
}

export function uid() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

export function evaluate(quiz: Quiz, attempt: Attempt) {
  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  let score = 0;
  for (const q of quiz.questions) {
    const a = attempt.answers[q.id];
    if (!a || a.selectedIndex === null || a.selectedIndex === undefined) {
      unanswered++;
      continue;
    }
    if (a.selectedIndex === q.correctIndex) {
      correct++;
      score += q.marks;
    } else {
      wrong++;
      if (quiz.settings.enableNegativeMarks) score -= q.negativeMarks;
    }
  }
  score = Math.max(0, score);
  const total = quiz.questions.reduce((s, q) => s + q.marks, 0) || quiz.totalMarks || 1;
  const percentage = Math.round((score / total) * 1000) / 10;
  return {
    correct,
    wrong,
    unanswered,
    score,
    percentage,
    passed: score >= quiz.passingMarks,
  };
}

export function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
