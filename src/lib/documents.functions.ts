import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DOCUMENT_CATEGORIES = [
  "Proposal",
  "Contract",
  "Invoice",
  "Report",
  "Asset",
  "General",
] as const;

export type PortalDocument = {
  id: string;
  owner_id: string;
  project_id: string | null;
  name: string;
  category: string;
  mime_type: string | null;
  size_bytes: number;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
};

const DOC_COLUMNS =
  "id, owner_id, project_id, name, category, mime_type, size_bytes, storage_path, uploaded_by, created_at";

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("documents")
      .select(DOC_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: projects } = await context.supabase
      .from("projects")
      .select("id, name")
      .order("created_at", { ascending: false });

    return {
      documents: (data ?? []) as PortalDocument[],
      projects: (projects ?? []) as Array<{ id: string; name: string }>,
    };
  });

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.enum(DOCUMENT_CATEGORIES),
  storagePath: z.string().trim().min(1).max(400),
  mimeType: z.string().trim().max(160).optional(),
  sizeBytes: z.number().int().min(0).max(50 * 1024 * 1024),
  projectId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().optional(),
});

/** Records an already-uploaded storage object as a document row. */
export const createDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof createSchema>) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = (roles ?? []).some((r) => r.role === "admin");
    const ownerId = isAdmin && data.ownerId ? data.ownerId : context.userId;

    const { data: row, error } = await context.supabase
      .from("documents")
      .insert({
        owner_id: ownerId,
        project_id: data.projectId ?? null,
        name: data.name,
        category: data.category,
        mime_type: data.mimeType ?? null,
        size_bytes: data.sizeBytes,
        storage_path: data.storagePath,
        uploaded_by: context.userId,
      })
      .select(DOC_COLUMNS)
      .single();
    if (error) throw new Error(error.message);

    if (ownerId !== context.userId) {
      const { createNotification, sendPortalEmail, getUserEmail } = await import(
        "./portal-notify.server"
      );
      await createNotification({
        userId: ownerId,
        type: "document",
        title: "New document shared",
        message: `${data.name} is now available in your document centre.`,
        link: "/portal/documents",
      });
      const email = await getUserEmail(ownerId);
      if (email) {
        await sendPortalEmail({
          to: email,
          subject: "A new document was shared with you | InstaLoop",
          heading: "New document shared",
          intro: `${data.name} has been added to your InstaLoop client portal.`,
          rows: [["Document", data.name], ["Category", data.category]],
          ctaLabel: "Open document centre",
          ctaUrl: "https://automate-with-us.lovable.app/portal/documents",
          idempotencyKey: `doc-${row.id}`,
        });
      }
    }

    return row as PortalDocument;
  });

export const getDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { documentId: string }) =>
    z.object({ documentId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await context.supabase
      .from("documents")
      .select("storage_path, name")
      .eq("id", data.documentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doc) throw new Error("Document not found or you do not have access to it.");

    const { data: signed, error: signError } = await context.supabase.storage
      .from("portal-files")
      .createSignedUrl(doc.storage_path, 60 * 5, { download: doc.name });
    if (signError || !signed) throw new Error(signError?.message ?? "Could not create a link.");
    return { url: signed.signedUrl, name: doc.name };
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { documentId: string }) =>
    z.object({ documentId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: doc } = await context.supabase
      .from("documents")
      .select("storage_path")
      .eq("id", data.documentId)
      .maybeSingle();
    if (!doc) throw new Error("Document not found or you do not have access to it.");

    const { error } = await context.supabase.from("documents").delete().eq("id", data.documentId);
    if (error) throw new Error(error.message);
    await context.supabase.storage.from("portal-files").remove([doc.storage_path]);
    return { ok: true };
  });
