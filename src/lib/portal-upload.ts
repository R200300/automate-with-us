import { supabase } from "@/integrations/supabase/client";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80);
}

/** Uploads a file into the private portal bucket under the signed-in user's folder. */
export async function uploadPortalFile(file: File, folder: string) {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Files must be 20MB or smaller.");
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Your session expired. Please sign in again.");

  const path = `${uid}/${folder}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from("portal-files").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return { path, name: file.name, mime: file.type || null, size: file.size };
}
