import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { getAiUsage } from "@/lib/ai-hub.functions";
import { AiShell, StatCard, formatNumber } from "@/components/ai/ai-shell";

export const Route = createFileRoute("/_authenticated/dashboard/ai/usage")({
  head: () => ({
    meta: [
      { title: "AI Usage — Nexora Automation" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: UsagePage,
});

function UsagePage() {
  const fetchUsage = useServerFn(getAiUsage);
  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-usage"],
    queryFn: () => fetchUsage(),
  });

  const usage = data?.usage;
  const limit = usage?.request_limit ?? 0;
  const used = usage?.ai_requests ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <AiShell title="Usage & Billing" subtitle="Real usage recorded server-side for every AI call.">
      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading usage…
        </div>
      )}
      {error && (
        <p className="mt-10 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load usage."}
        </p>
      )}

      {usage && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="AI Requests" value={usage.aiRequests} hint="This month" />
            <StatCard label="Chat Messages" value={usage.chatMessages} />
            <StatCard label="Workflow Runs" value={usage.workflowExecutions} />
            <StatCard label="Documents Processed" value={usage.documentsProcessed} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatCard label="Input Tokens" value={formatNumber(usage.inputTokens)} />
            <StatCard label="Output Tokens" value={formatNumber(usage.outputTokens)} />
            <StatCard label="Voice Calls" value={usage.voiceCalls} />
          </div>

          <div className="mt-6 rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold">Monthly request allowance</p>
              <p className="text-muted-foreground">
                {formatNumber(used)} / {formatNumber(limit)}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{pct}% of this month's allowance used.</p>
          </div>
        </>
      )}

      {data && data.history.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-3 font-medium">Month</th>
                <th className="p-3 font-medium">Requests</th>
                <th className="p-3 font-medium">Chat</th>
                <th className="p-3 font-medium">Workflows</th>
                <th className="p-3 font-medium">Docs</th>
                <th className="p-3 font-medium">Tokens in / out</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((row) => (
                <tr key={row.period_month} className="border-t">
                  <td className="p-3">{row.period_month}</td>
                  <td className="p-3">{formatNumber(row.ai_requests)}</td>
                  <td className="p-3">{formatNumber(row.chat_messages)}</td>
                  <td className="p-3">{formatNumber(row.workflow_executions)}</td>
                  <td className="p-3">{formatNumber(row.documents_processed)}</td>
                  <td className="p-3">
                    {formatNumber(row.input_tokens)} / {formatNumber(row.output_tokens)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AiShell>
  );
}
