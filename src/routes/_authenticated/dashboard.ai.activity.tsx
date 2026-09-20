import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { listAutomationActivity } from "@/lib/ai-hub.functions";
import { AiShell, EmptyState } from "@/components/ai/ai-shell";
import { formatDateTime } from "@/components/portal/portal-shell";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard/ai/activity")({
  head: () => ({
    meta: [
      { title: "AI Activity — InstaLoop" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ActivityPage,
});

const LEVELS = ["all", "info", "warning", "error"] as const;

function ActivityPage() {
  const fetchLogs = useServerFn(listAutomationActivity);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-activity", level],
    queryFn: () => fetchLogs({ data: { level } }),
  });

  const logs = data?.logs ?? [];

  return (
    <AiShell
      title="Activity Log"
      subtitle="Every AI action recorded server-side, newest first."
      actions={
        <Select value={level} onValueChange={(v) => setLevel(v as (typeof LEVELS)[number])}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LEVELS.map((l) => (
              <SelectItem key={l} value={l}>
                {l === "all" ? "All levels" : l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading activity…
        </div>
      )}
      {error && (
        <p className="mt-10 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load activity."}
        </p>
      )}

      <div className="mt-6 space-y-2">
        {!isLoading && logs.length === 0 && (
          <EmptyState
            title="No activity yet"
            description="Actions appear here as soon as you create assistants, run workflows or test prompts."
          />
        )}
        {logs.map((log) => (
          <div key={log.id} className="rounded-2xl border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    log.level === "error"
                      ? "destructive"
                      : log.level === "warning"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {log.level}
                </Badge>
                <span className="text-sm font-medium">{log.message}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(log.created_at)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {log.entity_type} · {log.event_type}
            </p>
          </div>
        ))}
      </div>
    </AiShell>
  );
}
