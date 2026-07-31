INSERT INTO public.user_roles (user_id, role)
VALUES ('d46757e8-680b-4756-9112-95ee7a8fedd2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;