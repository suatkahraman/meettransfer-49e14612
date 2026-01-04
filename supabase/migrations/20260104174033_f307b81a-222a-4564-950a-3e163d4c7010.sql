-- Fix linter WARN "Extension in Public" for pg_net (pg_net is not relocatable, so SET SCHEMA fails)
-- Recreate the extension installed under the extensions schema.
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;