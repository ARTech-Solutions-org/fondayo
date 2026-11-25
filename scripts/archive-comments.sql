-- statement
SELECT pg_advisory_xact_lock(684123, 1);

-- statement
CREATE TABLE IF NOT EXISTS public.fondayo_comment_archive (
  comment_id text PRIMARY KEY,
  name text NOT NULL,
  message text NOT NULL,
  profile text,
  tablet_number integer,
  led_number integer,
  scene_number integer,
  popup_at timestamptz,
  archived_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

-- statement
CREATE OR REPLACE FUNCTION public.fondayo_archive_comment_rows(comments jsonb)
RETURNS void
LANGUAGE sql
SET search_path = pg_catalog, public
AS $archive$
  INSERT INTO public.fondayo_comment_archive (
    comment_id, name, message, profile, tablet_number, led_number, scene_number, popup_at
  )
  SELECT id, name, message, NULLIF(profile, ''), tablet, panel + 1,
    scene, to_timestamp("start" / 1000.0)
  FROM jsonb_to_recordset(comments) AS entry(
    id text, name text, message text, profile text, tablet integer,
    panel integer, scene integer, "start" bigint
  )
  WHERE id IS NOT NULL AND name IS NOT NULL AND message IS NOT NULL
  ON CONFLICT (comment_id) DO NOTHING;
$archive$;

-- statement
CREATE OR REPLACE FUNCTION public.fondayo_archive_new_wall_comments()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $archive$
DECLARE
  comments jsonb := COALESCE(NEW.payload->'queue', '[]'::jsonb);
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.payload->'queue' IS NOT DISTINCT FROM OLD.payload->'queue' THEN
      RETURN NEW;
    END IF;

    SELECT COALESCE(jsonb_agg(entry), '[]'::jsonb) INTO comments
    FROM (
      SELECT jsonb_array_elements(comments)
      EXCEPT
      SELECT jsonb_array_elements(COALESCE(OLD.payload->'queue', '[]'::jsonb))
    ) AS added(entry);
  END IF;

  IF comments <> '[]'::jsonb THEN
    PERFORM public.fondayo_archive_comment_rows(comments);
  END IF;
  RETURN NEW;
END;
$archive$;

-- statement
CREATE OR REPLACE TRIGGER fondayo_archive_new_comments
  AFTER INSERT OR UPDATE OF payload ON public.fondayo_wall
  FOR EACH ROW EXECUTE FUNCTION public.fondayo_archive_new_wall_comments();

-- statement
-- Backfill the live queue and any older comments that are still buffered for retries.
SELECT public.fondayo_archive_comment_rows(
  COALESCE(wall.payload->'queue', '[]'::jsonb) || COALESCE((
    SELECT jsonb_agg(entry)
    FROM jsonb_each(COALESCE(wall.payload->'recent', '{}'::jsonb)) AS recent(id, entry)
  ), '[]'::jsonb)
)
FROM public.fondayo_wall AS wall;
