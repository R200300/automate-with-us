-- ENUMS
CREATE TYPE public.ai_entity_status AS ENUM ('Draft','Active','Inactive','Archived');
CREATE TYPE public.prompt_category AS ENUM ('Sales','Customer Support','Marketing','Lead Generation','Operations','General');
CREATE TYPE public.workflow_trigger_type AS ENUM ('New Lead','Form Submitted','New Customer','Scheduled Time','Webhook');
CREATE TYPE public.workflow_node_kind AS ENUM ('trigger','action','condition','end');
CREATE TYPE public.workflow_action_type AS ENUM ('Send Email','Create Task','Update Lead','Send Notification','AI Generate Response');
CREATE TYPE public.execution_status AS ENUM ('Running','Success','Failed','Skipped');
CREATE TYPE public.doc_processing_status AS ENUM ('Pending','Processing','Ready','Failed');

-- KNOWLEDGE BASES
CREATE TABLE public.knowledge_bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_bases TO authenticated;
GRANT ALL ON public.knowledge_bases TO service_role;
ALTER TABLE public.knowledge_bases ENABLE ROW LEVEL SECURITY;
CREATE POLICY kb_select ON public.knowledge_bases FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY kb_insert ON public.knowledge_bases FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY kb_update ON public.knowledge_bases FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY kb_delete ON public.knowledge_bases FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- AI ASSISTANTS
CREATE TABLE public.ai_assistants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  knowledge_base_id uuid REFERENCES public.knowledge_bases(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  system_instructions text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT 'Professional',
  language text NOT NULL DEFAULT 'English',
  objective text,
  fallback_behavior text,
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  status public.ai_entity_status NOT NULL DEFAULT 'Draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_assistants TO authenticated;
GRANT ALL ON public.ai_assistants TO service_role;
ALTER TABLE public.ai_assistants ENABLE ROW LEVEL SECURITY;
CREATE POLICY assist_select ON public.ai_assistants FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY assist_insert ON public.ai_assistants FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY assist_update ON public.ai_assistants FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY assist_delete ON public.ai_assistants FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- CHATBOTS
CREATE TABLE public.chatbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assistant_id uuid REFERENCES public.ai_assistants(id) ON DELETE SET NULL,
  knowledge_base_id uuid REFERENCES public.knowledge_bases(id) ON DELETE SET NULL,
  name text NOT NULL,
  welcome_message text NOT NULL DEFAULT 'Hi! How can I help you today?',
  system_prompt text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT 'Friendly',
  language text NOT NULL DEFAULT 'English',
  business_info text,
  contact_info text,
  working_hours text,
  fallback_message text NOT NULL DEFAULT 'Sorry, I could not answer that. A specialist will follow up.',
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  status public.ai_entity_status NOT NULL DEFAULT 'Draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chatbots TO authenticated;
GRANT ALL ON public.chatbots TO service_role;
ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
CREATE POLICY bot_select ON public.chatbots FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY bot_insert ON public.chatbots FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY bot_update ON public.chatbots FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY bot_delete ON public.chatbots FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- KNOWLEDGE DOCUMENTS
CREATE TABLE public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  knowledge_base_id uuid NOT NULL REFERENCES public.knowledge_bases(id) ON DELETE CASCADE,
  name text NOT NULL,
  mime_type text,
  size_bytes bigint NOT NULL DEFAULT 0,
  storage_path text NOT NULL,
  processing_status public.doc_processing_status NOT NULL DEFAULT 'Pending',
  processing_error text,
  extracted_chars integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_documents TO authenticated;
GRANT ALL ON public.knowledge_documents TO service_role;
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY kdoc_select ON public.knowledge_documents FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY kdoc_insert ON public.knowledge_documents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY kdoc_update ON public.knowledge_documents FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY kdoc_delete ON public.knowledge_documents FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- PROMPTS
CREATE TABLE public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  category public.prompt_category NOT NULL DEFAULT 'General',
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  description text,
  is_favorite boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompts TO authenticated;
GRANT ALL ON public.prompts TO service_role;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY prompt_select ON public.prompts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY prompt_insert ON public.prompts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY prompt_update ON public.prompts FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY prompt_delete ON public.prompts FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- WORKFLOWS
CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  trigger_type public.workflow_trigger_type NOT NULL DEFAULT 'New Lead',
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  run_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflows TO authenticated;
GRANT ALL ON public.workflows TO service_role;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY wf_select ON public.workflows FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY wf_insert ON public.workflows FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY wf_update ON public.workflows FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY wf_delete ON public.workflows FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.can_access_workflow(_workflow_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin')
      OR EXISTS (SELECT 1 FROM public.workflows w WHERE w.id = _workflow_id AND w.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.can_access_workflow(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_workflow(uuid) TO authenticated, service_role;

-- WORKFLOW NODES
CREATE TABLE public.workflow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  kind public.workflow_node_kind NOT NULL,
  action_type public.workflow_action_type,
  label text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_nodes TO authenticated;
GRANT ALL ON public.workflow_nodes TO service_role;
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY wfn_select ON public.workflow_nodes FOR SELECT TO authenticated USING (public.can_access_workflow(workflow_id));
CREATE POLICY wfn_insert ON public.workflow_nodes FOR INSERT TO authenticated WITH CHECK (public.can_access_workflow(workflow_id));
CREATE POLICY wfn_update ON public.workflow_nodes FOR UPDATE TO authenticated USING (public.can_access_workflow(workflow_id));
CREATE POLICY wfn_delete ON public.workflow_nodes FOR DELETE TO authenticated USING (public.can_access_workflow(workflow_id));

-- WORKFLOW EXECUTIONS
CREATE TABLE public.workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status public.execution_status NOT NULL DEFAULT 'Running',
  trigger_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workflow_executions TO authenticated;
GRANT ALL ON public.workflow_executions TO service_role;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY wfe_select ON public.workflow_executions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- VOICE AGENTS
CREATE TABLE public.voice_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  assistant_id uuid REFERENCES public.ai_assistants(id) ON DELETE SET NULL,
  name text NOT NULL,
  business_name text,
  voice text NOT NULL DEFAULT 'alloy',
  language text NOT NULL DEFAULT 'English',
  system_instructions text NOT NULL DEFAULT '',
  greeting text,
  fallback_message text,
  business_hours text,
  call_objective text,
  provider text,
  status public.ai_entity_status NOT NULL DEFAULT 'Draft',
  total_calls integer NOT NULL DEFAULT 0,
  successful_calls integer NOT NULL DEFAULT 0,
  missed_calls integer NOT NULL DEFAULT 0,
  total_call_seconds integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_agents TO authenticated;
GRANT ALL ON public.voice_agents TO service_role;
ALTER TABLE public.voice_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY va_select ON public.voice_agents FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY va_insert ON public.voice_agents FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY va_update ON public.voice_agents FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY va_delete ON public.voice_agents FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- AI USAGE (monthly per user)
CREATE TABLE public.ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period_month date NOT NULL,
  ai_requests integer NOT NULL DEFAULT 0,
  chat_messages integer NOT NULL DEFAULT 0,
  voice_calls integer NOT NULL DEFAULT 0,
  workflow_executions integer NOT NULL DEFAULT 0,
  documents_processed integer NOT NULL DEFAULT 0,
  input_tokens bigint NOT NULL DEFAULT 0,
  output_tokens bigint NOT NULL DEFAULT 0,
  request_limit integer NOT NULL DEFAULT 500,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_month)
);
GRANT SELECT ON public.ai_usage TO authenticated;
GRANT ALL ON public.ai_usage TO service_role;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY usage_select ON public.ai_usage FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- AUTOMATION ACTIVITY LOGS
CREATE TABLE public.automation_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor uuid,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  message text NOT NULL,
  level text NOT NULL DEFAULT 'info',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.automation_activity_logs TO authenticated;
GRANT ALL ON public.automation_activity_logs TO service_role;
ALTER TABLE public.automation_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY aalog_select ON public.automation_activity_logs FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- INDEXES
CREATE INDEX idx_ai_assistants_user ON public.ai_assistants(user_id);
CREATE INDEX idx_chatbots_user ON public.chatbots(user_id);
CREATE INDEX idx_kb_user ON public.knowledge_bases(user_id);
CREATE INDEX idx_kdoc_kb ON public.knowledge_documents(knowledge_base_id);
CREATE INDEX idx_prompts_user ON public.prompts(user_id);
CREATE INDEX idx_workflows_user ON public.workflows(user_id);
CREATE INDEX idx_wfn_workflow ON public.workflow_nodes(workflow_id, position);
CREATE INDEX idx_wfe_workflow ON public.workflow_executions(workflow_id, started_at DESC);
CREATE INDEX idx_va_user ON public.voice_agents(user_id);
CREATE INDEX idx_aalog_user ON public.automation_activity_logs(user_id, created_at DESC);

-- UPDATED_AT TRIGGERS
CREATE TRIGGER trg_ai_assistants_updated BEFORE UPDATE ON public.ai_assistants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_chatbots_updated BEFORE UPDATE ON public.chatbots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_kb_updated BEFORE UPDATE ON public.knowledge_bases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_kdoc_updated BEFORE UPDATE ON public.knowledge_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_prompts_updated BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_workflows_updated BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_wfn_updated BEFORE UPDATE ON public.workflow_nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_va_updated BEFORE UPDATE ON public.voice_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_usage_updated BEFORE UPDATE ON public.ai_usage FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();