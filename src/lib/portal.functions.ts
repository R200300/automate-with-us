import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PROJECT_STATUSES = [
  "Pending",
  "Planning",
  "Development",
  "Testing",
  "Deployment",
  "Completed",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type PortalProject = {
  id: string;
  name: string;
  service_type: string;
  description: string | null;
  status: ProjectStatus;
  progress: number;
  assigned_team: string[];
  start_date: string | null;
  expected_completion: string | null;
  created_at: string;
  updated_at: string;
};

export type PortalTimelineEntry = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
};

const PROJECT_COLUMNS =
  "id, name, service_type, description, status, progress, assigned_team, start_date, expected_completion, created_at, updated_at";

/** Ensures a profile row exists for the signed-in user and returns the portal data. */
export const getPortalOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, claims } = context;

    const email = typeof claims.email === "string" ? claims.email : null;

    const { data: existing } = await supabase
      .from("profiles")
      .select("id, full_name, company_name, phone, country")
      .eq("id", userId)
      .maybeSingle();

    let profile = existing;
    if (!profile) {
      const { data: created } = await supabase
        .from("profiles")
        .insert({ id: userId })
        .select("id, full_name, company_name, phone, country")
        .maybeSingle();
      profile = created ?? null;
    }

    const { data: projects, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);

    return {
      email,
      profile: profile ?? null,
      projects: (projects ?? []) as PortalProject[],
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    };
  });

export const getPortalProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { projectId: string }) =>
    z.object({ projectId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: project, error } = await context.supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("id", data.projectId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) throw new Error("Project not found or you do not have access to it.");

    const { data: timeline, error: timelineError } = await context.supabase
      .from("project_timeline")
      .select("id, title, description, event_date")
      .eq("project_id", data.projectId)
      .order("event_date", { ascending: false });
    if (timelineError) throw new Error(timelineError.message);

    return {
      project: project as PortalProject,
      timeline: (timeline ?? []) as PortalTimelineEntry[],
    };
  });

const profileSchema = z.object({
  fullName: z.string().trim().max(120).optional(),
  companyName: z.string().trim().max(140).optional(),
  phone: z.string().trim().max(40).optional(),
  country: z.string().trim().max(80).optional(),
});

export const savePortalProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof profileSchema>) => profileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({
        id: context.userId,
        full_name: data.fullName ?? null,
        company_name: data.companyName ?? null,
        phone: data.phone ?? null,
        country: data.country ?? null,
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
