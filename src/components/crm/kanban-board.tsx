import { useState } from "react";
import { Loader2 } from "lucide-react";
import { PIPELINE_STAGES, type CrmLead, type PipelineStage } from "@/lib/crm.functions";
import {
  LeadLink,
  Pill,
  isOverdue,
  money,
  priorityStyles,
  shortDate,
  stageStyles,
} from "./crm-shared";

export function KanbanBoard({
  leads,
  onMove,
  movingId,
}: {
  leads: CrmLead[];
  onMove: (leadId: string, stage: PipelineStage) => void;
  movingId: string | null;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<PipelineStage | null>(null);

  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const column = leads.filter((l) => l.pipeline_stage === stage);
        const value = column.reduce((sum, l) => sum + Number(l.estimated_value || 0), 0);
        return (
          <div
            key={stage}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
            onDrop={(e) => {
              e.preventDefault();
              setOverStage(null);
              const id = dragId ?? e.dataTransfer.getData("text/plain");
              setDragId(null);
              const lead = leads.find((l) => l.id === id);
              if (lead && lead.pipeline_stage !== stage) onMove(id, stage);
            }}
            className={`flex w-[268px] shrink-0 flex-col rounded-2xl border p-3 transition-colors ${
              overStage === stage ? "border-primary bg-primary/5" : "border-border bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <Pill className={stageStyles[stage]}>{stage}</Pill>
                <span className="text-xs font-semibold text-muted-foreground">{column.length}</span>
              </div>
              <span className="text-xs text-muted-foreground">{money(value)}</span>
            </div>

            <div className="mt-3 flex flex-1 flex-col gap-2">
              {column.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                  Drop a lead here
                </p>
              ) : (
                column.map((lead) => (
                  <article
                    key={lead.id}
                    draggable
                    onDragStart={(e) => {
                      setDragId(lead.id);
                      e.dataTransfer.setData("text/plain", lead.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={`cursor-grab rounded-xl border border-border bg-card p-3 shadow-sm transition-opacity active:cursor-grabbing ${
                      dragId === lead.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <LeadLink lead={lead} className="text-sm" />
                      {movingId === lead.id && (
                        <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {lead.company_name}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{lead.service}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Pill className={priorityStyles[lead.priority]}>{lead.priority}</Pill>
                      {Number(lead.estimated_value) > 0 && (
                        <Pill className="bg-muted text-muted-foreground">
                          {money(Number(lead.estimated_value))}
                        </Pill>
                      )}
                      {lead.next_followup && (
                        <Pill
                          className={
                            isOverdue(lead.next_followup)
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {isOverdue(lead.next_followup) ? "Overdue " : "Follow-up "}
                          {shortDate(lead.next_followup)}
                        </Pill>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
