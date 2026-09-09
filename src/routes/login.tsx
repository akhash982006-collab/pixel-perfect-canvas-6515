import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — AITHERA QUIZ" },
      { name: "description", content: "Sign in with your Google account to enter the AITHERA 2026 quiz competition." },
      { property: "og:title", content: "Sign in — AITHERA QUIZ" },
      { property: "og:description", content: "One sign-in for the AITHERA 2026 symposium quiz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
    </svg>
  );
}

function LoginPage() {
  const { user, role, checking, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !role) return;
    void navigate({ to: role === "admin" ? "/admin/dashboard" : "/participant-details", replace: true });
  }, [user, role, navigate]);

  async function handleSignIn() {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      if (!message.includes("popup-closed-by-user")) toast.error("We couldn't sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const waiting = busy || checking || Boolean(user && !role);

  return (
    <div className="hero-surface grid min-h-screen place-items-center px-5 py-12">
      <div className="surface-card w-full max-w-md p-8 text-center">
        <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">AITHERA 2026</p>
        <h1 className="mt-3 text-3xl font-semibold">
          <span className="font-serif italic">AITHERA</span> QUIZ
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Intelligence Beyond Imagination</p>

        {waiting ? (
          <p className="mt-8 text-sm font-medium">Checking access…</p>
        ) : (
          <Button size="lg" className="mt-8 w-full gap-3" onClick={() => void handleSignIn()}>
            <GoogleIcon />
            CONTINUE WITH GOOGLE
          </Button>
        )}

        <p className="mt-4 text-xs text-muted-foreground">Use your Google account to enter the AITHERA Quiz.</p>
      </div>
    </div>
  );
}
