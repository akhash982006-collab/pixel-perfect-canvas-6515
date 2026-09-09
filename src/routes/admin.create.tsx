import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getQuizFromCloud, saveQuizToCloud } from "@/lib/cloud";
import { generateQuizCode, uid } from "@/lib/quiz-utils";
import { useAuth } from "@/hooks/use-auth";
import type { Question, Quiz, QuizSettings } from "@/lib/types";

export const Route = createFileRoute("/admin/create")({
  validateSearch: (s: Record<string, unknown>): { id?: string } =>
    typeof s["id"] === "string" ? { id: s["id"] } : {},
  head: () => ({
    meta: [
      { title: "Create a quiz — AITHERA QUIZ" },
      { name: "description", content: "Set up quiz details, add multiple-choice questions and publish a quiz code." },
      { property: "og:title", content: "Create a quiz — AITHERA QUIZ" },
      { property: "og:description", content: "Build a quiz and publish it with a short code for students." },
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
  shuffleQuestions: false,
  shuffleOptions: false,
  showResultImmediately: true,
  allowOffline: true,
  allowMultipleAttempts: false,
  enableNegativeMarks: false,
};

function CreateQuiz() {
  const { id } = Route.useSearch();
  const { user: teacher } = useAuth();
  const navigate = useNavigate();

  const [quizId] = useState(() => id ?? uid());
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("Read every question carefully. Answers save automatically.");
  const [durationMinutes, setDuration] = useState(30);
  const [passingMarks, setPassing] = useState(10);
  const [settings, setSettings] = useState<QuizSettings>(defaultSettings);
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [code, setCode] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [version, setVersion] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    void getQuizFromCloud(id).then((q) => {
      if (!q) return;
      setTitle(q.title);
      setSubject(q.subject);
      setDescription(q.description);
      setInstructions(q.instructions);
      setDuration(q.durationMinutes);
      setPassing(q.passingMarks);
      setSettings(q.settings);
      setQuestions(q.questions.length ? q.questions : [emptyQuestion()]);
      setCode(q.code);
      setPublished(q.published);
      setVersion(q.version);
    });
  }, [id]);

  const totalMarks = questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  function patchQuestion(qid: string, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q) => (q.id === qid ? { ...q, ...patch } : q)));
  }

  async function save(publish: boolean) {
    if (!teacher) return;
    if (!title.trim() || !subject.trim()) {
      toast.error("Add a title and subject first");
      return;
    }
    if (publish) {
      const bad = questions.find((q) => !q.text.trim() || q.options.some((o) => !o.trim()));
      if (bad) {
        toast.error("Every question needs text and four options before publishing");
        return;
      }
    }
    setBusy(true);
    const quizCode = code ?? generateQuizCode(subject);
    const quiz: Quiz = {
      id: quizId,
      code: quizCode,
      title: title.trim(),
      subject: subject.trim(),
      description,
      instructions,
      teacherId: teacher.uid,
      teacherName: teacher.name,
      durationMinutes: Number(durationMinutes) || 30,
      totalMarks,
      passingMarks: Math.min(Number(passingMarks) || 0, totalMarks),
      settings,
      questions,
      version: published && publish ? version + 1 : version,
      published: publish || published,
      createdAt: new Date().toISOString(),
    };
    try {
      await saveQuizToCloud(quiz);
      setCode(quizCode);
      setVersion(quiz.version);
      setPublished(quiz.published);
      toast.success(publish ? `Published with code ${quizCode}` : "Draft saved");
      if (publish) navigate({ to: "/admin/questions" });
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      toast.error(
        msg.includes("timed out")
          ? "Saving is taking too long — check this device's internet and try again. Your work is kept on this device."
          : msg.includes("permission")
            ? "This account is not allowed to save quizzes yet."
            : "Could not save the quiz",
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
    { key: "allowMultipleAttempts", label: "Allow multiple attempts" },
    { key: "enableNegativeMarks", label: "Enable negative marks" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{id ? "Edit quiz" : "Create quiz"}</h1>
          <p className="text-sm text-muted-foreground">
            {questions.length} questions · {totalMarks} marks
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={busy} onClick={() => void save(false)}>
            Save draft
          </Button>
          <Button disabled={busy} onClick={() => void save(true)}>
            Publish
          </Button>
        </div>
      </div>

      {code && published && (
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(code);
            toast.success("Quiz code copied");
          }}
          className="surface-card inline-flex items-center gap-3 px-4 py-3"
        >
          <span className="text-sm text-muted-foreground">Quiz code</span>
          <span className="font-mono text-lg font-semibold">{code}</span>
          <Copy className="size-4 text-primary" />
        </button>
      )}

      <section className="surface-card space-y-4 p-5">
        <h2 className="text-base font-semibold">Quiz details</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Quiz title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Unit test 1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Data structures" />
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
            <Label htmlFor="passing">Passing marks</Label>
            <Input
              id="passing"
              type="number"
              min={0}
              value={passingMarks}
              onChange={(e) => setPassing(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instructions">Instructions for students</Label>
          <Textarea id="instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} />
        </div>
      </section>

      <section className="surface-card space-y-3 p-5">
        <h2 className="text-base font-semibold">Settings</h2>
        <div className="grid gap-3 sm:grid-cols-2">
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

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Marks</Label>
                <Input
                  type="number"
                  min={0}
                  value={q.marks}
                  onChange={(e) => patchQuestion(q.id, { marks: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Negative marks</Label>
                <Input
                  type="number"
                  min={0}
                  value={q.negativeMarks}
                  onChange={(e) => patchQuestion(q.id, { negativeMarks: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Explanation (optional)</Label>
                <Input
                  value={q.explanation ?? ""}
                  onChange={(e) => patchQuestion(q.id, { explanation: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
