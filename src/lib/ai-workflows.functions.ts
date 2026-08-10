import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const WORKFLOW_TRIGGERS = [
  "New Lead",
  "Form Submitted",
  "New Customer",
  "Scheduled Time",
  "Webhook",
] as const;

export const WORKFLOW_ACTIONS = [
  "Send Email",
  "Create Task",
  "Update Lead",
  "Send Notification",
  "AI Generate Response",
] as const;

export const NODE_KINDS = ["trigger", "action", "condition", "end"] as const;

export type WorkflowTrigger = (typeof WORKFLOW_TRIGGERS)[number];
export type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];
export type NodeKind = (typeof NODE_KINDS)[number];

export type WorkflowNode = {
  id: string;
  workflow_id: string;
  kind: NodeKind;
  label: string;
  action_type: WorkflowAction | null;
  config: Record<string, unknown>;
  position: number;
};

export type Workflow = {
  id: string;
  name: string;
  description: string | null;
  trigger_type: WorkflowTrigger;
  trigger_config: Record<string, unknown>;
  is_active: boolean;
  run_count: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkflowExecution = {
  id: string;
  workflow_id: string;
  status: "Running" | "Success" | "Failed" | "Skipped";
  steps: Array<{ label: string; status: string; detail?: string }>;
  trigger_payload: Record<string, unknown>;
  error: string | null;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
};

const WF_COLUMNS =
  "id, name, description, trigger_type, trigger_config, is_active, run_count, last_run_at, created_at, updated_at";
const NODE_COLUMNS = "id, workflow_id, kind, label, action_type, config, position";
const EXEC_COLUMNS =
  "id, workflow_id, status, steps, trigger_payload, error, started_at, finished_at, duration_ms";

export const listWorkflows = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [workflows, nodes, executions] = await Promise.all([
      context.supabase.from("workflows").select(WF_COLUMNS).order("created_at", { ascending: false }),
      context.supabase.from("workflow_nodes").select(NODE_COLUMNS).order("position"),
      context.supabase
        .from("workflow_executions")
        .select(EXEC_COLUMNS)
        .order("started_at", { ascending: false })
        .limit(50),
    ]);
    if (workflows.error) throw new Error(workflows.error.message);

    return {
      workflows: (workflows.data ?? []) as unknown as Workflow[],
      nodes: (nodes.data ?? []) as unknown as WorkflowNode[],
      executions: (executions.data ?? []) as unknown as WorkflowExecution[],
    };
  });

const nodeSchema = z.object({
  kind: z.enum(NODE_KINDS),
  label: z.string().trim().min(1).max(120),
  actionType: z.enum(WORKFLOW_ACTIONS).nullable().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

const workflowSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).optional().nullable(),
  triggerType: z.enum(WORKFLOW_TRIGGERS),
  nodes: z.array(nodeSchema).max(20),
});

export const saveWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => workflowSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    let workflowId = data.id ?? null;

    if (workflowId) {
      const { error } = await context.supabase
        .from("workflows")
        .update({
          name: data.name,
          description: data.description ?? null,
          trigger_type: data.triggerType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflowId);
      if (error) throw new Error(error.message);
      await context.supabase.from("workflow_nodes").delete().eq("workflow_id", workflowId);
    } else {
      const { data: row, error } = await context.supabase
        .from("workflows")
        .insert({
          name: data.name,
          description: data.description ?? null,
          trigger_type: data.triggerType,
          user_id: context.userId,
          created_by: context.userId,
        })
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      workflowId = row?.id ?? null;
      await logAutomationEvent({
        userId: context.userId,
        eventType: "Workflow Created",
        entityType: "workflow",
        entityId: workflowId,
        message: `Workflow "${data.name}" created`,
      });
    }

    if (!workflowId) throw new Error("Could not save the workflow.");

    if (data.nodes.length > 0) {
      const { error } = await context.supabase.from("workflow_nodes").insert(
        data.nodes.map((node, index) => ({
          workflow_id: workflowId as string,
          kind: node.kind,
          label: node.label,
          action_type: node.kind === "action" ? (node.actionType ?? null) : null,
          config: (node.config ?? {}) as never,
          position: index,
        })),
      );
      if (error) throw new Error(error.message);
    }

    return { id: workflowId };
  });

