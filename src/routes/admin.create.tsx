import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { findQuizByCode, getQuizFromCloud, saveQuizToCloud } from "@/lib/cloud";
import { generateQuizCode, uid } from "@/lib/quiz-utils";
import { useAuth } from "@/hooks/use-auth";
import type { Question, Quiz, QuizSettings } from "@/lib/types";

export const Route = createFileRoute("/admin/create")({
  validateSearch: (s: Record<string, unknown>): { id?: string } =>
    typeof s["id"] === "string" ? { id: s["id"] } : {},
  head: () => ({
    meta: [
      { title: "Create a quiz — AITHERA QUIZ" },
      { name: "description", content: "Set up the symposium quiz, add multiple-choice questions and publish the quiz code." },
      { property: "og:title", content: "Create a quiz — AITHERA QUIZ" },
      { property: "og:description", content: "Build the symposium quiz and publish it with a short code." },
    ],
  }),
  component: CreateQuiz,
});

const emptyQuestion = (): Question => ({
  id: uid(),
  type: "MCQ",
  text: "",
  options: ["", "", "", ""],
  correctIndex: 0,
  marks: 1,
  negativeMarks: 0,
  explanation: "",
});

const defaultSettings: QuizSettings = {
  shuffleQuestions: true,
  shuffleOptions: true,
  showResultImmediately: true,
  allowOffline: true,
  allowMultipleAttempts: false,
  enableNegativeMarks: false,
};

const defaultInstructions = [
  "Read every question carefully",
  "Select only one answer",
  "Answers are automatically saved",
  "Internet must remain off during the quiz",
  "Quiz auto-submits when time ends",
].join("\n");

