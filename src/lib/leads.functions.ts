import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

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
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY!;

    const supabase = createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
            headers.delete("Authorization");
          }
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });

    const { error } = await supabase
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
      });

    if (error) {
      console.error("[leads] insert failed", error);
      throw new Error(`We could not save your request: ${error.message}`);
    }

    return { ok: true };
  });
