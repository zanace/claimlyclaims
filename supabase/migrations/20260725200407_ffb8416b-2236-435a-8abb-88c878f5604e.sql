CREATE TABLE public.document_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item text NOT NULL,
  path text NOT NULL,
  file_name text,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_uploads TO authenticated;
GRANT ALL ON public.document_uploads TO service_role;

ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY docs_select ON public.document_uploads FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY docs_insert_own ON public.document_uploads FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY docs_delete_own ON public.document_uploads FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY claim_docs_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'claim-docs' AND (auth.uid()::text = (storage.foldername(name))[1] OR private.has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY claim_docs_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'claim-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY claim_docs_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'claim-docs' AND auth.uid()::text = (storage.foldername(name))[1]);