
-- Add new columns to storage_providers table
ALTER TABLE storage_providers
ADD COLUMN priority integer DEFAULT 0,
ADD COLUMN description text,
ADD COLUMN file_type_patterns jsonb,
ADD COLUMN is_backup boolean DEFAULT false,
ADD COLUMN client_id text;

-- Create a function to update file type mappings
CREATE OR REPLACE FUNCTION update_provider_usage_metrics() 
RETURNS trigger AS $$
BEGIN
  -- Calculate and update usage metrics for all providers
  -- This is a simplified implementation. In production, you would
  -- track which provider each file is stored in.
  FOR r IN SELECT id FROM storage_providers WHERE is_active = true
  LOOP
    -- Update metrics JSON
    UPDATE storage_providers
    SET credentials = jsonb_set(
      credentials,
      '{usageMetrics}',
      (
        SELECT json_build_object(
          'totalStorage', COALESCE(SUM(f.size), 0),
          'filesCount', COUNT(f.id),
          'lastUpdated', now()
        )::jsonb
        FROM files f
      )
    )
    WHERE id = r.id;
  END LOOP;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update metrics when files are added or removed
CREATE TRIGGER update_provider_metrics
AFTER INSERT OR DELETE OR UPDATE OF size ON files
FOR EACH STATEMENT
EXECUTE FUNCTION update_provider_usage_metrics();
