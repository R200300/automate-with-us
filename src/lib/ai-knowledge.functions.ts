import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type KnowledgeBase = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type KnowledgeDocument = {
  id: string;
  knowledge_base_id: string;
  name: string;
  mime_type: string | null;
  size_bytes: number;
  storage_path: string;
  processing_status: "Pending" | "Processing" | "Ready" | "Failed";
  processing_error: string | null;
  extracted_chars: number;
  created_at: string;
};

const DOC_COLUMNS =
  "id, knowledge_base_id, name, mime_type, size_bytes, storage_path, processing_status, processing_error, extracted_chars, created_at";

export const listKnowledge = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [bases, docs] = await Promise.all([
      context.supabase
        .from("knowledge_bases")
        .select("id, name, description, created_at, updated_at")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("knowledge_documents")
        .select(DOC_COLUMNS)
        .order("created_at", { ascending: false }),
    ]);
    if (bases.error) throw new Error(bases.error.message);
    if (docs.error) throw new Error(docs.error.message);
    return {
      bases: (bases.data ?? []) as KnowledgeBase[],
      documents: (docs.data ?? []) as KnowledgeDocument[],
    };
  });

export const saveKnowledgeBase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(2).max(120),
        description: z.string().trim().max(600).optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const payload = { name: data.name, description: data.description ?? null };

    if (data.id) {
      const { error } = await context.supabase
        .from("knowledge_bases")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }

    const { data: row, error } = await context.supabase
      .from("knowledge_bases")
      .insert({ ...payload, user_id: context.userId, created_by: context.userId })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Knowledge Base Created",
      entityType: "knowledge_base",
      entityId: row?.id ?? null,
      message: `Knowledge base "${data.name}" created`,
    });
    return { id: row?.id ?? null };
  });

export const deleteKnowledgeBase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: docs } = await context.supabase
      .from("knowledge_documents")
      .select("storage_path")
      .eq("knowledge_base_id", data.id);
    const paths = (docs ?? []).map((d) => d.storage_path);
    if (paths.length > 0) await context.supabase.storage.from("portal-files").remove(paths);

    const { error } = await context.supabase.from("knowledge_bases").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const TEXT_EXTENSIONS = [".txt", ".md", ".csv", ".json"];

const registerSchema = z.object({
  knowledgeBaseId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  storagePath: z.string().trim().min(1).max(400),
  mimeType: z.string().trim().max(160).optional().nullable(),
  sizeBytes: z.number().int().min(0).max(20 * 1024 * 1024),
});

/**
 * Records an uploaded file and extracts text when the format is plain text.
 * PDF and DOCX rows stay "Pending" until a parsing pipeline is connected.
 */
export const registerKnowledgeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => registerSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { logAutomationEvent, bumpUsage } = await import("@/lib/ai-hub.server");
    const lower = data.name.toLowerCase();
    const isText =
      TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext)) ||
      (data.mimeType ?? "").startsWith("text/") ||
      data.mimeType === "application/json";

    let content: string | null = null;
    let status: KnowledgeDocument["processing_status"] = "Pending";
    let processingError: string | null = null;

    if (isText) {
      const { data: file, error } = await context.supabase.storage
        .from("portal-files")
        .download(data.storagePath);
      if (error) {
        status = "Failed";
        processingError = error.message;
      } else {
        content = (await file.text()).slice(0, 200_000);
        status = "Ready";
      }
    } else {
      processingError =
        "Text extraction for this format is not connected yet. The file is stored securely and can be re-processed later.";
    }

    const { data: row, error } = await context.supabase
      .from("knowledge_documents")
      .insert({
        user_id: context.userId,
        knowledge_base_id: data.knowledgeBaseId,
        name: data.name,
        storage_path: data.storagePath,
        mime_type: data.mimeType ?? null,
        size_bytes: data.sizeBytes,
        processing_status: status,
        processing_error: processingError,
        extracted_chars: content?.length ?? 0,
        content,
        created_by: context.userId,
      })
      .select(DOC_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (status === "Ready") await bumpUsage(context.userId, { documents_processed: 1 });
    await logAutomationEvent({
      userId: context.userId,
      eventType: "Document Uploaded",
      entityType: "knowledge_document",
      entityId: row?.id ?? null,
      message: `Document "${data.name}" uploaded (${status})`,
      level: status === "Failed" ? "error" : "info",
    });

    return row as KnowledgeDocument;
  });

export const deleteKnowledgeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("knowledge_documents")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (doc?.storage_path) {
      await context.supabase.storage.from("portal-files").remove([doc.storage_path]);
    }
    const { error } = await context.supabase.from("knowledge_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getKnowledgeDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await context.supabase
      .from("knowledge_documents")
      .select("storage_path, name")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) throw new Error("Document not found.");

    const { data: signed, error: signError } = await context.supabase.storage
      .from("portal-files")
      .createSignedUrl(doc.storage_path, 60 * 5, { download: doc.name });
    if (signError) throw new Error(signError.message);
    return { url: signed.signedUrl };
  });
