import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pill, dateTime, isOverdue, money, priorityStyles, shortDate, stageStyles, toDateInput } from "@/components/crm/crm-shared";
import {
  PIPELINE_STAGES,
  PRIORITIES,
  addCrmNote,
  createCrmTask,
  deleteCrmNote,
  deleteCrmTask,
  getCrmLead,
  updateCrmLead,
  updateCrmTask,
  type Priority,
  type PipelineStage,
} from "@/lib/crm.functions";

export const Route = createFileRoute("/_authenticated/admin/lead/$leadId")({
  head: () => ({
    meta: [
      { title: "Lead Profile | InstaLoop CRM" },
      {
        name: "description",
        content:
          "Full lead profile with pipeline stage, follow-ups, internal notes, tasks and activity history.",
      },
      { property: "og:title", content: "Lead Profile | InstaLoop CRM" },
      { property: "og:description", content: "Lead profile, notes, tasks and activity timeline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeadDetailPage,
});

function LeadDetailPage() {
  const { leadId } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchLead = useServerFn(getCrmLead);
  const saveLead = useServerFn(updateCrmLead);
  const addNote = useServerFn(addCrmNote);
  const removeNote = useServerFn(deleteCrmNote);
  const addTask = useServerFn(createCrmTask);
  const setTaskStatus = useServerFn(updateCrmTask);
  const removeTask = useServerFn(deleteCrmTask);

  const [actionError, setActionError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [taskDraft, setTaskDraft] = useState<{
    title: string;
    description: string;
    due_date: string;
    priority: Priority;
  }>({ title: "", description: "", due_date: "", priority: "Medium" });

  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-lead", leadId],
    queryFn: () => fetchLead({ data: { leadId } }),
  });

  const lead = data?.lead;

  const [form, setForm] = useState({
    pipeline_stage: "New" as PipelineStage,
    priority: "Medium" as Priority,
    assigned_to: "",
    lead_source: "Website",
    estimated_value: "0",
    closing_probability: "0",
    next_followup: "",
    last_contact: "",
    industry: "",
    company_size: "",
    website: "",
    timezone: "",
    meeting_date: "",
    meeting_link: "",
  });

  useEffect(() => {
    if (!lead) return;
    setForm({
      pipeline_stage: lead.pipeline_stage,
      priority: lead.priority,
      assigned_to: lead.assigned_to ?? "",
      lead_source: lead.lead_source ?? "Website",
      estimated_value: String(lead.estimated_value ?? 0),
      closing_probability: String(lead.closing_probability ?? 0),
      next_followup: toDateInput(lead.next_followup),
      last_contact: toDateInput(lead.last_contact),
      industry: lead.industry ?? "",
      company_size: lead.company_size ?? "",
      website: lead.website ?? "",
      timezone: lead.timezone ?? "",
      meeting_date: lead.meeting_date ? lead.meeting_date.slice(0, 16) : "",
      meeting_link: lead.meeting_link ?? "",
    });
  }, [lead]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["crm-lead", leadId] });
    queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  };
  const fail = (e: unknown) =>
    setActionError(e instanceof Error ? e.message : "Something went wrong. Please try again.");

  const saveMutation = useMutation({
    mutationFn: () =>
      saveLead({
        data: {
          leadId,
          patch: {
            pipeline_stage: form.pipeline_stage,
            priority: form.priority,
            assigned_to: form.assigned_to.trim() || null,
            lead_source: form.lead_source.trim() || "Website",
            estimated_value: Number(form.estimated_value) || 0,
            closing_probability: Math.max(0, Math.min(100, Number(form.closing_probability) || 0)),
            next_followup: form.next_followup ? new Date(form.next_followup).toISOString() : null,
            last_contact: form.last_contact ? new Date(form.last_contact).toISOString() : null,
            industry: form.industry.trim() || null,
            company_size: form.company_size.trim() || null,
            website: form.website.trim() || null,
            timezone: form.timezone.trim() || null,
            meeting_date: form.meeting_date ? new Date(form.meeting_date).toISOString() : null,
            meeting_link: form.meeting_link.trim() || null,
          },
        },
      }),
    onSuccess: () => {
      setSavedAt(new Date().toLocaleTimeString());
      invalidate();
    },
    onError: fail,
  });

  const noteMutation = useMutation({
    mutationFn: () => addNote({ data: { leadId, note: noteDraft.trim() } }),
    onSuccess: () => {
      setNoteDraft("");
      invalidate();
    },
    onError: fail,
  });

  const noteDeleteMutation = useMutation({
    mutationFn: (noteId: string) => removeNote({ data: { noteId } }),
    onSuccess: invalidate,
    onError: fail,
  });

  const taskMutation = useMutation({
    mutationFn: () =>
      addTask({
        data: {
          leadId,
          title: taskDraft.title.trim(),
          description: taskDraft.description.trim() || null,
          due_date: taskDraft.due_date ? new Date(taskDraft.due_date).toISOString() : null,
          priority: taskDraft.priority,
        },
      }),
    onSuccess: () => {
      setTaskDraft({ title: "", description: "", due_date: "", priority: "Medium" });
      invalidate();
    },
    onError: fail,
  });

  const taskStatusMutation = useMutation({
    mutationFn: (vars: { taskId: string; status: "Open" | "Done" }) => setTaskStatus({ data: vars }),
    onSuccess: invalidate,
    onError: fail,
  });

  const taskDeleteMutation = useMutation({
    mutationFn: (taskId: string) => removeTask({ data: { taskId } }),
    onSuccess: invalidate,
    onError: fail,
  });

  if (isLoading) {
    return (
      <section className="mx-auto flex max-w-3xl items-center gap-2 px-5 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading lead profile...
      </section>
    );
  }

  if (error || !lead) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-20">
        <div className="surface-card p-8 text-center">
          <p className="font-semibold text-destructive">
            {error instanceof Error ? error.message : "This lead could not be loaded."}
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-full">
            <Link to="/admin/crm">Back to pipeline</Link>
          </Button>
        </div>
      </section>
    );
  }

  const quickTasks = ["Call customer", "Send proposal", "Follow up", "Prepare demo"];

  return (
    <section className="mx-auto w-full max-w-[1200px] px-4 py-10 lg:px-8">
      <Button asChild variant="ghost" size="sm" className="rounded-full">
        <Link to="/admin/crm">
          <ArrowLeft className="size-4" /> Back to pipeline
        </Link>
      </Button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{lead.full_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.company_name} · {lead.country} · added {shortDate(lead.created_at)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill className={stageStyles[lead.pipeline_stage]}>{lead.pipeline_stage}</Pill>
            <Pill className={priorityStyles[lead.priority]}>{lead.priority} priority</Pill>
            <Pill className="bg-muted text-muted-foreground">{lead.service}</Pill>
            <Pill className="bg-muted text-muted-foreground">
              {money(Number(lead.estimated_value))} · {lead.closing_probability}%
            </Pill>
            {isOverdue(lead.next_followup) && (
              <Pill className="bg-destructive/15 text-destructive">
                Follow-up overdue {shortDate(lead.next_followup)}
              </Pill>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            className="rounded-full"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Save changes
          </Button>
          {savedAt && <span className="text-xs text-accent">Saved at {savedAt}</span>}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {/* Customer details */}
          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">Customer details</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail label="Full name" value={lead.full_name} />
              <Detail label="Company" value={lead.company_name} />
              <Detail
                label="Email"
                value={
                  <a className="underline" href={`mailto:${lead.email}`}>
                    {lead.email}
                  </a>
                }
              />
              <Detail
                label="Phone"
                value={
                  <a className="underline" href={`tel:${lead.phone}`}>
                    {lead.phone}
                  </a>
                }
              />
              <Detail label="Country" value={lead.country} />
              <Detail label="Selected service" value={lead.service} />
              <Detail label="Lead source" value={lead.lead_source} />
              <Detail label="Submitted" value={dateTime(lead.created_at)} />
            </dl>
            <div className="mt-4">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Project description
              </p>
              <p className="mt-1.5 text-sm whitespace-pre-line">{lead.project_description}</p>
            </div>
          </div>

          {/* CRM fields */}
          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">Deal &amp; company data</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Pipeline stage">
                <Select
                  value={form.pipeline_stage}
                  onChange={(v) => setForm((f) => ({ ...f, pipeline_stage: v as PipelineStage }))}
                  options={[...PIPELINE_STAGES]}
                />
              </Field>
              <Field label="Priority">
                <Select
                  value={form.priority}
                  onChange={(v) => setForm((f) => ({ ...f, priority: v as Priority }))}
                  options={[...PRIORITIES]}
                />
              </Field>
              <Field label="Assigned to">
                <Input
                  value={form.assigned_to}
                  placeholder="Team member name"
                  onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                />
              </Field>
              <Field label="Lead source">
                <Input
                  value={form.lead_source}
                  onChange={(e) => setForm((f) => ({ ...f, lead_source: e.target.value }))}
                />
              </Field>
              <Field label="Estimated value (USD)">
                <Input
                  type="number"
                  min={0}
                  value={form.estimated_value}
                  onChange={(e) => setForm((f) => ({ ...f, estimated_value: e.target.value }))}
                />
              </Field>
              <Field label="Closing probability (%)">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.closing_probability}
                  onChange={(e) => setForm((f) => ({ ...f, closing_probability: e.target.value }))}
                />
              </Field>
              <Field label="Next follow-up">
                <Input
                  type="date"
                  value={form.next_followup}
                  onChange={(e) => setForm((f) => ({ ...f, next_followup: e.target.value }))}
                />
              </Field>
              <Field label="Last contact">
                <Input
                  type="date"
                  value={form.last_contact}
                  onChange={(e) => setForm((f) => ({ ...f, last_contact: e.target.value }))}
                />
              </Field>
              <Field label="Industry">
                <Input
                  value={form.industry}
                  onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                />
              </Field>
              <Field label="Company size">
                <Input
                  value={form.company_size}
                  placeholder="e.g. 11-50"
                  onChange={(e) => setForm((f) => ({ ...f, company_size: e.target.value }))}
                />
              </Field>
              <Field label="Website">
                <Input
                  value={form.website}
                  placeholder="https://"
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                />
              </Field>
              <Field label="Timezone">
                <Input
                  value={form.timezone}
                  placeholder="e.g. America/New_York"
                  onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                />
              </Field>
              <Field label="Meeting date &amp; time">
                <Input
                  type="datetime-local"
                  value={form.meeting_date}
                  onChange={(e) => setForm((f) => ({ ...f, meeting_date: e.target.value }))}
                />
              </Field>
              <Field label="Meeting link">
                <Input
                  value={form.meeting_link}
                  placeholder="https://meet.google.com/..."
                  onChange={(e) => setForm((f) => ({ ...f, meeting_link: e.target.value }))}
                />
              </Field>
            </div>
            {lead.meeting_link && (
              <a
                href={lead.meeting_link}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline"
              >
                Open meeting link <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>

          {/* Tasks */}
          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {quickTasks.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTaskDraft((d) => ({ ...d, title: t }))}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-primary hover:text-primary"
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
              <Input
                value={taskDraft.title}
                placeholder="Task title"
                onChange={(e) => setTaskDraft((d) => ({ ...d, title: e.target.value }))}
              />
              <Input
                type="date"
                value={taskDraft.due_date}
                onChange={(e) => setTaskDraft((d) => ({ ...d, due_date: e.target.value }))}
              />
              <Select
                value={taskDraft.priority}
                onChange={(v) => setTaskDraft((d) => ({ ...d, priority: v as Priority }))}
                options={[...PRIORITIES]}
              />
              <Button
                className="rounded-full"
                disabled={taskDraft.title.trim().length < 2 || taskMutation.isPending}
                onClick={() => taskMutation.mutate()}
              >
                {taskMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Add
              </Button>
            </div>
            <Textarea
              className="mt-2"
              rows={2}
              value={taskDraft.description}
              placeholder="Optional details"
              onChange={(e) => setTaskDraft((d) => ({ ...d, description: e.target.value }))}
            />

            <div className="mt-4 space-y-2">
              {data.tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet for this lead.</p>
              ) : (
                data.tasks.map((task) => {
                  const done = task.status === "Done";
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 rounded-xl border border-border p-3"
                    >
                      <button
                        type="button"
                        aria-label={done ? "Mark task open" : "Mark task complete"}
                        onClick={() =>
                          taskStatusMutation.mutate({
                            taskId: task.id,
                            status: done ? "Open" : "Done",
                          })
                        }
                        className={done ? "text-accent" : "text-muted-foreground hover:text-primary"}
                      >
                        {done ? (
                          <CheckCircle2 className="size-5" />
                        ) : (
                          <Circle className="size-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : ""}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{task.description}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Pill className={priorityStyles[task.priority]}>{task.priority}</Pill>
                          {task.due_date && (
                            <Pill
                              className={
                                !done && isOverdue(task.due_date)
                                  ? "bg-destructive/15 text-destructive"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              <Clock className="mr-1 size-3" /> {shortDate(task.due_date)}
                            </Pill>
                          )}
                          <Pill className="bg-muted text-muted-foreground">{task.status}</Pill>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Delete task"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => taskDeleteMutation.mutate(task.id)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">Meeting information</h2>
            <dl className="mt-3 space-y-3">
              <Detail label="Scheduled meeting" value={dateTime(lead.meeting_date)} />
              <Detail label="Next follow-up" value={dateTime(lead.next_followup)} />
              <Detail label="Last contact" value={dateTime(lead.last_contact)} />
              <Detail label="Timezone" value={lead.timezone ?? "—"} />
            </dl>
          </div>

          {/* Notes */}
          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">Internal notes</h2>
            <Textarea
              className="mt-3"
              rows={3}
              value={noteDraft}
              placeholder="Add a private note for your team..."
              onChange={(e) => setNoteDraft(e.target.value)}
            />
            <Button
              className="mt-2 rounded-full"
              size="sm"
              disabled={noteDraft.trim().length === 0 || noteMutation.isPending}
              onClick={() => noteMutation.mutate()}
            >
              {noteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add note
            </Button>

            <div className="mt-4 space-y-2">
              {data.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No internal notes yet.</p>
              ) : (
                data.notes.map((note) => (
                  <div key={note.id} className="rounded-xl border border-border p-3">
                    <p className="text-sm whitespace-pre-line">{note.note}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{dateTime(note.created_at)}</span>
                      <button
                        type="button"
                        aria-label="Delete note"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => noteDeleteMutation.mutate(note.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">Activity history</h2>
            <div className="mt-3 space-y-3">
              {data.activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                data.activity.map((entry) => (
                  <div key={entry.id} className="border-l-2 border-border pl-3">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {entry.event_type.replace(/_/g, " ")}
                    </p>
                    <p className="mt-0.5 text-sm">{entry.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{dateTime(entry.created_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm break-words">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
