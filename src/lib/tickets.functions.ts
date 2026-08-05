import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const TICKET_STATUSES = [
  "Open",
  "In Progress",
  "Waiting on Customer",
  "Resolved",
  "Closed",
] as const;

export const TICKET_CATEGORIES = [
  "Technical issue",
  "Billing",
  "Automation change",
  "New request",
  "Other",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export type TicketAttachment = { path: string; name: string; mime: string | null };

export type PortalTicket = {
  id: string;
  owner_id: string;
  project_id: string | null;
  subject: string;
  category: string;
  description: string;
  status: TicketStatus;
  priority: "Low" | "Medium" | "High" | "Urgent";
  last_reply_at: string;
  created_at: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  author_id: string | null;
  author_role: string;
  body: string;
  attachments: TicketAttachment[];
  is_internal: boolean;
  created_at: string;
};

const TICKET_COLUMNS =
  "id, owner_id, project_id, subject, category, description, status, priority, last_reply_at, created_at";

async function isAdminUser(supabase: { rpc: Function }, userId: string) {
  const { data } = await (supabase as any).rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  return Boolean(data);
}

export const listTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tickets")
      .select(TICKET_COLUMNS)
      .order("last_reply_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: projects } = await context.supabase.from("projects").select("id, name");

    return {
      tickets: (data ?? []) as PortalTicket[],
      projects: (projects ?? []) as Array<{ id: string; name: string }>,
      isAdmin: await isAdminUser(context.supabase, context.userId),
    };
  });

export const getTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { ticketId: string }) =>
    z.object({ ticketId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: ticket, error } = await context.supabase
      .from("tickets")
      .select(TICKET_COLUMNS)
      .eq("id", data.ticketId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ticket) throw new Error("Ticket not found or you do not have access to it.");

    const { data: messages, error: msgError } = await context.supabase
      .from("ticket_messages")
      .select("id, ticket_id, author_id, author_role, body, attachments, is_internal, created_at")
      .eq("ticket_id", data.ticketId)
      .order("created_at", { ascending: true });
    if (msgError) throw new Error(msgError.message);

    return {
      ticket: ticket as PortalTicket,
      messages: (messages ?? []) as unknown as TicketMessage[],
      isAdmin: await isAdminUser(context.supabase, context.userId),
      userId: context.userId,
    };
  });

const attachmentSchema = z.array(
  z.object({
    path: z.string().trim().min(1).max(400),
    name: z.string().trim().min(1).max(200),
    mime: z.string().trim().max(160).nullable().optional(),
  }),
).max(5);

const createSchema = z.object({
  subject: z.string().trim().min(4).max(160),
  category: z.enum(TICKET_CATEGORIES),
  description: z.string().trim().min(10).max(4000),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
  projectId: z.string().uuid().nullable().optional(),
  attachments: attachmentSchema.optional(),
});

export const createTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof createSchema>) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: ticket, error } = await context.supabase
      .from("tickets")
      .insert({
        owner_id: context.userId,
        project_id: data.projectId ?? null,
        subject: data.subject,
        category: data.category,
        description: data.description,
        priority: data.priority,
        status: "Open",
      })
      .select(TICKET_COLUMNS)
      .single();
    if (error) throw new Error(error.message);

    const { error: msgError } = await context.supabase.from("ticket_messages").insert({
      ticket_id: ticket.id,
      author_id: context.userId,
      author_role: "customer",
      body: data.description,
      attachments: (data.attachments ?? []) as never,
    });
    if (msgError) throw new Error(msgError.message);

    const { sendPortalEmail, getUserEmail, ownerNotificationEmailAddress } = await import(
      "./portal-notify.server"
    );
    const internal = ownerNotificationEmailAddress();
    const clientEmail = await getUserEmail(context.userId);
    if (internal) {
      await sendPortalEmail({
        to: internal,
        subject: `New support ticket: ${data.subject}`,
        heading: "New support ticket",
        intro: "A client opened a support ticket in the portal.",
        rows: [
          ["Subject", data.subject],
          ["Category", data.category],
          ["Priority", data.priority],
          ["Client", clientEmail ?? context.userId],
        ],
        ctaLabel: "Open admin inbox",
        ctaUrl: "https://automate-with-us.lovable.app/admin/tickets",
        idempotencyKey: `ticket-new-${ticket.id}`,
      });
    }
    if (clientEmail) {
      await sendPortalEmail({
        to: clientEmail,
        subject: "We received your support ticket | Nexora Automation",
        heading: "We received your ticket",
        intro: "Our team replies within one business day. You can follow the thread in your portal.",
        rows: [["Subject", data.subject], ["Category", data.category]],
        ctaLabel: "View ticket",
        ctaUrl: `https://automate-with-us.lovable.app/portal/tickets/${ticket.id}`,
        idempotencyKey: `ticket-ack-${ticket.id}`,
      });
    }

    return ticket as PortalTicket;
  });

const replySchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
  attachments: attachmentSchema.optional(),
  isInternal: z.boolean().optional(),
});

export const replyToTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof replySchema>) => replySchema.parse(data))
  .handler(async ({ data, context }) => {
    const isAdmin = await isAdminUser(context.supabase, context.userId);

    const { data: ticket } = await context.supabase
      .from("tickets")
      .select("id, owner_id, subject, status")
      .eq("id", data.ticketId)
      .maybeSingle();
    if (!ticket) throw new Error("Ticket not found or you do not have access to it.");

    const { data: message, error } = await context.supabase
      .from("ticket_messages")
      .insert({
        ticket_id: data.ticketId,
        author_id: context.userId,
        author_role: isAdmin ? "admin" : "customer",
        body: data.body,
        attachments: (data.attachments ?? []) as never,
        is_internal: Boolean(isAdmin && data.isInternal),
      })
      .select("id, ticket_id, author_id, author_role, body, attachments, is_internal, created_at")
      .single();
    if (error) throw new Error(error.message);

    await context.supabase
      .from("tickets")
      .update({
        last_reply_at: new Date().toISOString(),
        status: isAdmin
          ? ticket.status === "Open"
            ? "In Progress"
            : ticket.status
          : ticket.status === "Waiting on Customer"
            ? "In Progress"
            : ticket.status,
      })
      .eq("id", data.ticketId);

    if (isAdmin && !data.isInternal) {
      const { createNotification, sendPortalEmail, getUserEmail } = await import(
        "./portal-notify.server"
      );
      await createNotification({
        userId: ticket.owner_id,
        type: "ticket",
        title: "New reply on your ticket",
        message: `${ticket.subject}: ${data.body.slice(0, 120)}`,
        link: `/portal/tickets/${ticket.id}`,
      });
      const email = await getUserEmail(ticket.owner_id);
      if (email) {
        await sendPortalEmail({
          to: email,
          subject: `Reply to your ticket: ${ticket.subject}`,
          heading: "You have a new reply",
          intro: data.body.slice(0, 600),
          rows: [["Ticket", ticket.subject]],
          ctaLabel: "Open ticket",
          ctaUrl: `https://automate-with-us.lovable.app/portal/tickets/${ticket.id}`,
          idempotencyKey: `ticket-reply-${message.id}`,
        });
      }
    } else if (!isAdmin) {
      const { sendPortalEmail, ownerNotificationEmailAddress } = await import(
        "./portal-notify.server"
      );
      const internal = ownerNotificationEmailAddress();
      if (internal) {
        await sendPortalEmail({
          to: internal,
          subject: `Client replied: ${ticket.subject}`,
          heading: "Client replied to a ticket",
          intro: data.body.slice(0, 600),
          ctaLabel: "Open admin inbox",
          ctaUrl: `https://automate-with-us.lovable.app/admin/tickets`,
          idempotencyKey: `ticket-client-reply-${message.id}`,
        });
      }
    }

    return message as unknown as TicketMessage;
  });

const statusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(TICKET_STATUSES),
});

export const updateTicketStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof statusSchema>) => statusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("tickets")
      .update({ status: data.status })
      .eq("id", data.ticketId)
      .select(TICKET_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Ticket not found or you do not have access to it.");

    const isAdmin = await isAdminUser(context.supabase, context.userId);
    if (isAdmin) {
      const { createNotification } = await import("./portal-notify.server");
      await createNotification({
        userId: row.owner_id,
        type: "ticket",
        title: `Ticket ${data.status.toLowerCase()}`,
        message: row.subject,
        link: `/portal/tickets/${row.id}`,
      });
    }
    return row as PortalTicket;
  });

/** Short-lived signed URL for a ticket attachment. */
export const getAttachmentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { path: string }) =>
    z.object({ path: z.string().trim().min(1).max(400) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: signed, error } = await context.supabase.storage
      .from("portal-files")
      .createSignedUrl(data.path, 60 * 5);
    if (error || !signed) throw new Error(error?.message ?? "Could not create a link.");
    return { url: signed.signedUrl };
  });
