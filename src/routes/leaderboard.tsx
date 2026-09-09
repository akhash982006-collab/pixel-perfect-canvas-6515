import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Trophy } from "lucide-react";
import { StatusPill } from "@/components/status-pill";
import { listAllCloudAttempts } from "@/lib/cloud";

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
  const { data = [], isLoading } = useQuery({
    queryKey: ["public-leaderboard"],
    queryFn: listAllCloudAttempts,
  });

  const rows = data
    .filter((a) => a.status === "SUBMITTED")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || (a.endTime ?? "").localeCompare(b.endTime ?? ""));

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

      <main className="mx-auto max-w-2xl px-5 py-8">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          <h1 className="text-2xl font-semibold">Leaderboard</h1>
        </div>

        <div className="surface-card mt-6 divide-y divide-border">
          {isLoading && <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && rows.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">No results yet.</p>
          )}
          {rows.map((a, i) => (
            <div key={a.attemptId} className="flex items-center gap-4 px-4 py-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.studentName}</p>
                <p className="truncate text-xs text-muted-foreground">{a.quizTitle}</p>
              </div>
              <span className="text-sm font-semibold">{a.score ?? 0}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
