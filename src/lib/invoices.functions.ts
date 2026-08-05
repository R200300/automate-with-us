import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const INVOICE_STATUSES = ["Draft", "Sent", "Paid", "Overdue", "Void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type PortalInvoice = {
  id: string;
  owner_id: string;
  project_id: string | null;
  invoice_number: string;
  description: string | null;
  line_items: InvoiceLineItem[];
  amount: number;
  tax_amount: number;
  currency: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  payment_link: string | null;
  payment_reference: string | null;
  is_subscription: boolean;
  subscription_interval: string | null;
  created_at: string;
};

const INVOICE_COLUMNS =
  "id, owner_id, project_id, invoice_number, description, line_items, amount, tax_amount, currency, status, issue_date, due_date, paid_at, payment_link, payment_reference, is_subscription, subscription_interval, created_at";

export const listInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("invoices")
      .select(INVOICE_COLUMNS)
      .order("issue_date", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    return {
      invoices: (data ?? []) as unknown as PortalInvoice[],
      isAdmin: (roles ?? []).some((r) => r.role === "admin"),
    };
  });

export const getInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { invoiceId: string }) =>
    z.object({ invoiceId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: invoice, error } = await context.supabase
      .from("invoices")
      .select(INVOICE_COLUMNS)
      .eq("id", data.invoiceId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!invoice) throw new Error("Invoice not found or you do not have access to it.");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("full_name, company_name, country, phone")
      .eq("id", (invoice as { owner_id: string }).owner_id)
      .maybeSingle();

    return { invoice: invoice as unknown as PortalInvoice, billTo: profile ?? null };
  });

const lineItemSchema = z.object({
  description: z.string().trim().min(1).max(200),
  quantity: z.number().min(0.01).max(10000),
  unitPrice: z.number().min(0).max(1_000_000),
});

const createSchema = z.object({
  ownerEmail: z.string().trim().email().max(255),
  projectId: z.string().uuid().nullable().optional(),
  description: z.string().trim().max(500).optional(),
  lineItems: z.array(lineItemSchema).min(1).max(20),
  taxAmount: z.number().min(0).max(1_000_000).default(0),
  currency: z.enum(["USD", "GBP", "CAD", "AUD", "EUR", "INR"]).default("USD"),
  dueDate: z.string().trim().max(20).optional(),
  isSubscription: z.boolean().default(false),
  subscriptionInterval: z.enum(["monthly", "quarterly", "yearly"]).nullable().optional(),
  paymentLink: z.string().trim().url().max(500).nullable().optional(),
});

/** Admin: creates an invoice for a client identified by email. */
export const createInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof createSchema>) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only admins can create invoices.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (userError) throw new Error(userError.message);
    const target = users.users.find(
      (u) => (u.email ?? "").toLowerCase() === data.ownerEmail.toLowerCase(),
    );
    if (!target) throw new Error("No portal account found with that email address.");

    const subtotal = data.lineItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const amount = Math.round((subtotal + data.taxAmount) * 100) / 100;
    const invoiceNumber = `NEX-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;

    const { data: invoice, error } = await context.supabase
      .from("invoices")
      .insert({
        owner_id: target.id,
        project_id: data.projectId ?? null,
        invoice_number: invoiceNumber,
        description: data.description ?? null,
        line_items: data.lineItems as never,
        amount,
        tax_amount: data.taxAmount,
        currency: data.currency,
        status: "Sent",
        due_date: data.dueDate || null,
        is_subscription: data.isSubscription,
        subscription_interval: data.isSubscription
          ? (data.subscriptionInterval ?? "monthly")
          : null,
        payment_link: data.paymentLink ?? null,
        created_by: context.userId,
      })
      .select(INVOICE_COLUMNS)
      .single();
    if (error) throw new Error(error.message);

    const { createNotification, sendPortalEmail } = await import("./portal-notify.server");
    await createNotification({
      userId: target.id,
      type: "invoice",
      title: `Invoice ${invoiceNumber}`,
      message: `A new invoice for ${data.currency} ${amount.toFixed(2)} is ready.`,
      link: "/portal/invoices",
    });
    await sendPortalEmail({
      to: data.ownerEmail,
      subject: `Invoice ${invoiceNumber} from Nexora Automation`,
      heading: `Invoice ${invoiceNumber}`,
      intro: "Your invoice is ready. You can view, download, or pay it in your client portal.",
      rows: [
        ["Amount", `${data.currency} ${amount.toFixed(2)}`],
        ["Due date", data.dueDate || "On receipt"],
        ...(data.isSubscription
          ? ([["Billing", `Recurring (${data.subscriptionInterval ?? "monthly"})`]] as Array<
              [string, string]
            >)
          : []),
      ],
      ctaLabel: "View invoice",
      ctaUrl: `https://automate-with-us.lovable.app/portal/invoices/${invoice.id}`,
      idempotencyKey: `invoice-${invoice.id}`,
    });

    return invoice as unknown as PortalInvoice;
  });

const statusSchema = z.object({
  invoiceId: z.string().uuid(),
  status: z.enum(INVOICE_STATUSES),
  paymentReference: z.string().trim().max(200).nullable().optional(),
});

/** Admin: updates invoice status, e.g. marking a bank/Stripe payment as received. */
export const updateInvoiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.infer<typeof statusSchema>) => statusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Only admins can update invoices.");

    const { data: invoice, error } = await context.supabase
      .from("invoices")
      .update({
        status: data.status,
        paid_at: data.status === "Paid" ? new Date().toISOString() : null,
        ...(data.paymentReference !== undefined
          ? { payment_reference: data.paymentReference }
          : {}),
      })
      .eq("id", data.invoiceId)
      .select(INVOICE_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!invoice) throw new Error("Invoice not found.");

    const row = invoice as unknown as PortalInvoice;
    const { createNotification } = await import("./portal-notify.server");
    await createNotification({
      userId: row.owner_id,
      type: "invoice",
      title: `Invoice ${row.invoice_number} is ${row.status.toLowerCase()}`,
      message: `${row.currency} ${Number(row.amount).toFixed(2)}`,
      link: `/portal/invoices/${row.id}`,
    });
    return row;
  });
