REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE ALL ON FUNCTION public.can_access_lead(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.can_access_project(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.can_access_ticket(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.can_access_workflow(uuid) FROM anon;