import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Download, FileText, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  deleteKnowledgeBase,
  deleteKnowledgeDocument,
  getKnowledgeDocumentUrl,
  listKnowledge,
  registerKnowledgeDocument,
  saveKnowledgeBase,
} from "@/lib/ai-knowledge.functions";
import { uploadPortalFile } from "@/lib/portal-upload";
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

export const Route = createFileRoute("/_authenticated/dashboard/ai/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Base — Nexora Automation" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: KnowledgePage,
});

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function KnowledgePage() {
  const queryClient = useQueryClient();
  const fetchAll = useServerFn(listKnowledge);
  const saveBase = useServerFn(saveKnowledgeBase);
  const removeBase = useServerFn(deleteKnowledgeBase);
  const registerDoc = useServerFn(registerKnowledgeDocument);
  const removeDoc = useServerFn(deleteKnowledgeDocument);
  const signDoc = useServerFn(getKnowledgeDocumentUrl);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingBase, setUploadingBase] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-knowledge"],
    queryFn: () => fetchAll(),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-knowledge"] });
    queryClient.invalidateQueries({ queryKey: ["ai-overview"] });
  };

  const handleCreate = async () => {
    setBusy(true);
    try {
      await saveBase({ data: { name, description: description || null } });
      toast.success("Knowledge base created.");
      setOpen(false);
      setName("");
      setDescription("");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the knowledge base.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (baseId: string, file: File) => {
    setUploadingBase(baseId);
    try {
      const uploaded = await uploadPortalFile(file, "knowledge");
      const row = await registerDoc({
        data: {
          knowledgeBaseId: baseId,
          name: uploaded.name,
          storagePath: uploaded.path,
          mimeType: uploaded.mime ?? undefined,
          sizeBytes: uploaded.size,
        },
      });
      if (row.processing_status === "Ready") {
        toast.success(`"${row.name}" processed and ready.`);
      } else {
        toast.info("File stored. PDF/DOCX processing is currently pending.");
      }
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingBase(null);
      const el = inputRefs.current[baseId];
      if (el) el.value = "";
    }
  };

  const bases = data?.bases ?? [];
  const documents = data?.documents ?? [];

  return (
    <AiShell
      title="Knowledge Base"
      subtitle="Upload the content your assistants and chatbots should treat as the source of truth."
      actions={
        <Button className="rounded-full" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> New knowledge base
        </Button>
      }
    >
      <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <p className="font-medium">Supported extraction today: TXT, MD, CSV, JSON.</p>
        <p className="mt-1 text-muted-foreground">
          PDF/DOCX processing is currently pending — those files are stored securely and will be
          extracted automatically once the parsing pipeline is connected.
        </p>
      </div>

      {isLoading && (
        <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading knowledge bases…
        </div>
      )}
      {error && (
        <p className="mt-10 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load knowledge bases."}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {!isLoading && bases.length === 0 && (
          <EmptyState
            title="No knowledge bases yet"
            description="Create a knowledge base, upload your FAQs or price list, then link it to an assistant or chatbot."
          />
        )}
        {bases.map((base) => {
          const docs = documents.filter((d) => d.knowledge_base_id === base.id);
          return (
            <div key={base.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{base.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {base.description || "No description"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {docs.length} document{docs.length === 1 ? "" : "s"} · Created{" "}
                    {formatDateTime(base.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={(el) => {
                      inputRefs.current[base.id] = el;
                    }}
                    type="file"
                    className="hidden"
                    accept=".txt,.md,.csv,.json,.pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUpload(base.id, file);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadingBase === base.id}
                    onClick={() => inputRefs.current[base.id]?.click()}
                  >
                    {uploadingBase === base.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Upload className="size-3.5" />
                    )}{" "}
                    Upload document
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={async () => {
                      if (!window.confirm(`Delete "${base.name}" and its documents?`)) return;
                      try {
                        await removeBase({ data: { id: base.id } });
                        toast.success("Knowledge base deleted.");
                        refresh();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Delete failed.");
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              {docs.length > 0 && (
                <div className="mt-4 space-y-2">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2.5"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatSize(doc.size_bytes)} ·{" "}
                            {doc.extracted_chars > 0
                              ? `${doc.extracted_chars.toLocaleString()} characters extracted`
                              : doc.processing_error || "Not extracted yet"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={doc.processing_status} />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={pendingId === doc.id}
                          onClick={async () => {
                            setPendingId(doc.id);
                            try {
                              const { url } = await signDoc({ data: { id: doc.id } });
                              window.open(url, "_blank", "noopener");
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Download failed.");
                            } finally {
                              setPendingId(null);
                            }
                          }}
                        >
                          <Download className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={async () => {
                            if (!window.confirm(`Delete "${doc.name}"?`)) return;
                            try {
                              await removeDoc({ data: { id: doc.id } });
                              toast.success("Document deleted.");
                              refresh();
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Delete failed.");
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New knowledge base</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company FAQs" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AiShell>
  );
}
