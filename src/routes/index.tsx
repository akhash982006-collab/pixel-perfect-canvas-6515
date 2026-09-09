import { createFileRoute, Link } from "@tanstack/react-router";
import { CloudOff, Download, GraduationCap, ShieldCheck, Timer, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Offline Quiz Platform — Exams that keep running without internet" },
      {
        name: "description",
        content:
          "Teachers create and publish quizzes with a code. Students download the quiz once and finish it fully offline, with answers saved locally and synced automatically.",
      },
      { property: "og:title", content: "Offline Quiz Platform" },
      {
        property: "og:description",
        content: "Download a quiz once, write it offline, sync results automatically when the network returns.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Download,
    title: "Download once",
    text: "The whole quiz is stored on the device before it starts, so the network can drop at any moment.",
  },
  {
    icon: WifiOff,
    title: "Write offline",
    text: "Every answer is saved on the device the instant it is chosen. Refreshing or closing the tab loses nothing.",
  },
  {
    icon: Timer,
    title: "Protected timer",
    text: "The countdown is anchored to the start time, so it keeps running even if the page is reloaded.",
  },
  {
    icon: ShieldCheck,
    title: "Automatic sync",
    text: "Submissions queue up locally and upload themselves as soon as a connection is back.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            Offline Quiz Platform
          </div>
          <div className="flex items-center gap-3">
            <StatusPill className="hidden sm:flex" />
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Teacher login</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/join">Join a quiz</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="hero-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-card px-3 py-1 text-xs font-semibold text-accent-foreground">
              <CloudOff className="size-3.5" /> Works without internet
            </span>
            <h1 className="mt-5 text-4xl leading-tight font-bold md:text-5xl">
              Exams that don't stop when the connection does.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
              Built for colleges, schools and training centres with unreliable networks. A student loads the quiz
              once, then writes the whole paper offline — answers, timer and results all live on the device until
              the network returns.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/join">Enter quiz code</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">I'm a teacher</Link>
              </Button>
            </div>
          </div>

          <div className="surface-card p-6">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">How a quiz runs</p>
            <ol className="mt-4 space-y-4 text-sm">
              {[
                "Teacher creates the quiz and shares a short code",
                "Student enters the code and prepares the quiz offline",
                "Network can be switched off — the paper keeps working",
                "Answers save on the device after every tap",
                "Submission uploads by itself once you're back online",
              ].map((step, i) => (
                <li key={step} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl font-semibold">Made for unstable networks</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="surface-card p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted-foreground">
          <span>Offline Quiz Platform</span>
          <span>Install it from your browser menu to use it like an app.</span>
        </div>
      </footer>
    </div>
  );
}