function CreateQuiz() {
  const { id } = Route.useSearch();
  const { user: coordinator } = useAuth();
  const navigate = useNavigate();

  const [quizId] = useState(() => id ?? uid());
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [instructions, setInstructions] = useState(defaultInstructions);
  const [durationMinutes, setDuration] = useState(20);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [negativeValue, setNegativeValue] = useState(0.25);
  const [settings, setSettings] = useState<QuizSettings>(defaultSettings);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [published, setPublished] = useState(false);
  const [version, setVersion] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    void getQuizFromCloud(id).then((q) => {
      if (!q) return;
      setTitle(q.title);
      setCode(q.code);
      setInstructions(q.instructions || defaultInstructions);
      setDuration(q.durationMinutes);
      setSettings(q.settings);
      setMarksPerQuestion(Number(q.questions[0]?.marks) || 1);
      setNegativeValue(Number(q.questions[0]?.negativeMarks) || 0.25);
      setQuestions(q.questions.length ? q.questions : [emptyQuestion()]);
      setPublished(q.published);
      setVersion(q.version);
    });
  }, [id]);

  const totalMarks = questions.length * (Number(marksPerQuestion) || 0);

  function patchQuestion(qid: string, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, ...patch } : q)));
  }

  async function publishQuiz() {
    if (!coordinator) return;
    const quizCode = (code.trim() || generateQuizCode(title || "AITHERA")).toUpperCase();

    if (!title.trim()) return toast.error("Add a quiz title");
    if (!(Number(durationMinutes) > 0)) return toast.error("Duration must be more than 0 minutes");
    if (questions.length < 1) return toast.error("Add at least one question");
    const bad = questions.findIndex(
      (q) => !q.text.trim() || q.options.length !== 4 || q.options.some((o) => !o.trim()),
    );
    if (bad >= 0) return toast.error(`Question ${bad + 1} needs text and four filled options`);
    const noAnswer = questions.findIndex((q) => q.correctIndex < 0 || q.correctIndex > 3);
    if (noAnswer >= 0) return toast.error(`Question ${noAnswer + 1} needs one correct answer`);

    setBusy(true);
    try {
      const existing = await findQuizByCode(quizCode);
      if (existing && existing.id !== quizId) {
        toast.error(`Quiz code ${quizCode} is already used — choose another`);
        return;
      }

      const quiz: Quiz = {
        id: quizId,
        code: quizCode,
        title: title.trim(),
        subject: title.trim(),
        description: "",
        instructions,
        teacherId: coordinator.uid,
        teacherName: coordinator.name,
        durationMinutes: Number(durationMinutes),
        totalMarks,
        passingMarks: 0,
        settings,
        questions: questions.map((q) => ({
          ...q,
          marks: Number(marksPerQuestion) || 1,
          negativeMarks: settings.enableNegativeMarks ? Number(negativeValue) || 0 : 0,
        })),
        version: published ? version + 1 : version,
        published: true,
        createdAt: new Date().toISOString(),
      };

      await saveQuizToCloud(quiz);
      setCode(quizCode);
      setVersion(quiz.version);
      setPublished(true);
      toast.success(`Published — quiz code ${quizCode}`);
      navigate({ to: "/admin/questions" });
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      toast.error(
        msg.includes("timed out")
          ? "Saving is taking too long — check this device's internet and try again. Your work is kept on this device."
          : msg.toLowerCase().includes("permission")
            ? "Publishing is blocked by the quiz database permissions. Ask the project owner to publish the coordinator access rules."
            : "Could not publish the quiz",
      );
    } finally {
      setBusy(false);
    }
  }

  const toggles: { key: keyof QuizSettings; label: string }[] = [
    { key: "shuffleQuestions", label: "Shuffle questions" },
    { key: "shuffleOptions", label: "Shuffle options" },
    { key: "showResultImmediately", label: "Show result immediately" },
    { key: "allowOffline", label: "Allow offline quiz" },
    { key: "allowMultipleAttempts", label: "Multiple attempts" },
    { key: "enableNegativeMarks", label: "Negative marks" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{id ? "Edit quiz" : "Create quiz"}</h1>
          <p className="text-sm text-muted-foreground">
            {questions.length} {questions.length === 1 ? "Question" : "Questions"} • {totalMarks} Total{" "}
            {totalMarks === 1 ? "Mark" : "Marks"} • {Number(durationMinutes) || 0} Minutes
          </p>
        </div>
        <Button disabled={busy} onClick={() => void publishQuiz()}>
          Publish
        </Button>
      </div>

      {published && code && (
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(code);
            toast.success("Quiz code copied");
          }}
          className="surface-card inline-flex items-center gap-3 px-4 py-3"
        >
          <span className="text-sm text-muted-foreground">Quiz code</span>
          <span className="font-mono text-lg font-semibold tracking-widest">{code}</span>
          <Copy className="size-4 text-primary" />
        </button>
      )}

      <section className="surface-card space-y-4 p-5">
        <h2 className="text-base font-semibold">Quiz information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="AITHERA Quiz Challenge" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">Quiz code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="AITHERA26"
              className="font-mono tracking-widest"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="marks">Marks per question</Label>
            <Input
              id="marks"
              type="number"
              min={1}
              value={marksPerQuestion}
              onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="instructions">Instructions</Label>
          <Textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} />
        </div>
      </section>

      <section className="surface-card space-y-3 p-5">
        <h2 className="text-base font-semibold">Competition settings</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {toggles.map((t) => (
            <label key={t.key} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
              {t.label}
              <Switch
                checked={settings[t.key]}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, [t.key]: v }))}
              />
            </label>
          ))}
        </div>
        {settings.enableNegativeMarks && (
          <div className="max-w-xs space-y-2">
            <Label htmlFor="negative">Negative marks per wrong answer</Label>
            <Input
              id="negative"
              type="number"
              min={0}
              step={0.25}
              value={negativeValue}
              onChange={(e) => setNegativeValue(Number(e.target.value))}
            />
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Questions</h2>
          <Button variant="outline" size="sm" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}>
            <Plus className="size-4" /> Add question
          </Button>
        </div>

        {questions.map((q, index) => (
          <div key={q.id} className="surface-card space-y-4 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Question {index + 1}</p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuestions((qs) => [...qs.slice(0, index + 1), { ...q, id: uid() }, ...qs.slice(index + 1)])}
                >
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={questions.length === 1}
                  onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <Textarea
              value={q.text}
              rows={2}
              placeholder="Type the question"
              onChange={(e) => patchQuestion(q.id, { text: e.target.value })}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              {q.options.map((opt, oi) => (
                <label
                  key={oi}
                  className={
                    "flex items-center gap-3 rounded-lg border px-3 py-2 " +
                    (q.correctIndex === oi ? "border-success bg-success/10" : "border-border")
                  }
                >
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctIndex === oi}
                    onChange={() => patchQuestion(q.id, { correctIndex: oi })}
                    className="accent-[var(--success)]"
                  />
                  <span className="w-4 shrink-0 text-sm font-semibold text-muted-foreground">
                    {String.fromCharCode(65 + oi)}
                  </span>
                  <Input
                    value={opt}
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    onChange={(e) =>
                      patchQuestion(q.id, { options: q.options.map((o, i) => (i === oi ? e.target.value : o)) })
                    }
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </label>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              Marks: {Number(marksPerQuestion) || 0}
              {settings.enableNegativeMarks ? ` · Negative: ${Number(negativeValue) || 0}` : ""}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
