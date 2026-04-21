-- Run before flipping tenantId to NOT NULL. Must complete without exception.
-- If any table has NULL tenantId rows, this raises an exception with details.
DO $$
DECLARE
  tbl TEXT;
  null_count INT;
  bad_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.columns
    WHERE column_name = 'tenantId' AND is_nullable = 'YES' AND table_schema = 'public'
    AND table_name NOT IN ('users') -- User.tenantId stays nullable by design (global users, super admin)
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE "tenantId" IS NULL', tbl) INTO null_count;
    IF null_count > 0 THEN
      bad_tables := array_append(bad_tables, format('%s (%s rows)', tbl, null_count));
    END IF;
  END LOOP;
  IF array_length(bad_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Tables with NULL tenantId: %', array_to_string(bad_tables, ', ');
  ELSE
    RAISE NOTICE 'All tenantId columns are fully populated. Safe to flip to NOT NULL.';
  END IF;
END $$;
