import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Pencil, Play, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  NODE_KINDS,
  WORKFLOW_ACTIONS,
  WORKFLOW_TRIGGERS,
  type NodeKind,
  type Workflow,
  type WorkflowAction,
  deleteWorkflow,
  listWorkflows,
  runWorkflow,
  saveWorkflow,
  toggleWorkflow,
} from "@/lib/ai-workflows.functions";
import { AiShell, EmptyState, StatusPill } from "@/components/ai/ai-shell";
import { formatDateTime } from "@/components/portal/portal-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard/ai/workflows")({
  head: () => ({
    meta: [
      { title: "Workflows — Nexora Automation" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WorkflowsPage,
});

type NodeDraft = {
  kind: NodeKind;
  label: string;
  actionType: WorkflowAction | null;
  configText: string;
};

type FormState = {
  id?: string;
  name: string;
  description: string;
  triggerType: (typeof WORKFLOW_TRIGGERS)[number];
  nodes: NodeDraft[];
};

const blank: FormState = {
  name: "",
  description: "",
  triggerType: "New Lead",
  nodes: [
    { kind: "trigger", label: "New lead received", actionType: null, configText: "" },
    {
      kind: "action",
      label: "Notify the team",
      actionType: "Send Notification",
      configText: "title=New lead\nmessage=A new lead arrived",
    },
    { kind: "end", label: "Finish", actionType: null, configText: "" },
  ],
};

function parseConfig(text: string) {
  const config: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const index = line.indexOf("=");
    if (index <= 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key) config[key] = value;
  }
  return config;
}

function stringifyConfig(config: Record<string, string>) {
  return Object.entries(config ?? {})
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

function WorkflowsPage() {
  const queryClient = useQueryClient();
  const fetchAll = useServerFn(listWorkflows);
  const save = useServerFn(saveWorkflow);
  const toggle = useServerFn(toggleWorkflow);
  const remove = useServerFn(deleteWorkflow);
  const run = useServerFn(runWorkflow);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blank);
  const [busy, setBusy] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<Workflow | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-workflows"],
    queryFn: () => fetchAll(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-workflows"] });
    queryClient.invalidateQueries({ queryKey: ["ai-overview"] });
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await save({
        data: {
          ...(form.id ? { id: form.id } : {}),
          name: form.name,
          description: form.description || null,
          triggerType: form.triggerType,
          nodes: form.nodes.map((n) => ({
            kind: n.kind,
            label: n.label,
            actionType: n.kind === "action" ? n.actionType : null,
            config: parseConfig(n.configText),
          })),
        },
      });
      toast.success(form.id ? "Workflow updated." : "Workflow created.");
      setOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the workflow.");
    } finally {
      setBusy(false);
    }
  };

  const workflows = data?.workflows ?? [];
  const nodes = data?.nodes ?? [];
  const executions = data?.executions ?? [];

  return (
    <AiShell
      title="Workflows"
      subtitle="Trigger → action → condition → end. Test runs use the real server-side execution engine."
      actions={
        <Button
          className="rounded-full"
          onClick={() => {
            setForm(blank);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> New workflow
        </Button>
      }
    >
      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading workflows…
        </div>
      )}
      {error && (
        <p className="mt-10 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load workflows."}
        </p>
      )}

      <div className="mt-8 space-y-3">
        {!isLoading && workflows.length === 0 && (
          <EmptyState
            title="No workflows yet"
            description="Build your first automation: pick a trigger, add actions, then run a live test."
          />
        )}
        {workflows.map((w) => {
          const wfNodes = nodes.filter((n) => n.workflow_id === w.id);
          return (
            <div key={w.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{w.name}</p>
                    <StatusPill status={w.is_active ? "Active" : "Inactive"} />
                    <Badge variant="outline">{w.trigger_type}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {w.description || "No description"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {w.run_count} run{w.run_count === 1 ? "" : "s"}
                    {w.last_run_at ? ` · Last run ${formatDateTime(w.last_run_at)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={runningId === w.id}
                    onClick={async () => {
                      setRunningId(w.id);
                      try {
                        const result = await run({ data: { id: w.id, payload: {} } });
                        toast.success(`Test run finished: ${result.status ?? "Completed"}`);
                        refresh();
                        setHistoryFor(w);
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Execution failed.");
                      } finally {
                        setRunningId(null);
                      }
                    }}
                  >
                    {runningId === w.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5" />
                    )}{" "}
                    Execute test
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setHistoryFor(w)}>
                    History
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setForm({
                        id: w.id,
                        name: w.name,
                        description: w.description ?? "",
                        triggerType: w.trigger_type,
                        nodes: wfNodes.map((n) => ({
                          kind: n.kind,
                          label: n.label,
                          actionType: n.action_type,
                          configText: stringifyConfig(n.config),
                        })),
                      });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await toggle({ data: { id: w.id, isActive: !w.is_active } });
                      toast.success(w.is_active ? "Workflow deactivated." : "Workflow activated.");
                      refresh();
                    }}
                  >
                    <Power className="size-3.5" /> {w.is_active ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={async () => {
                      if (!window.confirm(`Delete "${w.name}"?`)) return;
                      await remove({ data: { id: w.id } });
                      toast.success("Workflow deleted.");
                      refresh();
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {wfNodes.length === 0 && (
                  <p className="text-xs text-muted-foreground">No nodes configured yet.</p>
                )}
                {wfNodes.map((n, i) => (
                  <div key={n.id} className="flex items-center gap-2">
                    <div className="rounded-xl border bg-background px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {n.kind}
                      </p>
                      <p className="text-sm font-medium">{n.label}</p>
                      {n.action_type && (
                        <p className="text-xs text-muted-foreground">{n.action_type}</p>
                      )}
                    </div>
                    {i < wfNodes.length - 1 && (
                      <span className="text-muted-foreground">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit workflow" : "New workflow"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Trigger</Label>
              <Select
                value={form.triggerType}
                onValueChange={(v) =>
                  setForm({ ...form, triggerType: v as FormState["triggerType"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKFLOW_TRIGGERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Steps</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm({
                      ...form,
                      nodes: [
                        ...form.nodes,
                        { kind: "action", label: "New step", actionType: "Send Email", configText: "" },
                      ],
                    })
                  }
                >
                  <Plus className="size-3.5" /> Add step
                </Button>
              </div>
              {form.nodes.map((node, index) => (
                <div key={index} className="rounded-xl border p-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Select
                      value={node.kind}
                      onValueChange={(v) => {
                        const next = [...form.nodes];
                        next[index] = { ...node, kind: v as NodeKind };
                        setForm({ ...form, nodes: next });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NODE_KINDS.map((k) => (
                          <SelectItem key={k} value={k}>
                            {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={node.label}
                      placeholder="Step label"
                      onChange={(e) => {
                        const next = [...form.nodes];
                        next[index] = { ...node, label: e.target.value };
                        setForm({ ...form, nodes: next });
                      }}
                    />
                    {node.kind === "action" ? (
                      <Select
                        value={node.actionType ?? "Send Email"}
                        onValueChange={(v) => {
                          const next = [...form.nodes];
                          next[index] = { ...node, actionType: v as WorkflowAction };
                          setForm({ ...form, nodes: next });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WORKFLOW_ACTIONS.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() =>
                          setForm({
                            ...form,
                            nodes: form.nodes.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <Trash2 className="size-3.5" /> Remove
                      </Button>
                    )}
                  </div>
                  <Textarea
                    rows={2}
                    className="mt-3 font-mono text-xs"
                    placeholder="key=value per line"
                    value={node.configText}
                    onChange={(e) => {
                      const next = [...form.nodes];
                      next[index] = { ...node, configText: e.target.value };
                      setForm({ ...form, nodes: next });
                    }}
                  />
                  {node.kind === "action" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-destructive"
                      onClick={() =>
                        setForm({ ...form, nodes: form.nodes.filter((_, i) => i !== index) })
                      }
                    >
                      <Trash2 className="size-3.5" /> Remove step
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Save workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyFor)} onOpenChange={(v) => !v && setHistoryFor(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Execution history · {historyFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {executions.filter((e) => e.workflow_id === historyFor?.id).length === 0 && (
              <p className="text-sm text-muted-foreground">No executions recorded yet.</p>
            )}
            {executions
              .filter((e) => e.workflow_id === historyFor?.id)
              .map((e) => (
                <div key={e.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <StatusPill status={e.status} />
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(e.started_at)}
                      {e.duration_ms != null ? ` · ${e.duration_ms}ms` : ""}
                    </span>
                  </div>
                  {e.error && <p className="mt-2 text-sm text-destructive">{e.error}</p>}
                  <ul className="mt-2 space-y-1">
                    {(e.steps ?? []).map((s, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium">{s.label}</span>{" "}
                        <span className="text-muted-foreground">
                          · {s.status}
                          {s.detail ? ` · ${s.detail}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </AiShell>
  );
}
