import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  Download,
  LayoutGrid,
  List,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KanbanBoard } from "@/components/crm/kanban-board";
import {
  LeadLink,
  Pill,
  dateTime,
  exportLeadsCsv,
  isOverdue,
  isToday,
  money,
  priorityStyles,
  shortDate,
  stageStyles,
} from "@/components/crm/crm-shared";
import {
  PIPELINE_STAGES,
  PRIORITIES,
  listCrmLeads,
  updateCrmLead,
  type CrmLead,
  type PipelineStage,
} from "@/lib/crm.functions";

export const Route = createFileRoute("/_authenticated/admin/crm")({
  head: () => ({
    meta: [
      { title: "CRM Pipeline | Nexora Automation" },
      {
        name: "description",
        content:
          "Internal CRM pipeline for Nexora Automation: track every consultation lead from first contact to won or lost.",
      },
      { property: "og:title", content: "CRM Pipeline | Nexora Automation" },
      { property: "og:description", content: "Track AI automation leads through the full sales pipeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CrmPage,
});

const ALL = "__all__";

function CrmPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchLeads = useServerFn(listCrmLeads);
  const saveLead = useServerFn(updateCrmLead);

  const [view, setView] = useState<"board" | "table">("board");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState(ALL);
  const [service, setService] = useState(ALL);
  const [stage, setStage] = useState(ALL);
  const [assignee, setAssignee] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["crm-leads"],
    queryFn: () => fetchLeads(),
  });

  const leads = (data ?? []) as CrmLead[];

  const moveMutation = useMutation({
    mutationFn: (vars: { leadId: string; stage: PipelineStage }) =>
      saveLead({ data: { leadId: vars.leadId, patch: { pipeline_stage: vars.stage } } }),
    onMutate: (vars) => setMovingId(vars.leadId),
    onSettled: () => {
      setMovingId(null);
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    },
    onError: (e) => setActionError(e instanceof Error ? e.message : "Could not move the lead."),
  });

  const countries = useMemo(
    () => Array.from(new Set(leads.map((l) => l.country).filter(Boolean))).sort(),
    [leads],
  );
  const services = useMemo(
    () => Array.from(new Set(leads.map((l) => l.service).filter(Boolean))).sort(),
    [leads],
  );
  const assignees = useMemo(
    () => Array.from(new Set(leads.map((l) => l.assigned_to).filter(Boolean))).sort() as string[],
    [leads],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTs = to ? new Date(`${to}T23:59:59`).getTime() : null;
    return leads.filter((lead) => {
      if (
        q &&
        ![lead.full_name, lead.company_name, lead.email, lead.phone].some((f) =>
          (f ?? "").toLowerCase().includes(q),
        )
      )
        return false;
      if (country !== ALL && lead.country !== country) return false;
      if (service !== ALL && lead.service !== service) return false;
      if (stage !== ALL && lead.pipeline_stage !== stage) return false;
      if (assignee !== ALL && (lead.assigned_to ?? "") !== assignee) return false;
      if (priority !== ALL && lead.priority !== priority) return false;
      const created = new Date(lead.created_at).getTime();
      if (fromTs && created < fromTs) return false;
      if (toTs && created > toTs) return false;
      return true;
    });
  }, [leads, search, country, service, stage, assignee, priority, from, to]);

  const stats = useMemo(() => {
    const total = leads.length;
    const qualified = leads.filter((l) =>
      ["Qualified", "Proposal Sent", "Negotiation"].includes(l.pipeline_stage),
    ).length;
    const won = leads.filter((l) => l.pipeline_stage === "Won");
    const lost = leads.filter((l) => l.pipeline_stage === "Lost").length;
    const closed = won.length + lost;
    const forecast = leads
      .filter((l) => !["Won", "Lost"].includes(l.pipeline_stage))
      .reduce(
        (sum, l) => sum + (Number(l.estimated_value) || 0) * ((l.closing_probability || 0) / 100),
        0,
      );
    return {
      total,
      qualified,
      won: won.length,
      wonValue: won.reduce((s, l) => s + (Number(l.estimated_value) || 0), 0),
      lost,
      conversion: closed ? Math.round((won.length / closed) * 100) : 0,
      forecast,
      followupsToday: leads.filter((l) => isToday(l.next_followup)).length,
    };
  }, [leads]);

  const overdue = leads.filter(
    (l) => isOverdue(l.next_followup) && !["Won", "Lost"].includes(l.pipeline_stage),
  );
  const dueToday = leads.filter((l) => isToday(l.next_followup));

  const selectedLeads = filtered.filter((l) => selected[l.id]);
  const resetFilters = () => {
    setSearch("");
    setCountry(ALL);
    setService(ALL);
    setStage(ALL);
    setAssignee(ALL);
    setPriority(ALL);
    setFrom("");
    setTo("");
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <section className="mx-auto w-full max-w-[1400px] px-4 py-10 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">CRM Pipeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every lead, from first contact to won or lost.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/admin/leads">Lead inbox</Link>
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </div>

      {/* Analytics */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total leads" value={String(stats.total)} />
        <StatCard label="Qualified" value={String(stats.qualified)} />
        <StatCard label="Won deals" value={String(stats.won)} hint={money(stats.wonValue)} />
        <StatCard label="Lost deals" value={String(stats.lost)} />
        <StatCard label="Conversion rate" value={`${stats.conversion}%`} />
        <StatCard label="Revenue forecast" value={money(stats.forecast)} />
        <StatCard label="Follow-ups today" value={String(stats.followupsToday)} />
      </div>

      {/* Follow-up notifications */}
      {(overdue.length > 0 || dueToday.length > 0) && (
        <div className="mt-6 space-y-3">
          {dueToday.length > 0 && (
            <FollowupBanner
              tone="primary"
              icon={<CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" />}
              title={`${dueToday.length} follow-up${dueToday.length > 1 ? "s" : ""} due today`}
              leads={dueToday}
            />
          )}
          {overdue.length > 0 && (
            <FollowupBanner
              tone="destructive"
              icon={<BellRing className="mt-0.5 size-5 shrink-0 text-destructive" />}
              title={`${overdue.length} overdue follow-up${overdue.length > 1 ? "s" : ""}`}
              leads={overdue}
            />
          )}
        </div>
      )}

      {/* Filters */}
      <div className="surface-card mt-6 space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, company, email or phone"
              className="rounded-full pl-9"
            />
          </div>
          <div className="flex gap-1 rounded-full border border-border p-1">
            <button
              type="button"
              onClick={() => setView("board")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${view === "board" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <LayoutGrid className="size-3.5" /> Board
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <List className="size-3.5" /> Table
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <FilterSelect label="Country" value={country} onChange={setCountry} options={countries} />
          <FilterSelect label="Service" value={service} onChange={setService} options={services} />
          <FilterSelect
            label="Stage"
            value={stage}
            onChange={setStage}
            options={[...PIPELINE_STAGES]}
          />
          <FilterSelect
            label="Assigned user"
            value={assignee}
            onChange={setAssignee}
            options={assignees}
          />
          <FilterSelect
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={[...PRIORITIES]}
          />
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-medium text-muted-foreground">
              From
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1" />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              To
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1" />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {leads.length} leads
            {selectedLeads.length > 0 ? ` · ${selectedLeads.length} selected` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" className="rounded-full" onClick={resetFilters}>
              Clear filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={filtered.length === 0}
              onClick={() => exportLeadsCsv(filtered)}
            >
              <Download className="size-4" /> Export filtered
            </Button>
            <Button
              size="sm"
              className="rounded-full"
              disabled={selectedLeads.length === 0}
              onClick={() => exportLeadsCsv(selectedLeads, "nexora-selected-leads.csv")}
            >
              <Download className="size-4" /> Export selected
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="surface-card flex items-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading pipeline...
          </div>
        ) : error ? (
          <div className="surface-card p-8 text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load the pipeline."}
          </div>
        ) : leads.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <p className="font-semibold">No leads yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              New consultation requests from the website appear here automatically.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-card p-10 text-center">
            <p className="font-semibold">No leads match these filters</p>
            <Button variant="outline" className="mt-4 rounded-full" onClick={resetFilters}>
              Clear filters
            </Button>
          </div>
        ) : view === "board" ? (
          <KanbanBoard
            leads={filtered}
            movingId={movingId}
            onMove={(leadId, nextStage) => moveMutation.mutate({ leadId, stage: nextStage })}
          />
        ) : (
          <div className="surface-card overflow-x-auto p-0">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Select all filtered leads"
                      checked={filtered.length > 0 && filtered.every((l) => selected[l.id])}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked
                            ? Object.fromEntries(filtered.map((l) => [l.id, true]))
                            : {},
                        )
                      }
                    />
                  </th>
                  {["Lead", "Company", "Contact", "Service", "Stage", "Priority", "Value", "Follow-up", "Created"].map(
                    (h) => (
                      <th key={h} className="px-4 py-3 font-semibold">
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${lead.full_name}`}
                        checked={Boolean(selected[lead.id])}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [lead.id]: e.target.checked }))
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <LeadLink lead={lead} />
                      <p className="text-xs text-muted-foreground">{lead.country}</p>
                    </td>
                    <td className="px-4 py-3">{lead.company_name}</td>
                    <td className="px-4 py-3">
                      <a className="underline" href={`mailto:${lead.email}`}>
                        {lead.email}
                      </a>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </td>
                    <td className="px-4 py-3">{lead.service}</td>
                    <td className="px-4 py-3">
                      <Pill className={stageStyles[lead.pipeline_stage]}>{lead.pipeline_stage}</Pill>
                    </td>
                    <td className="px-4 py-3">
                      <Pill className={priorityStyles[lead.priority]}>{lead.priority}</Pill>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {money(Number(lead.estimated_value))}
                      <p className="text-xs text-muted-foreground">{lead.closing_probability}%</p>
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap ${isOverdue(lead.next_followup) ? "font-semibold text-destructive" : ""}`}
                    >
                      {shortDate(lead.next_followup)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {shortDate(lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface-card p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1.5 text-2xl font-bold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
      >
        <option value={ALL}>All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function FollowupBanner({
  tone,
  icon,
  title,
  leads,
}: {
  tone: "primary" | "destructive";
  icon: React.ReactNode;
  title: string;
  leads: CrmLead[];
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
        tone === "destructive"
          ? "border-destructive/30 bg-destructive/5"
          : "border-primary/30 bg-primary/5"
      }`}
    >
      {icon}
      <div>
        <p className={`font-semibold ${tone === "destructive" ? "text-destructive" : "text-primary"}`}>
          {title}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          {leads.slice(0, 6).map((lead) => (
            <span key={lead.id}>
              <LeadLink lead={lead} className="text-sm font-medium text-foreground" /> ·{" "}
              {dateTime(lead.next_followup)}
            </span>
          ))}
          {leads.length > 6 && <span>+{leads.length - 6} more</span>}
        </div>
      </div>
    </div>
  );
}
