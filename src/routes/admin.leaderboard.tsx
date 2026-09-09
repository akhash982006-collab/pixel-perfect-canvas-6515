import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { useTeacherAttempts, useTeacherQuizzes } from "@/hooks/use-teacher-data";

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
  const { data: attempts = [] } = useTeacherAttempts(quizzes.map((q) => q.id));

  const rows = useMemo(
    () =>
      attempts
        .filter((a) => a.status === "SUBMITTED")
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || (a.endTime ?? "").localeCompare(b.endTime ?? "")),
    [attempts],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="size-5 text-primary" />
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
      </div>

      <div className="surface-card divide-y divide-border">
        {rows.length === 0 && <p className="px-4 py-10 text-center text-sm text-muted-foreground">No results yet.</p>}
        {rows.map((a, i) => (
          <div key={a.attemptId} className="flex items-center gap-4 px-4 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.studentName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {a.roleNumber ?? a.registerNumber} · {a.quizTitle}
              </p>
            </div>
            <span className="text-sm font-semibold">{a.score ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