export const toggleWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; isActive: boolean }) =>
    z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { logAutomationEvent } = await import("@/lib/ai-hub.server");
    const { error } = await context.supabase
      .from("workflows")
      .update({ is_active: data.isActive, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAutomationEvent({
      userId: context.userId,
      eventType: data.isActive ? "Workflow Activated" : "Workflow Deactivated",
      entityType: "workflow",
      entityId: data.id,
      message: `Workflow ${data.isActive ? "activated" : "deactivated"}`,
    });
    return { ok: true };
  });

export const deleteWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("workflows").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

function compare(left: unknown, operator: string, right: string) {
  const a = String(left ?? "").toLowerCase();
  const b = right.toLowerCase();
  switch (operator) {
    case "not_equals":
      return a !== b;
    case "contains":
      return a.includes(b);
    case "is_empty":
      return a.length === 0;
    case "is_not_empty":
      return a.length > 0;
    default:
      return a === b;
  }
}

const runSchema = z.object({
  id: z.string().uuid(),
  payload: z.record(z.string(), z.string().max(2000)).optional(),
});

/** Executes a workflow's nodes in order and records a full execution log. */
export const runWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => runSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { logAutomationEvent, bumpUsage, createNotification } = await import("@/lib/ai-hub.server");
    const { callAiGateway } = await import("@/lib/ai-gateway.server");
    const { sendPortalEmail, getUserEmail } = await import("@/lib/portal-notify.server");
    const { supabase, userId } = context;

    const { data: workflow, error } = await supabase
      .from("workflows")
      .select(WF_COLUMNS)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!workflow) throw new Error("Workflow not found.");

    const { data: nodeRows } = await supabase
      .from("workflow_nodes")
      .select(NODE_COLUMNS)
      .eq("workflow_id", data.id)
      .order("position");
    const nodes = (nodeRows ?? []) as unknown as WorkflowNode[];

    const startedAt = new Date();
    const { data: execution } = await supabaseAdmin
      .from("workflow_executions")
      .insert({
        workflow_id: data.id,
        user_id: userId,
        status: "Running",
        trigger_payload: (data.payload ?? {}) as never,
        steps: [] as never,
      })
      .select("id")
      .maybeSingle();

    const steps: Array<{ label: string; status: string; detail?: string }> = [];
    const payload = data.payload ?? {};
    let status: WorkflowExecution["status"] = "Success";
    let failure: string | null = null;

    try {
      for (const node of nodes) {
        const config = (node.config ?? {}) as Record<string, string>;

        if (node.kind === "trigger") {
          steps.push({ label: node.label, status: "ok", detail: `Trigger: ${workflow.trigger_type}` });
          continue;
        }

        if (node.kind === "end") {
          steps.push({ label: node.label, status: "ok", detail: "Workflow finished" });
          break;
        }

        if (node.kind === "condition") {
          const passed = compare(payload[config["field"] ?? ""], config["operator"] ?? "equals", config["value"] ?? "");
          steps.push({
            label: node.label,
            status: passed ? "ok" : "stopped",
            detail: passed ? "Condition met" : "Condition not met — workflow stopped",
          });
          if (!passed) {
            status = "Skipped";
            break;
          }
          continue;
        }

        switch (node.action_type) {
          case "Send Notification": {
            await createNotification({
              userId,
              type: "automation",
              title: config["title"] || workflow.name,
              message: config["message"] || "Workflow notification",
              link: "/dashboard/ai/workflows",
            });
            steps.push({ label: node.label, status: "ok", detail: "In-app notification created" });
            break;
          }
          case "Send Email": {
            const to = config["to"] || (await getUserEmail(userId));
            if (!to) {
              steps.push({ label: node.label, status: "skipped", detail: "No recipient email available" });
              break;
            }
            const result = await sendPortalEmail({
              to,
              subject: config["subject"] || `Automation: ${workflow.name}`,
              heading: config["subject"] || workflow.name,
              intro: config["body"] || "This message was sent by a Nexora automation workflow.",
              idempotencyKey: `wf-${execution?.id ?? Date.now()}-${node.id}`,
            });
            steps.push({
              label: node.label,
              status: result.sent ? "ok" : "skipped",
              detail: result.sent ? `Email sent to ${to}` : `Email not sent: ${result.reason}`,
            });
            break;
          }
          case "Create Task": {
            const leadId = payload["lead_id"];
            if (!leadId) {
              steps.push({ label: node.label, status: "skipped", detail: "No lead_id in the payload" });
              break;
            }
            const { error: taskError } = await supabase.from("tasks").insert({
              lead_id: leadId,
              title: config["title"] || `Follow up — ${workflow.name}`,
              description: config["description"] || null,
              assigned_to: userId,
            });
            steps.push({
              label: node.label,
              status: taskError ? "failed" : "ok",
              detail: taskError ? taskError.message : "CRM task created",
            });
            if (taskError) throw new Error(taskError.message);
            break;
          }
          case "Update Lead": {
            const leadId = payload["lead_id"];
            if (!leadId) {
              steps.push({ label: node.label, status: "skipped", detail: "No lead_id in the payload" });
              break;
            }
            const update: Record<string, string> = {};
            if (config["pipeline_stage"]) update["pipeline_stage"] = config["pipeline_stage"];
            if (config["lead_status"]) update["lead_status"] = config["lead_status"];
            if (Object.keys(update).length === 0) {
              steps.push({ label: node.label, status: "skipped", detail: "Nothing configured to update" });
              break;
            }
            const { error: leadError } = await supabase
              .from("leads")
              .update(update as never)
              .eq("id", leadId);
            steps.push({
              label: node.label,
              status: leadError ? "failed" : "ok",
              detail: leadError ? leadError.message : `Lead updated: ${Object.keys(update).join(", ")}`,
            });
            if (leadError) throw new Error(leadError.message);
            break;
          }
          case "AI Generate Response": {
            let prompt = config["prompt"] || "Summarise the workflow payload for the team.";
            for (const [key, value] of Object.entries(payload)) {
              prompt = prompt.replaceAll(`{{${key}}}`, value);
            }
            const result = await callAiGateway({ messages: [{ role: "user", content: prompt }] });
            await bumpUsage(userId, {
              ai_requests: 1,
              input_tokens: result.inputTokens,
              output_tokens: result.outputTokens,
            });
            steps.push({
              label: node.label,
              status: "ok",
              detail: result.text.slice(0, 800) || "Empty AI response",
            });
            break;
          }
          default:
            steps.push({ label: node.label, status: "skipped", detail: "No action configured" });
        }
      }
    } catch (err) {
      status = "Failed";
      failure = err instanceof Error ? err.message : "Unknown workflow error";
    }

    const finishedAt = new Date();
    if (execution?.id) {
      await supabaseAdmin
        .from("workflow_executions")
        .update({
          status,
          steps: steps as never,
          error: failure,
          finished_at: finishedAt.toISOString(),
          duration_ms: finishedAt.getTime() - startedAt.getTime(),
        })
        .eq("id", execution.id);
    }

    await supabase
      .from("workflows")
      .update({ run_count: workflow.run_count + 1, last_run_at: finishedAt.toISOString() })
      .eq("id", data.id);

    await bumpUsage(userId, { workflow_executions: 1 });
    await logAutomationEvent({
      userId,
      eventType: "Workflow Executed",
      entityType: "workflow",
      entityId: data.id,
      message: `Workflow "${workflow.name}" finished with status ${status}`,
      level: status === "Failed" ? "error" : "info",
      metadata: { steps: steps.length, execution_id: execution?.id ?? null },
    });

    return { status, steps, error: failure };
  });
