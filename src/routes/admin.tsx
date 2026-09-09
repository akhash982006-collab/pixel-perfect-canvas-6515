import { useEffect } from "react";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { BarChart3, FilePlus2, GraduationCap, LayoutDashboard, ListChecks, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { useTeacherAuth } from "@/hooks/use-teacher-auth";

export const Route = createFileRoute("/admin")({
  component: TeacherLayout,
});

const nav = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/questions", label: "My quizzes", icon: ListChecks, exact: false },
  { to: "/admin/create", label: "Create quiz", icon: FilePlus2, exact: false },
  { to: "/admin/results", label: "Results", icon: BarChart3, exact: false },
] as const;

function TeacherLayout() {
  const { teacher, loading, logout } = useTeacherAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !teacher) navigate({ to: "/login" });
  }, [loading, teacher, navigate]);

  if (loading || !teacher) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-sidebar-border bg-sidebar md:min-h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center gap-2 px-5 py-4 font-semibold">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <span className="text-sm">Offline Quiz</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
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
            <LogOut className="size-4" /> Logout
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
          <div className="text-sm">
            <p className="font-semibold">{teacher.name}</p>
            <p className="text-muted-foreground">{teacher.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill />
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => void logout()}>
              Logout
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
