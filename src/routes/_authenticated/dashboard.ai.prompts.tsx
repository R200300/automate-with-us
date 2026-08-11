import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Copy, Loader2, Pencil, Plus, Star, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import {
  PROMPT_CATEGORIES,
  type AiPrompt,
  deletePrompt,
  duplicatePrompt,
  listPrompts,
  savePrompt,
  testPrompt,
  togglePromptFavorite,
} from "@/lib/ai-prompts.functions";
import { AiShell, EmptyState } from "@/components/ai/ai-shell";
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

export const Route = createFileRoute("/_authenticated/dashboard/ai/prompts")({
  head: () => ({
    meta: [
      { title: "Prompt Library — Nexora Automation" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PromptsPage,
});

function extractVariables(body: string) {
  const found = new Set<string>();
  for (const match of body.matchAll(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g)) {
    if (match[1]) found.add(match[1]);
  }
  return [...found];
}

type FormState = {
  id?: string;
  title: string;
  category: (typeof PROMPT_CATEGORIES)[number];
  body: string;
  description: string;
};

const blank: FormState = { title: "", category: "General", body: "", description: "" };

function PromptsPage() {
  const queryClient = useQueryClient();
  const fetchAll = useServerFn(listPrompts);
  const save = useServerFn(savePrompt);
  const duplicate = useServerFn(duplicatePrompt);
  const favorite = useServerFn(togglePromptFavorite);
  const remove = useServerFn(deletePrompt);
  const runTest = useServerFn(testPrompt);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blank);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const [testTarget, setTestTarget] = useState<AiPrompt | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ text: string; rendered: string; model: string } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-prompts"],
    queryFn: () => fetchAll(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-prompts"] });
    queryClient.invalidateQueries({ queryKey: ["ai-overview"] });
  };

  const prompts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.prompts ?? []).filter((p) => {
      const matchesTerm =
        !term ||
        p.title.toLowerCase().includes(term) ||
        p.body.toLowerCase().includes(term) ||
        (p.description ?? "").toLowerCase().includes(term);
      const matchesCategory = category === "all" || p.category === category;
      return matchesTerm && matchesCategory;
    });
  }, [data, search, category]);

  const handleSave = async () => {
    setBusy(true);
    try {
      await save({
        data: {
          ...(form.id ? { id: form.id } : {}),
          title: form.title,
          category: form.category,
          body: form.body,
          description: form.description || null,
          variables: extractVariables(form.body),
        },
      });
      toast.success(form.id ? "Prompt updated." : "Prompt created.");
      setOpen(false);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the prompt.");
    } finally {
      setBusy(false);
    }
  };

  const openTest = (p: AiPrompt) => {
    setTestTarget(p);
    setValues(Object.fromEntries((p.variables.length ? p.variables : extractVariables(p.body)).map((v) => [v, ""])));
    setResult(null);
    setTestError(null);
  };

  const handleTest = async () => {
    if (!testTarget) return;
    setTesting(true);
    setTestError(null);
    try {
      const out = await runTest({ data: { body: testTarget.body, values } });
      setResult(out);
      queryClient.invalidateQueries({ queryKey: ["ai-overview"] });
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "The prompt test failed.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <AiShell
      title="Prompt Library"
      subtitle="Reusable prompts with {{variables}}, tested against the real AI gateway."
      actions={
        <Button
          className="rounded-full"
          onClick={() => {
            setForm(blank);
            setOpen(true);
          }}
        >
          <Plus className="size-4" /> New prompt
        </Button>
      }
    >
      <div className="mt-6 flex flex-wrap gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search prompts…"
          className="sm:max-w-xs"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {PROMPT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading prompts…
        </div>
      )}
      {error && (
        <p className="mt-10 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load prompts."}
        </p>
      )}

      <div className="mt-6 space-y-3">
        {!isLoading && prompts.length === 0 && (
          <EmptyState
            title="No prompts found"
            description="Create a prompt with placeholders like {{company_name}} and test it instantly."
          />
        )}
        {prompts.map((p) => (
          <div key={p.id} className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{p.title}</p>
                  <Badge variant="outline">{p.category}</Badge>
                  {p.variables.map((v) => (
                    <Badge key={v} variant="secondary" className="font-mono text-[11px]">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                </div>
                <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {p.body}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" className="rounded-full" onClick={() => openTest(p)}>
                  <Wand2 className="size-3.5" /> Test
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setForm({
                      id: p.id,
                      title: p.title,
                      category: p.category,
                      body: p.body,
                      description: p.description ?? "",
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
                    await duplicate({ data: { id: p.id } });
                    toast.success("Prompt duplicated.");
                    refresh();
                  }}
                >
                  <Copy className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await favorite({ data: { id: p.id, isFavorite: !p.is_favorite } });
                    refresh();
                  }}
                >
                  <Star
                    className={`size-3.5 ${p.is_favorite ? "fill-current text-primary" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${p.title}"?`)) return;
                    await remove({ data: { id: p.id } });
                    toast.success("Prompt deleted.");
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit prompt" : "New prompt"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as FormState["category"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROMPT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Prompt body</Label>
              <Textarea
                rows={8}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Write a follow-up email for {{company_name}} about {{service}}."
              />
              <p className="text-xs text-muted-foreground">
                Detected variables: {extractVariables(form.body).join(", ") || "none"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Save prompt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(testTarget)} onOpenChange={(v) => !v && setTestTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Test prompt · {testTarget?.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {Object.keys(values).length === 0 && (
              <p className="text-sm text-muted-foreground">
                This prompt has no variables — run it as is.
              </p>
            )}
            {Object.keys(values).map((key) => (
              <div key={key} className="grid gap-2">
                <Label className="font-mono text-xs">{`{{${key}}}`}</Label>
                <Input
                  value={values[key] ?? ""}
                  onChange={(e) => setValues({ ...values, [key]: e.target.value })}
                />
              </div>
            ))}
            {testError && <p className="text-sm text-destructive">{testError}</p>}
            {result && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Rendered prompt
                  </p>
                  <p className="mt-1 whitespace-pre-wrap rounded-xl bg-secondary p-3 text-sm">
                    {result.rendered}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    AI response ({result.model})
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{result.text}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestTarget(null)}>
              Close
            </Button>
            <Button onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}{" "}
              {result ? "Run again" : "Run prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AiShell>
  );
}
