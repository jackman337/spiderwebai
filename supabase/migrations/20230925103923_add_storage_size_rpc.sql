CREATE OR REPLACE FUNCTION get_folder_size(folder_name TEXT) RETURNS NUMERIC AS $$
DECLARE
  folder_size NUMERIC;
BEGIN
  SELECT COALESCE( SUM( CAST(metadata->>'size' AS INTEGER ) ), 0)
  INTO folder_size
  FROM storage.objects
  WHERE bucket_id = 'resource'
  AND name LIKE folder_name || '/%';

  RETURN folder_size;
END;
$$ LANGUAGE plpgsql;
