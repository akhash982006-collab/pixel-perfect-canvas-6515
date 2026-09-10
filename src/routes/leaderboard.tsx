import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Trophy } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { QuizLeaderboard } from "@/components/quiz-leaderboard";
import { listCloudAttemptsByQuiz } from "@/lib/cloud";
import { getAttempt, getOfflineQuiz } from "@/lib/db";
import { getActiveAttemptId } from "@/lib/active-attempt";
import { LEADERBOARD_RULE_TEXT, LEADERBOARD_RULE_TEXT_SECONDARY } from "@/utils/leaderboard";
import type { OfflineQuiz } from "@/lib/types";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — AITHERA QUIZ" },
      { name: "description", content: "Live standings of the AITHERA 2026 symposium quiz challenge." },
      { property: "og:title", content: "Leaderboard — AITHERA QUIZ" },
      { property: "og:description", content: "See the top scorers of the AITHERA 2026 quiz challenge." },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [myAttemptId, setMyAttemptId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<OfflineQuiz | null>(null);

  useEffect(() => {
    const id = getActiveAttemptId();
    setMyAttemptId(id);
    if (!id) return;
    void (async () => {
      const attempt = await getAttempt(id);
      if (!attempt) return;
      setQuizId(attempt.quizId);
      setQuiz((await getOfflineQuiz(attempt.quizId)) ?? null);
    })();
  }, []);

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ["public-leaderboard", quizId],
    enabled: Boolean(quizId),
    queryFn: () => listCloudAttemptsByQuiz(quizId!),
  });

  return (
    <div className="hero-surface min-h-screen">
      <header className="flex items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          AITHERA QUIZ
        </Link>
        <StatusPill />
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{LEADERBOARD_RULE_TEXT}</p>
        <p className="text-xs text-muted-foreground">{LEADERBOARD_RULE_TEXT_SECONDARY}</p>

        {!quizId ? (
          <div className="surface-card mt-6 p-10 text-center text-sm text-muted-foreground">
            Complete a quiz to see its leaderboard.
          </div>
        ) : (
          <div className="mt-6">
            <QuizLeaderboard
              quiz={quiz}
              attempts={attempts}
              loading={isLoading}
              highlightAttemptId={myAttemptId}
            />
          </div>
        )}
      </main>
    </div>
  );
}
