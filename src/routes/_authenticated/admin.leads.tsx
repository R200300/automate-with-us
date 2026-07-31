import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AlertTriangle, History, Loader2, LogOut, MailWarning, RefreshCw, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LEAD_STATUSES,
  getLeadActivity,
  listLeads,
  markLeadsSeen,
  retryLeadEmails,
  updateLeadStatus,
  type LeadStatus,
} from "@/lib/admin-leads.functions";

export const Route = createFileRoute("/_authenticated/admin/leads")({
  head: () => ({
    meta: [
      { title: "Leads Dashboard | Nexora Automation" },
      {
        name: "description",
        content:
          "Internal dashboard listing every consultation request submitted through the Nexora Automation website.",
      },
      { property: "og:title", content: "Leads Dashboard | Nexora Automation" },
      { property: "og:description", content: "Review incoming AI automation consultation requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminLeadsPage,
});

const statusStyles: Record<string, string> = {
  New: "bg-primary/15 text-primary",
  Contacted: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  Qualified: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "Proposal Sent": "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  Won: "bg-accent/15 text-accent",
  Lost: "bg-destructive/10 text-destructive",
};

function AdminLeadsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchLeads = useServerFn(listLeads);
  const changeStatus = useServerFn(updateLeadStatus);
  const markSeen = useServerFn(markLeadsSeen);
  const retryEmails = useServerFn(retryLeadEmails);
  const fetchActivity = useServerFn(getLeadActivity);

  const [activityLeadId, setActivityLeadId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["leads"],
    queryFn: () => fetchLeads(),
  });

  const activityQuery = useQuery({
    queryKey: ["lead-activity", activityLeadId],
    queryFn: () => fetchActivity({ data: { leadId: activityLeadId! } }),
    enabled: Boolean(activityLeadId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["leads"] });

  const statusMutation = useMutation({
    mutationFn: (vars: { leadId: string; status: LeadStatus }) => changeStatus({ data: vars }),
    onSuccess: invalidate,
    onError: (e) => setActionError(e instanceof Error ? e.message : "Could not update the status."),
  });

  const seenMutation = useMutation({
    mutationFn: () => markSeen({}),
    onSuccess: invalidate,
  });

  const retryMutation = useMutation({
    mutationFn: (leadId: string) => retryEmails({ data: { leadId } }),
    onSuccess: invalidate,
    onError: (e) => setActionError(e instanceof Error ? e.message : "Retry failed."),
  });

  const leads = data ?? [];
  const unreadCount = leads.filter((l) => !l.seen_at).length;
  const failedEmails = leads.filter(
    (l) => l.customer_email_status === "failed" || l.owner_email_status === "failed",
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Leads</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultation requests from the website, newest first.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => seenMutation.mutate()}
              disabled={seenMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
          <Button variant="outline" className="rounded-full" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </div>

      {failedEmails.length > 0 && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <MailWarning className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">
              {failedEmails.length} lead{failedEmails.length > 1 ? "s" : ""} had a notification email
              that could not be delivered.
            </p>
            <p className="mt-1 text-muted-foreground">
              The lead data is saved safely. Use “Resend” on the affected rows once email delivery is
              working.
            </p>
          </div>
        </div>
      )}

      <div className="surface-card mt-8 overflow-x-auto p-0">
        {isLoading ? (
          <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading leads...
          </div>
        ) : error ? (
          <div className="p-8 text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load leads."}
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-sm text-muted-foreground">No leads yet.</div>
        ) : (
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                {[
                  "Name",
                  "Company",
                  "Email",
                  "Phone",
                  "Country",
                  "Service",
                  "Submitted",
                  "Status",
                  "Emails",
                  "",
                ].map((h, i) => (
                  <th key={`${h}-${i}`} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      {lead.full_name}
                      {!lead.seen_at && (
                        <span className="inline-flex rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                          New
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{lead.company_name}</td>
                  <td className="px-4 py-3">
                    <a className="underline" href={`mailto:${lead.email}`}>
                      {lead.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">{lead.phone}</td>
                  <td className="px-4 py-3">{lead.country}</td>
                  <td className="px-4 py-3">{lead.service}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold outline-none ${statusStyles[lead.lead_status] ?? "bg-muted"}`}
                      value={lead.lead_status}
                      disabled={statusMutation.isPending}
                      onChange={(e) =>
                        statusMutation.mutate({
                          leadId: lead.id,
                          status: e.target.value as LeadStatus,
                        })
                      }
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-background text-foreground">
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <EmailState
                      customer={lead.customer_email_status}
                      owner={lead.owner_email_status}
                      reason={lead.customer_email_error ?? lead.owner_email_error}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        title="Activity log"
                        onClick={() => setActivityLeadId(lead.id)}
                      >
                        <History className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        title="Resend notification emails"
                        disabled={retryMutation.isPending}
                        onClick={() => retryMutation.mutate(lead.id)}
                      >
                        <Send className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={Boolean(activityLeadId)} onOpenChange={(o) => !o && setActivityLeadId(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Activity log</DialogTitle>
            <DialogDescription>Everything recorded for this lead.</DialogDescription>
          </DialogHeader>
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {activityQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (activityQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            ) : (
              activityQuery.data!.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-border p-3">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {entry.event_type.replace(/_/g, " ")}
                  </p>
                  <p className="mt-1 text-sm">{entry.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(actionError)} onOpenChange={(o) => !o && setActionError(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> Action failed
            </DialogTitle>
            <DialogDescription className="pt-1">{actionError}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EmailState({
  customer,
  owner,
  reason,
}: {
  customer: string;
  owner: string;
  reason: string | null;
}) {
  const label = (value: string) =>
    value === "sent" ? "Sent" : value === "failed" ? "Failed" : "Pending";
  const tone = (value: string) =>
    value === "sent"
      ? "text-accent"
      : value === "failed"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="text-xs" title={reason ?? undefined}>
      <div className={tone(customer)}>Customer: {label(customer)}</div>
      <div className={tone(owner)}>Owner: {label(owner)}</div>
    </div>
  );
}
