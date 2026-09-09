import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  FilePlus2,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/questions", label: "Questions", icon: ListChecks },
  { to: "/admin/create", label: "Create quiz", icon: FilePlus2 },
  { to: "/admin/participants", label: "Participants", icon: Users },
  { to: "/admin/results", label: "Results", icon: BarChart3 },
  { to: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const { user, role, loading, checking, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || checking) return;
    if (!user) {
      void navigate({ to: "/login", replace: true });
      return;
    }
    if (role === "participant") void navigate({ to: "/participant-details", replace: true });
  }, [loading, checking, user, role, navigate]);

  if (loading || checking || !user || role !== "admin") {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Checking access…</div>;
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-sidebar-border bg-sidebar md:min-h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center gap-2 px-5 py-4 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <span className="text-sm">AITHERA QUIZ</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden px-3 md:block">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => void logout()}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
          <div className="text-sm">
            <p className="font-semibold">{user.name}</p>
            <p className="text-muted-foreground">{user.email} · Coordinator</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill />
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </header>
        <div className="px-5 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
