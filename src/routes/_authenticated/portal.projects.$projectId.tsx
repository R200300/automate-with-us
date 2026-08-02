import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CalendarDays, CircleDot, Loader2, Users } from "lucide-react";
import { getPortalProject, PROJECT_STATUSES } from "@/lib/portal.functions";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/portal/projects/$projectId")({
  component: ProjectDetail,
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const fetchProject = useServerFn(getPortalProject);

  const { data, isLoading, error } = useQuery({
    queryKey: ["portal-project", projectId],
    queryFn: () => fetchProject({ data: { projectId } }),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Project unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "This project could not be loaded."}
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link to="/portal">Back to portal</Link>
        </Button>
      </div>
    );
  }

  const { project, timeline } = data;
  const currentIndex = PROJECT_STATUSES.indexOf(project.status);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 lg:px-8">
      <Link
        to="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to portal
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{project.service_type}</p>
        </div>
        <Badge className="rounded-full border-0 bg-primary/10 text-primary">{project.status}</Badge>
      </div>

      {project.description && (
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
      )}

      <div className="surface-card mt-8 p-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Overall progress</span>
          <span className="font-display text-lg font-bold">{project.progress}%</span>
        </div>
        <Progress value={project.progress} />

        <ol className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {PROJECT_STATUSES.map((stage, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <li key={stage} className="flex items-start gap-2">
                <span
                  className={`mt-0.5 size-2.5 shrink-0 rounded-full ${
                    done ? "bg-accent" : active ? "bg-primary" : "bg-border"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    done || active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {stage}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <CalendarDays className="size-5 text-primary" />
          <p className="mt-3 text-xs text-muted-foreground">Start date</p>
          <p className="font-semibold">{formatDate(project.start_date)}</p>
        </div>
        <div className="surface-card p-5">
          <CalendarDays className="size-5 text-primary" />
          <p className="mt-3 text-xs text-muted-foreground">Expected completion</p>
          <p className="font-semibold">{formatDate(project.expected_completion)}</p>
        </div>
        <div className="surface-card p-5">
          <Users className="size-5 text-primary" />
          <p className="mt-3 text-xs text-muted-foreground">Assigned team</p>
          <p className="font-semibold">
            {project.assigned_team.length > 0 ? project.assigned_team.join(", ") : "Being assigned"}
          </p>
        </div>
      </div>

      <h2 className="mt-12 font-display text-xl font-bold">Project timeline</h2>
      {timeline.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No updates yet. Your project manager posts milestones here as work progresses.
        </p>
      ) : (
        <ol className="mt-5 space-y-5 border-l border-border pl-6">
          {timeline.map((entry) => (
            <li key={entry.id} className="relative">
              <CircleDot className="absolute -left-[31px] top-0.5 size-4 bg-background text-primary" />
              <p className="text-xs text-muted-foreground">{formatDate(entry.event_date)}</p>
              <p className="font-semibold">{entry.title}</p>
              {entry.description && (
                <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
