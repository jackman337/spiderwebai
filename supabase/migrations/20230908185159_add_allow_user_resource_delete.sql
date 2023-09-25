DROP POLICY IF EXISTS "Give users delete access to own folder 1te1ury_0" ON storage.objects;

CREATE POLICY "Give users delete access to own folder 1te1ury_0" ON storage.objects;

DROP POLICY IF EXISTS "Give users delete access to own folder 1te1ury_0" ON storage.objects;

CREATE POLICY "Give users delete access to own folder 1te1ury_0" ON storage.objects FOR DELETE TO public USING (bucket_id = 'resource' AND auth.uid()::text = (storage.foldername(name))[1]);