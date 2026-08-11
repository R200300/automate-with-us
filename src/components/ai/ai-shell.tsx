import { Link } from "@tanstack/react-router";
import { NotificationBell } from "@/components/portal/portal-shell";
import { Badge } from "@/components/ui/badge";

const links = [
  { to: "/dashboard/ai", label: "Overview", exact: true },
  { to: "/dashboard/ai/assistants", label: "Assistants" },
  { to: "/dashboard/ai/chatbots", label: "Chatbots" },
  { to: "/dashboard/ai/knowledge", label: "Knowledge Base" },
  { to: "/dashboard/ai/prompts", label: "Prompt Library" },
  { to: "/dashboard/ai/workflows", label: "Workflows" },
  { to: "/dashboard/ai/voice", label: "Voice Agents" },
  { to: "/dashboard/ai/usage", label: "Usage" },
  { to: "/dashboard/ai/activity", label: "Activity" },
] as const;

export function AiNav() {
  return (
    <div className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          activeOptions={{ exact: Boolean((l as { exact?: boolean }).exact) }}
          activeProps={{ className: "bg-secondary text-foreground" }}
          className="shrink-0 snap-start whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

export function AiShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-5 lg:px-8 lg:py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            AI Automation
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <NotificationBell />
        </div>
      </div>
      <div className="mt-6 border-b pb-4">
        <AiNav />
      </div>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const statusTone: Record<string, string> = {
  Active: "bg-accent/15 text-accent-foreground border-accent/30",
  Draft: "bg-muted text-muted-foreground",
  Inactive: "bg-muted text-muted-foreground",
  Archived: "bg-muted text-muted-foreground",
  Ready: "bg-accent/15 text-accent-foreground border-accent/30",
  Pending: "bg-primary/10 text-primary border-primary/20",
  Processing: "bg-primary/10 text-primary border-primary/20",
  Failed: "bg-destructive/10 text-destructive border-destructive/20",
  Success: "bg-accent/15 text-accent-foreground border-accent/30",
  Running: "bg-primary/10 text-primary border-primary/20",
  Skipped: "bg-muted text-muted-foreground",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={statusTone[status] ?? "bg-muted text-muted-foreground"}>
      {status}
    </Badge>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <p className="font-semibold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}
