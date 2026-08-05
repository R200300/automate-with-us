CREATE POLICY "Portal files: owners and admins can read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'portal-files'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));

CREATE POLICY "Portal files: owners and admins can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portal-files'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));

CREATE POLICY "Portal files: owners and admins can update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'portal-files'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')))
  WITH CHECK (bucket_id = 'portal-files'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));

CREATE POLICY "Portal files: owners and admins can delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'portal-files'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));