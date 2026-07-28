import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const consultationSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  service: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ConsultationInput = z.infer<typeof consultationSchema>;

export const submitConsultationRequest = createServerFn({ method: "POST" })
  .inputValidator((data: ConsultationInput) => consultationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("consultation_requests")
      .insert({
        full_name: data.fullName,
        email: data.email,
        phone: data.phone || null,
        country: data.country || null,
        service: data.service || null,
        notes: data.notes || null,
        source: "book",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[consultation] insert failed", error);
      throw new Error(`We could not save your request: ${error.message}`);
    }

    // Confirmation email is wired up once a sender domain is verified for the
    // project; the lead is already saved above either way.
    return { id: row.id, emailSent: false };

  });
