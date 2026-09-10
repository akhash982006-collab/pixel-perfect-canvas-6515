import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { QuizLeaderboard } from "@/components/quiz-leaderboard";
import { useQuizAttempts, useTeacherQuizzes } from "@/hooks/use-teacher-data";
import { LEADERBOARD_RULE_TEXT, LEADERBOARD_RULE_TEXT_SECONDARY } from "@/utils/leaderboard";

export const Route = createFileRoute("/admin/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — AITHERA QUIZ" },
      { name: "description", content: "Live ranking of the AITHERA 2026 symposium quiz competition." },
      { property: "og:title", content: "Leaderboard — AITHERA QUIZ" },
      { property: "og:description", content: "Top scorers of the AITHERA 2026 quiz challenge." },
    ],
  }),
  component: AdminLeaderboard,
});

function AdminLeaderboard() {
  const { data: quizzes = [] } = useTeacherQuizzes();
  const [quizId, setQuizId] = useState<string>("");

  const selectable = quizzes.filter((q) => q.published);
  const options = selectable.length > 0 ? selectable : quizzes;

  useEffect(() => {
    if (!quizId && options.length > 0) setQuizId(options[0]!.id);
  }, [quizId, options]);

  const { data: attempts = [], isLoading } = useQuizAttempts(quizId);
  const quiz = quizzes.find((q) => q.id === quizId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{LEADERBOARD_RULE_TEXT}</p>
        <p className="text-xs text-muted-foreground">{LEADERBOARD_RULE_TEXT_SECONDARY}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Leaderboard for:</span>
        <select
          value={quizId}
          onChange={(e) => setQuizId(e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm"
        >
          {options.length === 0 && <option value="">No quizzes yet</option>}
          {options.map((q) => (
            <option key={q.id} value={q.id}>
              {q.title} ({q.code})
            </option>
          ))}
        </select>
      </div>

      <QuizLeaderboard quiz={quiz} attempts={attempts} loading={isLoading && Boolean(quizId)} />
    </div>
  );
}
