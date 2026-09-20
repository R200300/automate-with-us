import { Link } from "@tanstack/react-router";
import type { CrmLead, PipelineStage, Priority } from "@/lib/crm.functions";

export const stageStyles: Record<PipelineStage, string> = {
  New: "bg-primary/15 text-primary",
  Contacted: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "Discovery Scheduled": "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  Qualified: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "Proposal Sent": "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  Negotiation: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  Won: "bg-accent/15 text-accent",
  Lost: "bg-destructive/10 text-destructive",
};

export const priorityStyles: Record<Priority, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  High: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Urgent: "bg-destructive/15 text-destructive",
};

export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function shortDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function dateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

/** Local date string (YYYY-MM-DD) suitable for <input type="date"> */
export function toDateInput(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isOverdue(value: string | null) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

export function isToday(value: string | null) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function LeadLink({ lead, className = "" }: { lead: CrmLead; className?: string }) {
  return (
    <Link
      to="/admin/lead/$leadId"
      params={{ leadId: lead.id }}
      className={`font-semibold hover:text-primary hover:underline ${className}`}
    >
      {lead.full_name}
    </Link>
  );
}

const CSV_COLUMNS: { key: keyof CrmLead; label: string }[] = [
  { key: "created_at", label: "Created" },
  { key: "full_name", label: "Name" },
  { key: "company_name", label: "Company" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "country", label: "Country" },
  { key: "service", label: "Service" },
  { key: "pipeline_stage", label: "Pipeline Stage" },
  { key: "priority", label: "Priority" },
  { key: "lead_source", label: "Source" },
  { key: "assigned_to", label: "Assigned To" },
  { key: "estimated_value", label: "Estimated Value" },
  { key: "closing_probability", label: "Closing Probability" },
  { key: "next_followup", label: "Next Follow-up" },
  { key: "last_contact", label: "Last Contact" },
  { key: "industry", label: "Industry" },
  { key: "company_size", label: "Company Size" },
  { key: "website", label: "Website" },
  { key: "timezone", label: "Timezone" },
  { key: "meeting_date", label: "Meeting Date" },
  { key: "meeting_link", label: "Meeting Link" },
  { key: "project_description", label: "Project Description" },
];

function escapeCell(value: unknown) {
  const raw = value === null || value === undefined ? "" : String(value);
  return `"${raw.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

export function exportLeadsCsv(leads: CrmLead[], filename = "instaloop-leads.csv") {
  const header = CSV_COLUMNS.map((c) => escapeCell(c.label)).join(",");
  const rows = leads.map((lead) => CSV_COLUMNS.map((c) => escapeCell(lead[c.key])).join(","));
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
