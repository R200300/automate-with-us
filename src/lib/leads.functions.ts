import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const leadSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  companyName: z.string().trim().min(2, "Please enter your company name").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  phone: z.string().trim().min(6, "Please enter a valid phone number").max(40),
  country: z.string().trim().min(2, "Please select your country").max(80),
  service: z.string().trim().min(2, "Please select a service").max(120),
  projectDescription: z
    .string()
    .trim()
    .min(10, "Please describe your project in at least 10 characters")
    .max(2000),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data: LeadInput) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .insert({
        full_name: data.fullName,
        company_name: data.companyName,
        email: data.email,
        phone: data.phone,
        country: data.country,
        service: data.service,
        project_description: data.projectDescription,
        source: "Website",
        lead_status: "New",
      })
      .select(
        "id, full_name, company_name, email, phone, country, service, project_description, created_at",
      )
      .single();

    if (error || !lead) {
      console.error("[leads] insert failed", error);
      throw new Error(`We could not save your request: ${error?.message ?? "unknown error"}`);
    }

    // The lead is safely stored before any notification runs.
    const { logActivity, dispatchLeadEmails } = await import("./lead-notifications.server");
    await logActivity(lead.id, "lead_created", `Lead created from the website booking form (${lead.service}).`, {
      source: "Website",
    });

    try {
      await dispatchLeadEmails(lead);
    } catch (notifyError) {
      console.error("[leads] notification dispatch failed", notifyError);
    }

    return { ok: true, leadId: lead.id };
  });
