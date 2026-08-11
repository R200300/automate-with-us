import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Loader2, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AI_LANGUAGES,
  AI_TONES,
  type AiAssistant,
  deleteAssistant,
  duplicateAssistant,
  listAssistants,
  saveAssistant,
  setAssistantStatus,
} from "@/lib/ai-assistants.functions";
import { AiShell, EmptyState, StatusPill } from "@/components/ai/ai-shell";
import { formatDateTime } from "@/components/portal/portal-shell";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/_authenticated/dashboard/ai/assistants")({
  head: () => ({
    meta: [
      { title: "AI Assistants — Nexora Automation" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssistantsPage,
});

type FormState = {
  id?: string;
  name: string;
  description: string;
  systemInstructions: string;
  tone: string;
  language: string;
  objective: string;
  fallbackBehavior: string;
  knowledgeBaseId: string;
  status: AiAssistant["status"];
};

const blank: FormState = {
  name: "",
  description: "",
  systemInstructions: "",
  tone: "Professional",
  language: "English",
  objective: "",
  fallbackBehavior: "",
  knowledgeBaseId: "none",
  status: "Draft",
};

function AssistantsPage() {
  const queryClient = useQueryClient();
  const fetchAll = useServerFn(listAssistants);
  const save = useServerFn(saveAssistant);
  const duplicate = useServerFn(duplicateAssistant);
  const setStatus = useServerFn(setAssistantStatus);
  const remove = useServerFn(deleteAssistant);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blank);
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AiAssistant | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-assistants"],
    queryFn: () => fetchAll(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-assistants"] });
    queryClient.invalidateQueries({ queryKey: ["ai-overview"] });
  };

  const openCreate = () => {
    setForm(blank);
    setOpen(true);
  };

  const openEdit = (a: AiAssistant) => {
    setForm({
      id: a.id,
      name: a.name,
      description: a.description ?? "",
      systemInstructions: a.system_instructions,
      tone: a.tone,
      language: a.language,
      objective: a.objective ?? "",
      fallbackBehavior: a.fallback_behavior ?? "",
      knowledgeBaseId: a.knowledge_base_id ?? "none",
      status: a.status,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      await save({
        data: {
          ...(form.id ? { id: form.id } : {}),
          name: form.name,
          description: form.description || null,
          systemInstructions: form.systemInstructions,
          tone: form.tone,
          language: form.language,
          objective: form.objective || null,
          fallbackBehavior: form.fallbackBehavior || null,
          knowledgeBaseId: form.knowledgeBaseId === "none" ? null : form.knowledgeBaseId,
          status: form.status,
        },
      });
      toast.success(form.id ? "Assistant updated." : "Assistant created.");
      setOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the assistant.");
    } finally {
      setBusy(false);
    }
  };

  const act = async (id: string, fn: () => Promise<unknown>, message: string) => {
    setPendingId(id);
    try {
      await fn();
      toast.success(message);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setPendingId(null);
    }
  };

  const assistants = data?.assistants ?? [];

  return (
    <AiShell
      title="AI Assistants"
      subtitle="Configure the reasoning, tone and guardrails your automations use."
      actions={
        <Button onClick={openCreate} className="rounded-full">
          <Plus className="size-4" /> New assistant
        </Button>
      }
    >
      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading assistants…
        </div>
      )}
      {error && (
        <p className="mt-10 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load assistants."}
        </p>
      )}

      <div className="mt-8 space-y-3">
        {!isLoading && assistants.length === 0 && (
          <EmptyState
            title="No assistants yet"
            description="Create your first assistant to define how your AI should answer, in which language and with which fallback."
          />
        )}
        {assistants.map((a) => (
          <div key={a.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{a.name}</p>
                  <StatusPill status={a.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {a.description || "No description"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {a.tone} · {a.language} · Updated {formatDateTime(a.updated_at)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetail(a)}>
                  Details
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(a)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingId === a.id}
                  onClick={() =>
                    act(a.id, () => duplicate({ data: { id: a.id } }), "Assistant duplicated.")
                  }
                >
                  <Copy className="size-3.5" /> Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingId === a.id}
                  onClick={() =>
                    act(
                      a.id,
                      () =>
                        setStatus({
                          data: { id: a.id, status: a.status === "Active" ? "Inactive" : "Active" },
                        }),
                      a.status === "Active" ? "Assistant deactivated." : "Assistant activated.",
                    )
                  }
                >
                  <Power className="size-3.5" /> {a.status === "Active" ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={pendingId === a.id}
                  onClick={() => {
                    if (!window.confirm(`Delete "${a.name}"? This cannot be undone.`)) return;
                    void act(a.id, () => remove({ data: { id: a.id } }), "Assistant deleted.");
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit assistant" : "New assistant"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Front desk assistant"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instructions">System instructions</Label>
              <Textarea
                id="instructions"
                rows={6}
                value={form.systemInstructions}
                onChange={(e) => setForm({ ...form, systemInstructions: e.target.value })}
                placeholder="You help customers book appointments…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tone</Label>
                <Select value={form.tone} onValueChange={(v) => setForm({ ...form, tone: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_TONES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Language</Label>
                <Select
                  value={form.language}
                  onValueChange={(v) => setForm({ ...form, language: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="objective">Primary objective</Label>
              <Input
                id="objective"
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
                placeholder="Book a discovery call"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fallback">Fallback behaviour</Label>
              <Textarea
                id="fallback"
                rows={2}
                value={form.fallbackBehavior}
                onChange={(e) => setForm({ ...form, fallbackBehavior: e.target.value })}
                placeholder="Say a specialist will follow up by email."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Knowledge base</Label>
                <Select
                  value={form.knowledgeBaseId}
                  onValueChange={(v) => setForm({ ...form, knowledgeBaseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(data?.knowledgeBases ?? []).map((kb) => (
                      <SelectItem key={kb.id} value={kb.id}>
                        {kb.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as FormState["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Draft", "Active", "Inactive", "Archived"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Save assistant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{detail?.name}</DialogTitle>
          </DialogHeader>
          {detail && (
            <dl className="space-y-3 text-sm">
              {[
                ["Status", detail.status],
                ["Tone", detail.tone],
                ["Language", detail.language],
                ["Model", detail.model],
                ["Objective", detail.objective || "—"],
                ["Fallback", detail.fallback_behavior || "—"],
                ["System instructions", detail.system_instructions || "—"],
                ["Created", formatDateTime(detail.created_at)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {k}
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </AiShell>
  );
}
