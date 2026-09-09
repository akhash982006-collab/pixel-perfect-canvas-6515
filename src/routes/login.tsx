import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTeacherAuth } from "@/hooks/use-teacher-auth";
import { isFirebaseConfigured } from "@/lib/firebase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Teacher login — Offline Quiz Platform" },
      { name: "description", content: "Sign in to create quizzes, publish quiz codes and review student results." },
      { property: "og:title", content: "Teacher login — Offline Quiz Platform" },
      { property: "og:description", content: "Sign in to create quizzes and review student results." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, register } = useTeacherAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(name.trim() || email.split("@")[0] || "Teacher", email.trim(), password);
      toast.success("Welcome back");
      navigate({ to: "/teacher" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="hero-surface grid min-h-screen place-items-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          Offline Quiz Platform
        </Link>

        <form onSubmit={submit} className="surface-card space-y-4 p-6">
          <div>
            <h1 className="text-xl font-semibold">{mode === "login" ? "Teacher login" : "Create a teacher account"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isFirebaseConfigured
                ? "Sign in with your email and password."
                : "Demo mode: any email with a password of 4+ characters works on this device."}
            </p>
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anitha R" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@college.edu"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {mode === "login" ? "No account yet? Create one" : "Already have an account? Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Taking a quiz instead? <Link to="/join" className="text-primary underline-offset-4 hover:underline">Join with a code</Link>
        </p>
      </div>
    </div>
  );
}
