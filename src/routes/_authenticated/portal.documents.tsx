import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  DOCUMENT_CATEGORIES,
  createDocument,
  deleteDocument,
  getDocumentUrl,
  listDocuments,
} from "@/lib/documents.functions";
import { uploadPortalFile } from "@/lib/portal-upload";
import { PortalShell, formatDateTime } from "@/components/portal/portal-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/portal/documents")({
  component: DocumentCenter,
});

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentCenter() {
  const queryClient = useQueryClient();
  const fetchDocs = useServerFn(listDocuments);
  const saveDoc = useServerFn(createDocument);
  const signDoc = useServerFn(getDocumentUrl);
  const removeDoc = useServerFn(deleteDocument);

  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<(typeof DOCUMENT_CATEGORIES)[number]>("General");
  const [projectId, setProjectId] = useState<string>("none");
  const [busy, setBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["portal-documents"],
    queryFn: () => fetchDocs(),
  });

  const handleUpload = async (file: File) => {
    setBusy(true);
    try {
      const uploaded = await uploadPortalFile(file, "documents");
      await saveDoc({
        data: {
          name: uploaded.name,
          category,
          storagePath: uploaded.path,
          mimeType: uploaded.mime ?? undefined,
          sizeBytes: uploaded.size,
          projectId: projectId === "none" ? null : projectId,
        },
      });
      toast.success("Document uploaded.");
      queryClient.invalidateQueries({ queryKey: ["portal-documents"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDownload = async (documentId: string) => {
    setPendingId(documentId);
    try {
      const { url } = await signDoc({ data: { documentId } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the document.");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    setPendingId(documentId);
    try {
      await removeDoc({ data: { documentId } });
      toast.success("Document removed.");
      queryClient.invalidateQueries({ queryKey: ["portal-documents"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove the document.");
    } finally {
      setPendingId(null);
    }
  };

  const projects = data?.projects ?? [];
  const documents = data?.documents ?? [];

  return (
    <PortalShell
      title="Document centre"
      subtitle="Proposals, contracts, reports and shared files — stored securely."
    >
      <div className="surface-card mt-8 p-6">
        <h2 className="font-display text-lg font-semibold">Upload a document</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF, images, spreadsheets and docs up to 20MB. Only you and the InstaLoop team can open them.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <Button
              className="w-full rounded-full"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {busy ? "Uploading…" : "Choose file"}
            </Button>
          </div>
        </div>
      </div>

      <h2 className="mt-12 font-display text-xl font-bold">Your documents</h2>
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="mt-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Could not load documents."}
        </p>
      ) : documents.length === 0 ? (
        <div className="surface-card mt-4 p-8 text-center text-sm text-muted-foreground">
          No documents yet. Anything we share with you will appear here.
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="surface-card flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(doc.size_bytes)} · {formatDateTime(doc.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  {doc.category}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={pendingId === doc.id}
                  onClick={() => handleDownload(doc.id)}
                >
                  {pendingId === doc.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-muted-foreground hover:text-destructive"
                  disabled={pendingId === doc.id}
                  onClick={() => handleDelete(doc.id)}
                  aria-label={`Delete ${doc.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PortalShell>
  );
}
