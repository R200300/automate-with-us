-- Restrict lead_status to the workflow set
ALTER TABLE public.leads
  ADD CONSTRAINT leads_lead_status_check
  CHECK (lead_status IN ('New','Contacted','Qualified','Proposal Sent','Won','Lost'));

ALTER TABLE public.leads
  ADD COLUMN seen_at timestamptz,
  ADD COLUMN customer_email_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN customer_email_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN customer_email_error text,
  ADD COLUMN owner_email_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN owner_email_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN owner_email_error text,
  ADD COLUMN scheduled_at timestamptz,
  ADD COLUMN calendar_event_id text,
  ADD COLUMN calendar_event_link text,
  ADD COLUMN calendar_status text NOT NULL DEFAULT 'none',
  ADD COLUMN calendar_error text;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_customer_email_status_check CHECK (customer_email_status IN ('pending','sent','failed','skipped')),
  ADD CONSTRAINT leads_owner_email_status_check CHECK (owner_email_status IN ('pending','sent','failed','skipped')),
  ADD CONSTRAINT leads_calendar_status_check CHECK (calendar_status IN ('none','booked','failed'));

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_seen_at_idx ON public.leads (seen_at);

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activity / audit log
CREATE TABLE public.lead_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  message text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lead_activity_lead_id_idx ON public.lead_activity (lead_id, created_at DESC);

GRANT SELECT ON public.lead_activity TO authenticated;
GRANT ALL ON public.lead_activity TO service_role;

ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view lead activity"
ON public.lead_activity FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));