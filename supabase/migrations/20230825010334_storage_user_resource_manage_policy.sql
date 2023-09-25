DROP POLICY IF EXISTS "Give users access to own folder 1te1ury_0" ON storage.objects;

CREATE POLICY "Give users access to own folder 1te1ury_0" ON storage.objects FOR SELECT TO public USING (bucket_id = 'resource' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Give users access to own folder 1te1ury_1" ON storage.objects;

CREATE POLICY "Give users access to own folder 1te1ury_1" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'resource' AND auth.uid()::text = (storage.foldername(name))[1]);