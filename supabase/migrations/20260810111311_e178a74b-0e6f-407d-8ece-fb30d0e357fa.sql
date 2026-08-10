REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_access_lead(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_lead(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_access_project(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_project(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_access_ticket(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_ticket(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_access_workflow(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_workflow(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;