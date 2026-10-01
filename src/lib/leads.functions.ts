import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const leadSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  companyName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(40),
  country: z.string().trim().min(2).max(80),
  service: z.string().trim().min(2).max(120),
  projectDescription: z.string().trim().min(10).max(2000),
  appointment: z.object({
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().optional(),
    meetingUrl: z.string().url().nullable().optional(),
    bookingUid: z.string().max(200).optional(),
  }).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: LeadInput) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: lead, error } = await supabaseAdmin.from("leads").insert({
      full_name: data.fullName,
      company_name: data.companyName,
      email: data.email,
      phone: data.phone,
      country: data.country,
      service: data.service,
      project_description: data.projectDescription,
      source: "Website",
      lead_status: "New",
    }).select("id, full_name, company_name, email, phone, country, service, project_description, created_at").single();

    if (error || !lead) {
      console.error("[leads] insert failed", error);
      throw new Error("We could not save your request. Please try again.");
    }

    const { logActivity, dispatchLeadEmails } = await import("./lead-notifications.server");
    await logActivity(lead.id, "lead_created", `Lead created from the website booking form (${lead.service}).`, {
      source: "Website",
      appointment: data.appointment ?? null,
    });

    try {
      await dispatchLeadEmails(lead, 0, data.appointment);
    } catch (notifyError) {
      console.error("[leads] notification dispatch failed", notifyError);
    }

    return { ok: true, leadId: lead.id, lead };
  });
