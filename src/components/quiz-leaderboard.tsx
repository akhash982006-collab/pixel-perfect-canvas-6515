import { useMemo } from "react";
import type { Attempt, Quiz } from "@/lib/types";
import { formatQuizTime, formatScore, rankResults } from "@/utils/leaderboard";

interface Props {
  quiz?: Pick<Quiz, "title" | "code" | "questions" | "durationMinutes" | "totalMarks"> | null;
  attempts: Attempt[];
  loading?: boolean;
  highlightAttemptId?: string | null;
}

/** Ranking table for ONE quiz. Never mixes attempts from other quizzes. */
export function QuizLeaderboard({ quiz, attempts, loading, highlightAttemptId }: Props) {
  const quizTotalMarks = useMemo(() => {
    if (!quiz) return undefined;
    const sum = quiz.questions?.reduce((s, q) => s + (Number(q.marks) || 0), 0) ?? 0;
    return sum || Number(quiz.totalMarks) || undefined;
  }, [quiz]);

  const rows = useMemo(
    () => rankResults(attempts.filter((a) => a.status === "SUBMITTED")),
    [attempts],
  );

  return (
    <div className="space-y-4">
      {quiz && (
        <div className="surface-card p-4">
          <p className="text-base font-semibold">{quiz.title}</p>
          <p className="text-sm text-muted-foreground">
            Quiz Code: <span className="font-mono">{quiz.code}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {quiz.questions?.length ?? 0} Questions • {quizTotalMarks ?? 0} Marks • {quiz.durationMinutes} Minutes
          </p>
        </div>
      )}

      <div className="surface-card overflow-x-auto">
        {loading && <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</p>}
        {!loading && rows.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No submissions yet for this quiz.</p>
        )}
        {!loading && rows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Role number</th>
                <th className="px-4 py-3 font-medium">Participant</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Correct</th>
                <th className="px-4 py-3 font-medium">Wrong</th>
                <th className="px-4 py-3 font-medium">Time taken</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr
                  key={a.attemptId}
                  className={
                    "border-b border-border last:border-0 " +
                    (a.attemptId === highlightAttemptId ? "bg-primary/10 font-medium" : "")
                  }
                >
                  <td className="px-4 py-3 font-semibold">{a.rank}</td>
                  <td className="px-4 py-3">{a.roleNumber ?? a.registerNumber}</td>
                  <td className="px-4 py-3 font-medium">{a.studentName}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatScore(a.score)}{" "}
                    <span className="text-muted-foreground">/ {a.totalMarks ?? quizTotalMarks ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">{a.correct ?? 0}</td>
                  <td className="px-4 py-3">{a.wrong ?? 0}</td>
                  <td className="px-4 py-3 tabular-nums">{formatQuizTime(a.timeTaken)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
