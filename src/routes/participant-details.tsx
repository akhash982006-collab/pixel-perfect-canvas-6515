import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, CloudDownload, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/status-pill";
import { findQuizByCode } from "@/lib/cloud";
import {
  getStudentSession,
  listAttempts,
  listOfflineQuizzes,
  saveOfflineQuiz,
  saveStudentSession,
} from "@/lib/db";
import type { Attempt, OfflineQuiz, Quiz } from "@/lib/types";

export const Route = createFileRoute("/participant-details")({
  head: () => ({
    meta: [
      { title: "Join a quiz — Offline Quiz Platform" },
      { name: "description", content: "Enter your name, register number and quiz code, then prepare the quiz for offline use." },
      { property: "og:title", content: "Join a quiz — Offline Quiz Platform" },
      { property: "og:description", content: "Load a quiz onto your device and write it without internet." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const navigate = useNavigate();
  const [studentName, setName] = useState("");
  const [registerNumber, setReg] = useState("");
  const [code, setCode] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [offline, setOffline] = useState<OfflineQuiz | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ quizzes: OfflineQuiz[]; attempts: Attempt[] }>({ quizzes: [], attempts: [] });

  useEffect(() => {
    void getStudentSession().then((s) => {
      if (s) {
        setName(s.studentName);
        setReg(s.registerNumber);
      }
    });
    void Promise.all([listOfflineQuizzes(), listAttempts()]).then(([quizzes, attempts]) =>
      setSaved({ quizzes, attempts }),
    );
  }, []);

  async function findQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!studentName.trim() || !registerNumber.trim()) {
      toast.error("Add your name and register number");
      return;
    }
    setBusy(true);
    try {
      await saveStudentSession({ studentName: studentName.trim(), registerNumber: registerNumber.trim() });
      const found = await findQuizByCode(code);
      if (!found) {
        toast.error("No published quiz found for that code");
        setQuiz(null);
      } else {
        setQuiz(found);
        const local = (await listOfflineQuizzes()).find((q) => q.id === found.id && q.version === found.version);
        setOffline(local ?? null);
      }
    } catch {
      toast.error("Could not reach the quiz. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function prepareOffline() {
    if (!quiz) return;
    setBusy(true);
    const steps = ["Downloading quiz…", "Saving questions…", "Preparing offline mode…"];
    for (const s of steps) {
      setProgress(s);
      await new Promise((r) => setTimeout(r, 400));
    }
    const stored = await saveOfflineQuiz(quiz);
    setOffline(stored);
    setProgress(null);
    setBusy(false);
    toast.success("Quiz ready offline. You can disconnect now.");
  }

  function goToOfflineCheck(target: OfflineQuiz) {
    navigate({ to: "/quiz/offline-check", search: { quizId: target.id } });
  }

  const resumable = saved.attempts.filter((a) => a.status === "IN_PROGRESS");

  return (
    <div className="hero-surface min-h-screen">
      <header className="flex items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          Offline Quiz Platform
        </Link>
        <StatusPill />
      </header>

      <div className="mx-auto grid max-w-4xl gap-6 px-5 py-8 md:grid-cols-2">
        <form onSubmit={findQuiz} className="surface-card space-y-4 p-6">
          <div>
            <h1 className="text-xl font-semibold">Join a quiz</h1>
            <p className="mt-1 text-sm text-muted-foreground">Your details stay on this device.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sname">Student name</Label>
            <Input id="sname" value={studentName} onChange={(e) => setName(e.target.value)} placeholder="Ravi Kumar" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg">Register number</Label>
            <Input id="reg" value={registerNumber} onChange={(e) => setReg(e.target.value)} placeholder="21AD045" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Quiz code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="AIDS204"
              className="font-mono tracking-widest"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Find quiz
          </Button>
        </form>

        <div className="space-y-6">
          {quiz && (
            <div className="surface-card space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold">{quiz.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {quiz.subject} · {quiz.teacherName}
                </p>
              </div>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Questions</dt>
                  <dd className="font-semibold">{quiz.questions.length}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Duration</dt>
                  <dd className="font-semibold">{quiz.durationMinutes} min</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Total marks</dt>
                  <dd className="font-semibold">{quiz.totalMarks}</dd>
                </div>
              </dl>
              {quiz.instructions && <p className="text-sm text-muted-foreground">{quiz.instructions}</p>}

              {offline ? (
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                    <CheckCircle2 className="size-3.5" /> Offline ready
                  </span>
                  <Button className="w-full" onClick={() => goToOfflineCheck(offline)}>
                    Continue
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Next you&apos;ll be asked to turn the internet off — the quiz runs entirely on this device.
                  </p>
                </div>
              ) : (
                <Button className="w-full" onClick={() => void prepareOffline()} disabled={busy}>
                  <CloudDownload className="size-4" /> {progress ?? "Prepare quiz offline"}
                </Button>
              )}
            </div>
          )}

          {resumable.length > 0 && (
            <div className="surface-card p-6">
              <h2 className="text-base font-semibold">Continue where you left off</h2>
              <div className="mt-3 space-y-2">
                {resumable.map((a) => (
                  <Link
                    key={a.attemptId}
                    to="/quiz/offline-check"
                    search={{ quizId: a.quizId }}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-secondary"
                  >
                    <span>{a.quizTitle}</span>
                    <span className="text-muted-foreground">Resume</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
