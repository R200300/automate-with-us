import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const MEETING_STATUSES = [
  "Requested",
  "Scheduled",
  "Rescheduled",
  "Cancelled",
  "Completed",
] as const;

export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export type PortalMeeting = {
  id: string;
  owner_id: string;
  project_id: string | null;
  title: string;
  agenda: string | null;
  scheduled_at: string;
  duration_minutes: number;
  timezone: string | null;
  status: MeetingStatus;
  meet_link: string | null;
  calendar_event_id: string | null;
  calendar_status: string;
  calendar_error: string | null;
  cancelled_reason: string | null;
  created_at: string;
};

const MEETING_COLUMNS =
  "id, owner_id, project_id, title, agenda, scheduled_at, duration_minutes, timezone, status, meet_link, calendar_event_id, calendar_status, calendar_error, cancelled_reason, created_at";

/** Google Calendar "add event" URL — works for every attendee with no OAuth needed. */
export function googleCalendarLink(meeting: {
  title: string;
  agenda: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meet_link: string | null;
}) {
  const start = new Date(meeting.scheduled_at);
  const end = new Date(start.getTime() + meeting.duration_minutes * 60_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: meeting.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: [meeting.agenda ?? "", meeting.meet_link ? `Join: ${meeting.meet_link}` : ""]
      .filter(Boolean)
      .join("\n\n"),
  });
  if (meeting.meet_link) params.set("location", meeting.meet_link);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export const listMeetings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("meetings")
      .select(MEETING_COLUMNS)
      .order("scheduled_at", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: projects } = await context.supabase.from("projects").select("id, name");
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    return {
      meetings: (data ?? []) as PortalMeeting[],
      projects: (projects ?? []) as Array<{ id: string; name: string }>,
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    };
  });

const bookSchema = z.object({
  title: z.string().trim().min(3).max(140),
  agenda: z.string().trim().max(2000).optional(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(180),
  timezone: z.string().trim().max(80).optional(),
  projectId: z.string().uuid().nullable().optional(),
});

async function notifyMeeting(
  meeting: PortalMeeting,
  kind: "booked" | "rescheduled" | "cancelled",
  actorId: string,
) {
  const { createNotification, sendPortalEmail, getUserEmail, ownerNotificationEmailAddress } =
    await import("./portal-notify.server");

  const when = new Date(meeting.scheduled_at).toUTCString();
  const headings = {
    booked: "Your meeting is booked",
    rescheduled: "Your meeting was rescheduled",
    cancelled: "Your meeting was cancelled",
  } as const;

  await createNotification({
    userId: meeting.owner_id,
    type: "meeting",
    title: headings[kind],
    message: `${meeting.title} — ${when}`,
    link: "/portal/meetings",
  });

  const rows: Array<[string, string]> = [
    ["Meeting", meeting.title],
    ["When (UTC)", when],
    ["Duration", `${meeting.duration_minutes} minutes`],
  ];
  if (meeting.meet_link) rows.push(["Join link", meeting.meet_link]);

  const ownerEmail = await getUserEmail(meeting.owner_id);
  if (ownerEmail) {
    await sendPortalEmail({
      to: ownerEmail,
      subject: `${headings[kind]} | InstaLoop`,
      heading: headings[kind],
      intro:
        kind === "cancelled"
          ? "This meeting has been cancelled. You can book a new time any time from your portal."
          : "Here are your meeting details. Add it to your calendar with the button below.",
      rows,
      ctaLabel: kind === "cancelled" ? "Book a new time" : "Add to Google Calendar",
      ctaUrl:
        kind === "cancelled"
          ? "https://automate-with-us.lovable.app/portal/meetings"
          : googleCalendarLink(meeting),
      idempotencyKey: `meeting-${kind}-${meeting.id}-${meeting.scheduled_at}`,
    });
  }

  const internal = ownerNotificationEmailAddress();
  if (internal && actorId === meeting.owner_id) {
    await sendPortalEmail({
      to: internal,
      subject: `Client meeting ${kind}: ${meeting.title}`,
      heading: `Client meeting ${kind}`,
      intro: "A client updated a meeting in the portal.",
      rows: [...rows, ["Client email", ownerEmail ?? meeting.owner_id]],
      idempotencyKey: `meeting-internal-${kind}-${meeting.id}-${meeting.scheduled_at}`,
    });
  }
}

export const bookMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof bookSchema>) => bookSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (new Date(data.scheduledAt).getTime() < Date.now())
      throw new Error("Please pick a time in the future.");

    const { data: row, error } = await context.supabase
      .from("meetings")
      .insert({
        owner_id: context.userId,
        project_id: data.projectId ?? null,
        title: data.title,
        agenda: data.agenda ?? null,
        scheduled_at: data.scheduledAt,
        duration_minutes: data.durationMinutes,
        timezone: data.timezone ?? null,
        status: "Scheduled",
        created_by: context.userId,
      })
      .select(MEETING_COLUMNS)
      .single();
    if (error) throw new Error(error.message);

    await notifyMeeting(row as PortalMeeting, "booked", context.userId);
    return row as PortalMeeting;
  });

