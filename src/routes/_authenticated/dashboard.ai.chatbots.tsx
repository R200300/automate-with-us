import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Loader2, MessageSquare, Pencil, Plus, Power, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AI_LANGUAGES,
  AI_TONES,
  type AiChatbot,
  deleteChatbot,
  listChatbots,
  saveChatbot,
  setChatbotStatus,
} from "@/lib/ai-assistants.functions";
import { runAiChat } from "@/lib/ai-chat.functions";
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

export const Route = createFileRoute("/_authenticated/dashboard/ai/chatbots")({
  head: () => ({
    meta: [
      { title: "AI Chatbots — InstaLoop" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatbotsPage,
});

type FormState = {
  id?: string;
  name: string;
  welcomeMessage: string;
  systemPrompt: string;
  tone: string;
  language: string;
  businessInfo: string;
  contactInfo: string;
  workingHours: string;
  fallbackMessage: string;
  assistantId: string;
  knowledgeBaseId: string;
  status: AiChatbot["status"];
};

const blank: FormState = {
  name: "",
  welcomeMessage: "Hi! How can I help you today?",
  systemPrompt: "",
  tone: "Friendly",
  language: "English",
  businessInfo: "",
  contactInfo: "",
  workingHours: "",
  fallbackMessage: "I'm not sure about that yet — a specialist will follow up with you.",
  assistantId: "none",
  knowledgeBaseId: "none",
  status: "Draft",
};

type ChatMessage = { role: "user" | "assistant"; content: string };

function ChatbotsPage() {
  const queryClient = useQueryClient();
  const fetchAll = useServerFn(listChatbots);
  const save = useServerFn(saveChatbot);
  const setStatus = useServerFn(setChatbotStatus);
  const remove = useServerFn(deleteChatbot);
  const chat = useServerFn(runAiChat);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blank);
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const [testBot, setTestBot] = useState<AiChatbot | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-chatbots"],
    queryFn: () => fetchAll(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-chatbots"] });
    queryClient.invalidateQueries({ queryKey: ["ai-overview"] });
  };

  const toPayload = (f: FormState) => ({
    name: f.name,
    welcomeMessage: f.welcomeMessage,
    systemPrompt: f.systemPrompt,
    tone: f.tone,
    language: f.language,
    businessInfo: f.businessInfo || null,
    contactInfo: f.contactInfo || null,
    workingHours: f.workingHours || null,
    fallbackMessage: f.fallbackMessage,
    assistantId: f.assistantId === "none" ? null : f.assistantId,
    knowledgeBaseId: f.knowledgeBaseId === "none" ? null : f.knowledgeBaseId,
    status: f.status,
  });

  const fromRow = (b: AiChatbot): FormState => ({
    id: b.id,
    name: b.name,
    welcomeMessage: b.welcome_message,
    systemPrompt: b.system_prompt,
    tone: b.tone,
    language: b.language,
    businessInfo: b.business_info ?? "",
    contactInfo: b.contact_info ?? "",
    workingHours: b.working_hours ?? "",
    fallbackMessage: b.fallback_message,
    assistantId: b.assistant_id ?? "none",
    knowledgeBaseId: b.knowledge_base_id ?? "none",
    status: b.status,
  });

  const handleSave = async () => {
    setBusy(true);
    try {
      await save({ data: { ...(form.id ? { id: form.id } : {}), ...toPayload(form) } });
      toast.success(form.id ? "Chatbot updated." : "Chatbot created.");
      setOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the chatbot.");
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

  const openTest = (bot: AiChatbot) => {
    setTestBot(bot);
    setMessages([{ role: "assistant", content: bot.welcome_message }]);
    setInput("");
    setChatError(null);
    setLastSent(null);
  };

  const send = async (text: string, history?: ChatMessage[]) => {
    if (!testBot || !text.trim()) return;
    const base = history ?? messages;
    const next = [...base, { role: "user" as const, content: text.trim() }];
    setMessages(next);
    setInput("");
    setLastSent(text.trim());
    setChatError(null);
    setThinking(true);
    try {
      const result = await chat({
        data: {
          target: "chatbot",
          id: testBot.id,
          messages: next.filter((m) => m.content.trim().length > 0).slice(-20),
        },
      });
      setMessages([...next, { role: "assistant", content: result.text }]);
      queryClient.invalidateQueries({ queryKey: ["ai-overview"] });
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "The AI request failed.");
    } finally {
      setThinking(false);
    }
  };

  const retry = () => {
    if (!lastSent) return;
    const trimmed = [...messages];
    while (trimmed.length && trimmed[trimmed.length - 1]?.role === "user") trimmed.pop();
    void send(lastSent, trimmed);
  };

  const chatbots = data?.chatbots ?? [];

  return (
    <AiShell
      title="AI Chatbots"
      subtitle="Website chat assistants powered by your secure server-side AI gateway."
      actions={
        <Button
          className="rounded-full"
          onClick={() => {
            setForm(blank);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> New chatbot
        </Button>
      }
    >
      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading chatbots…
        </div>
      )}
      {error && (
        <p className="mt-10 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load chatbots."}
        </p>
      )}

      <div className="mt-8 space-y-3">
        {!isLoading && chatbots.length === 0 && (
          <EmptyState
            title="No chatbots yet"
            description="Create a chatbot, add your business details, then open the test chat to talk to it for real."
          />
        )}
        {chatbots.map((b) => (
          <div key={b.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{b.name}</p>
                  <StatusPill status={b.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{b.welcome_message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {b.tone} · {b.language} · Updated {formatDateTime(b.updated_at)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" className="rounded-full" onClick={() => openTest(b)}>
                  <MessageSquare className="size-3.5" /> Test chat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setForm(fromRow(b));
                    setOpen(true);
                  }}
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingId === b.id}
                  onClick={() =>
                    act(
                      b.id,
                      () =>
                        save({
                          data: {
                            ...toPayload(fromRow(b)),
                            name: `${b.name} (copy)`,
                            status: "Draft",
                          },
                        }),
                      "Chatbot duplicated.",
                    )
                  }
                >
                  <Copy className="size-3.5" /> Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pendingId === b.id}
                  onClick={() =>
                    act(
                      b.id,
                      () =>
                        setStatus({
                          data: { id: b.id, status: b.status === "Active" ? "Inactive" : "Active" },
                        }),
                      b.status === "Active" ? "Chatbot deactivated." : "Chatbot activated.",
                    )
                  }
                >
                  <Power className="size-3.5" /> {b.status === "Active" ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={pendingId === b.id}
                  onClick={() => {
                    if (!window.confirm(`Delete "${b.name}"?`)) return;
                    void act(b.id, () => remove({ data: { id: b.id } }), "Chatbot deleted.");
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Configuration dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit chatbot" : "New chatbot"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Website chatbot"
              />
            </div>
            <div className="grid gap-2">
              <Label>Welcome message</Label>
              <Input
                value={form.welcomeMessage}
                onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>System prompt</Label>
              <Textarea
                rows={5}
                value={form.systemPrompt}
                onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
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
              <Label>Business information</Label>
              <Textarea
                rows={3}
                value={form.businessInfo}
                onChange={(e) => setForm({ ...form, businessInfo: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Contact details</Label>
                <Input
                  value={form.contactInfo}
                  onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Working hours</Label>
                <Input
                  value={form.workingHours}
                  onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
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
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Assistant</Label>
                <Select
                  value={form.assistantId}
                  onValueChange={(v) => setForm({ ...form, assistantId: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(data?.assistants ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              {busy && <Loader2 className="size-4 animate-spin" />} Save chatbot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test chat */}
      <Dialog open={Boolean(testBot)} onOpenChange={(v) => !v && setTestBot(null)}>
        <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Test chat · {testBot?.name}</DialogTitle>
          </DialogHeader>
          <div className="min-h-[240px] flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground"
                      : "max-w-[95%] whitespace-pre-wrap text-sm text-foreground"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}
            {thinking && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Thinking…
              </p>
            )}
            {chatError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm text-destructive">{chatError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={retry}>
                  <RotateCcw className="size-3.5" /> Retry
                </Button>
              </div>
            )}
          </div>
          <form
            className="flex items-end gap-2 border-t pt-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <Textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your chatbot something…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
            />
            <Button type="submit" size="sm" disabled={thinking || !input.trim()}>
              Send
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AiShell>
  );
}
