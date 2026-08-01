-- 1. Enum for pipeline stages
CREATE TYPE public.pipeline_stage AS ENUM ('New','Contacted','Discovery Scheduled','Qualified','Proposal Sent','Negotiation','Won','Lost');
CREATE TYPE public.lead_priority AS ENUM ('Low','Medium','High','Urgent');

-- 2. Extend leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_source text NOT NULL DEFAULT 'Website',
  ADD COLUMN IF NOT EXISTS priority public.lead_priority NOT NULL DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS pipeline_stage public.pipeline_stage NOT NULL DEFAULT 'New',
  ADD COLUMN IF NOT EXISTS next_followup timestamptz,
  ADD COLUMN IF NOT EXISTS last_contact timestamptz,
  ADD COLUMN IF NOT EXISTS estimated_value numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS closing_probability integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS meeting_date timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_link text,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS assigned_user uuid;

-- assigned_to already exists as text; keep it and add uuid assignment for RLS
ALTER TABLE public.leads ADD CONSTRAINT leads_closing_probability_range CHECK (closing_probability BETWEEN 0 AND 100);

-- Backfill pipeline stage from legacy lead_status
UPDATE public.leads SET pipeline_stage =
  CASE lead_status
    WHEN 'New' THEN 'New'
    WHEN 'Contacted' THEN 'Contacted'
    WHEN 'Qualified' THEN 'Qualified'
    WHEN 'Proposal Sent' THEN 'Proposal Sent'
    WHEN 'Won' THEN 'Won'
    WHEN 'Lost' THEN 'Lost'
    ELSE 'New'
  END::public.pipeline_stage,
  lead_source = COALESCE(source, 'Website');

CREATE INDEX IF NOT EXISTS leads_pipeline_stage_idx ON public.leads (pipeline_stage);
CREATE INDEX IF NOT EXISTS leads_assigned_user_idx ON public.leads (assigned_user);
CREATE INDEX IF NOT EXISTS leads_next_followup_idx ON public.leads (next_followup);

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Notes
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 4. Tasks
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  status text NOT NULL DEFAULT 'Open',
  priority public.lead_priority NOT NULL DEFAULT 'Medium',
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS tasks_lead_id_idx ON public.tasks (lead_id);

-- 5. Helper: can the current user access a lead?
CREATE OR REPLACE FUNCTION public.can_access_lead(_lead_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.leads l WHERE l.id = _lead_id AND l.assigned_user = auth.uid());
$$;

-- 6. Lead policies: admins full, assignees limited
DROP POLICY IF EXISTS "Admins can view leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update leads" ON public.leads;
CREATE POLICY "Admins or assignees can view leads" ON public.leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR assigned_user = auth.uid());
CREATE POLICY "Admins or assignees can update leads" ON public.leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR assigned_user = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR assigned_user = auth.uid());

-- lead_activity read for assignees too
DROP POLICY IF EXISTS "Admins can view lead activity" ON public.lead_activity;
CREATE POLICY "Admins or assignees can view lead activity" ON public.lead_activity FOR SELECT TO authenticated
  USING (public.can_access_lead(lead_id));
CREATE POLICY "Team can add lead activity" ON public.lead_activity FOR INSERT TO authenticated
  WITH CHECK (public.can_access_lead(lead_id));

-- 7. Notes policies
CREATE POLICY "Team can view notes" ON public.notes FOR SELECT TO authenticated USING (public.can_access_lead(lead_id));
CREATE POLICY "Team can add notes" ON public.notes FOR INSERT TO authenticated WITH CHECK (public.can_access_lead(lead_id) AND created_by = auth.uid());
CREATE POLICY "Authors can update own notes" ON public.notes FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Authors or admins can delete notes" ON public.notes FOR DELETE TO authenticated USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 8. Tasks policies
CREATE POLICY "Team can view tasks" ON public.tasks FOR SELECT TO authenticated USING (public.can_access_lead(lead_id));
CREATE POLICY "Team can create tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.can_access_lead(lead_id));
CREATE POLICY "Team can update tasks" ON public.tasks FOR UPDATE TO authenticated USING (public.can_access_lead(lead_id)) WITH CHECK (public.can_access_lead(lead_id));
CREATE POLICY "Team can delete tasks" ON public.tasks FOR DELETE TO authenticated USING (public.can_access_lead(lead_id));