const rescheduleSchema = z.object({
  meetingId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(180).optional(),
});

export const rescheduleMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof rescheduleSchema>) => rescheduleSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (new Date(data.scheduledAt).getTime() < Date.now())
      throw new Error("Please pick a time in the future.");

    const { data: row, error } = await context.supabase
      .from("meetings")
      .update({
        scheduled_at: data.scheduledAt,
        ...(data.durationMinutes ? { duration_minutes: data.durationMinutes } : {}),
        status: "Rescheduled",
      })
      .eq("id", data.meetingId)
      .select(MEETING_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Meeting not found or you do not have access to it.");

    await notifyMeeting(row as PortalMeeting, "rescheduled", context.userId);
    return row as PortalMeeting;
  });

const cancelSchema = z.object({
  meetingId: z.string().uuid(),
  reason: z.string().trim().max(500).optional(),
});

export const cancelMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof cancelSchema>) => cancelSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("meetings")
      .update({ status: "Cancelled", cancelled_reason: data.reason ?? null })
      .eq("id", data.meetingId)
      .select(MEETING_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Meeting not found or you do not have access to it.");

    await notifyMeeting(row as PortalMeeting, "cancelled", context.userId);
    return row as PortalMeeting;
  });

const adminUpdateSchema = z.object({
  meetingId: z.string().uuid(),
  meetLink: z.string().trim().url().max(500).nullable().optional(),
  status: z.enum(MEETING_STATUSES).optional(),
});

/** Admin-side update: attach the Google Meet link or close out a meeting. */
export const updateMeetingDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof adminUpdateSchema>) => adminUpdateSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only admins can update meeting details.");

    const { data: row, error } = await context.supabase
      .from("meetings")
      .update({
        ...(data.meetLink !== undefined ? { meet_link: data.meetLink } : {}),
        ...(data.status ? { status: data.status } : {}),
      })
      .eq("id", data.meetingId)
      .select(MEETING_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Meeting not found.");

    const meeting = row as PortalMeeting;
    const { createNotification, sendPortalEmail, getUserEmail } = await import(
      "./portal-notify.server"
    );
    await createNotification({
      userId: meeting.owner_id,
      type: "meeting",
      title: "Meeting updated",
      message: `${meeting.title} — ${new Date(meeting.scheduled_at).toUTCString()}`,
      link: "/portal/meetings",
    });
    const email = await getUserEmail(meeting.owner_id);
    if (email) {
      await sendPortalEmail({
        to: email,
        subject: "Your meeting details were updated | InstaLoop",
        heading: "Meeting details updated",
        intro: "Your InstaLoop meeting has new details.",
        rows: [
          ["Meeting", meeting.title],
          ["When (UTC)", new Date(meeting.scheduled_at).toUTCString()],
          ["Status", meeting.status],
          ...(meeting.meet_link ? ([["Join link", meeting.meet_link]] as Array<[string, string]>) : []),
        ],
        ctaLabel: "Add to Google Calendar",
        ctaUrl: googleCalendarLink(meeting),
        idempotencyKey: `meeting-updated-${meeting.id}-${Date.now()}`,
      });
    }
    return meeting;
  });
