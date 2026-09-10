import { createFileRoute, useParams } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { QuizLeaderboard } from "@/components/quiz-leaderboard";
import { useQuizAttempts, useTeacherQuizzes } from "@/hooks/use-teacher-data";
import { LEADERBOARD_RULE_TEXT, LEADERBOARD_RULE_TEXT_SECONDARY } from "@/utils/leaderboard";

export const Route = createFileRoute("/admin/quizzes/$quizId/leaderboard")({
  head: () => ({
    meta: [
      { title: "Quiz leaderboard — AITHERA QUIZ" },
      { name: "description", content: "Ranking of participants for a single AITHERA 2026 quiz." },
      { property: "og:title", content: "Quiz leaderboard — AITHERA QUIZ" },
      { property: "og:description", content: "Per-quiz ranking of the AITHERA 2026 competition." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QuizLeaderboardPage,
});

function QuizLeaderboardPage() {
  const { quizId } = useParams({ from: "/admin/quizzes/$quizId/leaderboard" });
  const { data: quizzes = [] } = useTeacherQuizzes();
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

      <QuizLeaderboard quiz={quiz} attempts={attempts} loading={isLoading} />
    </div>
  );
}
