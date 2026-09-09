import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { ADMIN_EMAILS } from "@/lib/admins";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AITHERA QUIZ" },
      { name: "description", content: "Coordinator access settings for the AITHERA 2026 quiz competition." },
      { property: "og:title", content: "Settings — AITHERA QUIZ" },
      { property: "og:description", content: "Approved coordinator accounts for AITHERA QUIZ." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Who can open the coordinator area.</p>
      </div>

      <div className="surface-card space-y-4 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-primary" /> Approved coordinators
        </div>
        <ul className="space-y-2 text-sm">
          {ADMIN_EMAILS.map((email) => (
            <li key={email} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <span>{email}</span>
              {user?.email?.toLowerCase() === email.toLowerCase() && (
                <span className="text-xs text-muted-foreground">You</span>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Additional coordinators are managed centrally. Contact the event organiser to add or remove an account.
        </p>
      </div>
    </div>
  );
}
