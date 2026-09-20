import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AI_LANGUAGES,
  AI_VOICES,
  type AiVoiceAgent,
  deleteVoiceAgent,
  listVoiceAgents,
  saveVoiceAgent,
  setVoiceAgentStatus,
} from "@/lib/ai-assistants.functions";
import { AiShell, EmptyState, StatCard, StatusPill } from "@/components/ai/ai-shell";
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

export const Route = createFileRoute("/_authenticated/dashboard/ai/voice")({
  head: () => ({
    meta: [
      { title: "Voice Agents — InstaLoop" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VoicePage,
});

type FormState = {
  id?: string;
  name: string;
  businessName: string;
  voice: string;
  language: string;
  systemInstructions: string;
  greeting: string;
  fallbackMessage: string;
  businessHours: string;
  callObjective: string;
  status: AiVoiceAgent["status"];
};

const blank: FormState = {
  name: "",
  businessName: "",
  voice: "Aria",
  language: "English",
  systemInstructions: "",
  greeting: "Thanks for calling — how can I help?",
  fallbackMessage: "Let me pass you to a human specialist.",
  businessHours: "",
  callObjective: "",
  status: "Draft",
};

function VoicePage() {
  const queryClient = useQueryClient();
  const fetchAll = useServerFn(listVoiceAgents);
  const save = useServerFn(saveVoiceAgent);
  const setStatus = useServerFn(setVoiceAgentStatus);
  const remove = useServerFn(deleteVoiceAgent);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blank);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-voice-agents"],
    queryFn: () => fetchAll(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-voice-agents"] });
    queryClient.invalidateQueries({ queryKey: ["ai-overview"] });
  };

  const agents = data?.agents ?? [];
  const totals = agents.reduce(
    (acc, a) => ({
      calls: acc.calls + a.total_calls,
      success: acc.success + a.successful_calls,
      missed: acc.missed + a.missed_calls,
      seconds: acc.seconds + a.total_call_seconds,
    }),
    { calls: 0, success: 0, missed: 0, seconds: 0 },
  );

  const handleSave = async () => {
    setBusy(true);
    try {
      await save({
        data: {
          ...(form.id ? { id: form.id } : {}),
          name: form.name,
          businessName: form.businessName || null,
          voice: form.voice,
          language: form.language,
          systemInstructions: form.systemInstructions,
          greeting: form.greeting || null,
          fallbackMessage: form.fallbackMessage || null,
          businessHours: form.businessHours || null,
          callObjective: form.callObjective || null,
          status: form.status,
        },
      });
      toast.success(form.id ? "Voice agent updated." : "Voice agent created.");
      setOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the voice agent.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AiShell
      title="Voice Agents"
      subtitle="Configure your phone agents now, connect a telephony provider later."
      actions={
        <Button
          className="rounded-full"
          onClick={() => {
            setForm(blank);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> New voice agent
        </Button>
      }
    >
      <div className="mt-6 rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
        <p className="text-sm font-semibold text-destructive">Voice provider not connected</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Voice calls are not operational yet. Agent settings are saved and ready, and call metrics
          below stay at zero until an external voice/telephony provider is connected.
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Calls" value={totals.calls} hint="From provider webhooks" />
        <StatCard label="Successful Calls" value={totals.success} />
        <StatCard label="Missed Calls" value={totals.missed} />
        <StatCard
          label="Call Duration"
          value={`${Math.round(totals.seconds / 60)} min`}
          hint="Total across agents"
        />
      </div>

      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading voice agents…
        </div>
      )}
      {error && (
        <p className="mt-10 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load voice agents."}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {!isLoading && agents.length === 0 && (
          <EmptyState
            title="No voice agents yet"
            description="Create an agent with its greeting, objective and business hours so it is ready the day a provider is connected."
          />
        )}
        {agents.map((a) => (
          <div key={a.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{a.name}</p>
                  <StatusPill status={a.status} />
                </div>
                <dl className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>Voice: {a.voice}</div>
                  <div>Language: {a.language}</div>
                  <div>Greeting: {a.greeting || "—"}</div>
                  <div>Objective: {a.call_objective || "—"}</div>
                  <div>Business hours: {a.business_hours || "—"}</div>
                  <div>Provider: {a.provider || "Not connected"}</div>
                </dl>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setForm({
                      id: a.id,
                      name: a.name,
                      businessName: a.business_name ?? "",
                      voice: a.voice,
                      language: a.language,
                      systemInstructions: a.system_instructions,
                      greeting: a.greeting ?? "",
                      fallbackMessage: a.fallback_message ?? "",
                      businessHours: a.business_hours ?? "",
                      callObjective: a.call_objective ?? "",
                      status: a.status,
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
                    await setStatus({
                      data: { id: a.id, status: a.status === "Active" ? "Inactive" : "Active" },
                    });
                    refresh();
                  }}
                >
                  <Power className="size-3.5" /> {a.status === "Active" ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${a.name}"?`)) return;
                    await remove({ data: { id: a.id } });
                    toast.success("Voice agent deleted.");
                    refresh();
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-5">
        <p className="font-semibold">Provider configuration</p>
        <p className="mt-1 text-sm text-muted-foreground">
          When you are ready, tell us which provider you use (for example Twilio, Vapi, Retell or
          ElevenLabs). We store the API credentials as server-side secrets — never in the browser —
          and wire call webhooks into these agents so the metrics above become live.
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit voice agent" : "New voice agent"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Business name</Label>
                <Input
                  value={form.businessName}
                  onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Voice</Label>
                <Select value={form.voice} onValueChange={(v) => setForm({ ...form, voice: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_VOICES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
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
              <Label>System instructions</Label>
              <Textarea
                rows={5}
                value={form.systemInstructions}
                onChange={(e) => setForm({ ...form, systemInstructions: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Greeting</Label>
              <Input
                value={form.greeting}
                onChange={(e) => setForm({ ...form, greeting: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Call objective</Label>
                <Input
                  value={form.callObjective}
                  onChange={(e) => setForm({ ...form, callObjective: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Business hours</Label>
                <Input
                  value={form.businessHours}
                  onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Fallback message</Label>
              <Input
                value={form.fallbackMessage}
                onChange={(e) => setForm({ ...form, fallbackMessage: e.target.value })}
              />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Save agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AiShell>
  );
}
