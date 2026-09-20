import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { getAiHubOverview } from "@/lib/ai-hub.functions";
import { AiShell, EmptyState, StatCard, formatNumber } from "@/components/ai/ai-shell";
import { formatDateTime } from "@/components/portal/portal-shell";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/dashboard/ai/")({
  head: () => ({
    meta: [
      { title: "AI Automation Hub — InstaLoop" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AiOverview,
});

const shortcuts = [
  { to: "/dashboard/ai/assistants", label: "AI Assistants" },
  { to: "/dashboard/ai/chatbots", label: "AI Chatbots" },
  { to: "/dashboard/ai/knowledge", label: "Knowledge Base" },
  { to: "/dashboard/ai/prompts", label: "Prompt Library" },
  { to: "/dashboard/ai/workflows", label: "Workflows" },
  { to: "/dashboard/ai/voice", label: "Voice Agents" },
] as const;

function AiOverview() {
  const fetchOverview = useServerFn(getAiHubOverview);
  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-overview"],
    queryFn: () => fetchOverview(),
  });

  const counts = data?.counts;
  const usage = data?.usage;
  const usedPct =
    usage && usage.requestLimit > 0
      ? Math.min(100, Math.round((usage.aiRequests / usage.requestLimit) * 100))
      : 0;

  return (
    <AiShell
      title="AI Automation Hub"
      subtitle="Every number below is read live from your account — nothing is simulated."
    >
      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your automation data…
        </div>
      )}
      {error && (
        <p className="mt-10 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load the dashboard."}
        </p>
      )}

      {counts && usage && (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Active Assistants"
              value={counts.activeAssistants}
              hint={`${counts.assistants} total`}
            />
            <StatCard
              label="Active Chatbots"
              value={counts.activeChatbots}
              hint={`${counts.chatbots} total`}
            />
            <StatCard
              label="Active Workflows"
              value={counts.activeWorkflows}
              hint={`${counts.workflows} total`}
            />
            <StatCard
              label="Voice Agents"
              value={counts.voiceAgents}
              hint={`${counts.activeVoiceAgents} active`}
            />
            <StatCard label="AI Requests" value={formatNumber(usage.aiRequests)} hint="This month" />
            <StatCard
              label="Chat Messages"
              value={formatNumber(usage.chatMessages)}
              hint="This month"
            />
            <StatCard
              label="Workflow Executions"
              value={formatNumber(counts.workflowRuns)}
              hint={`${usage.workflowExecutions} this month`}
            />
            <StatCard
              label="Documents"
              value={counts.documents}
              hint={`${counts.documentsReady} ready · ${counts.knowledgeBases} knowledge bases`}
            />
          </div>

          <div className="mt-6 rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Current monthly usage</p>
                <p className="text-xs text-muted-foreground">Period {usage.period}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatNumber(usage.aiRequests)} / {formatNumber(usage.requestLimit)} AI requests
              </p>
            </div>
            <Progress value={usedPct} className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              {formatNumber(usage.inputTokens + usage.outputTokens)} tokens used ·{" "}
              {formatNumber(Math.max(0, usage.requestLimit - usage.aiRequests))} requests remaining
            </p>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {shortcuts.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="rounded-xl border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary"
              >
                {s.label}
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="font-display text-lg font-semibold">Recent activity</h2>
            <div className="mt-3 space-y-2">
              {data.recentActivity.length === 0 ? (
                <EmptyState
                  title="No activity yet"
                  description="Create an assistant, run a workflow or test a chatbot and events will appear here."
                />
              ) : (
                data.recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.event_type} · {log.entity_type}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </AiShell>
  );
}
