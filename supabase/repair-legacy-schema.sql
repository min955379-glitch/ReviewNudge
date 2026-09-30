-- ReviewNudge schema repair: align pre-existing (Phase 1/alpha) tables
-- with the Phase-5+ schema used by the current code.
--
-- Run this AFTER run-all-migrations-safe.sql. It is safe to re-run.
--
-- Background: an older alpha build used a different message_templates shape
-- (kind/subject/body) and click_events shape (review_request_id/clicked_at).
-- The production code now uses request_subject/request_body/reminder_subject/
-- reminder_body/updated_at on message_templates, and ip_hash/user_agent/is_bot/
-- created_at on click_events. We migrate in place without dropping data:
--  - the 'request' template (old default subject/body) becomes request_subject/body
--  - the 'reminder' template (if any) becomes reminder_subject/body; otherwise
--    the default reminder template is seeded
--  - click_events.clicked_at is renamed to created_at, request_id is renamed
--    back to review_request_id if needed; new nullable columns added.

-- ===========================================================================
-- message_templates repair
-- ===========================================================================
ALTER TABLE message_templates
  ADD COLUMN IF NOT EXISTS request_subject  TEXT NOT NULL DEFAULT 'Could you leave us a quick review?',
  ADD COLUMN IF NOT EXISTS request_body     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reminder_subject TEXT NOT NULL DEFAULT 'A quick reminder — could you leave us a review?',
  ADD COLUMN IF NOT EXISTS reminder_body    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now();

-- If old rows exist with kind/subject/body (alpha schema), backfill the new columns from them.
-- Guard each statement with a column-existence check so fresh projects skip safely.
DO $$
DECLARE
  has_kind BOOLEAN;
  has_subject BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='message_templates' AND column_name='kind'
  ) INTO has_kind;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='message_templates' AND column_name='subject'
  ) INTO has_subject;

  IF has_kind AND has_subject THEN
    EXECUTE $u$
      UPDATE message_templates
         SET request_subject = subject,
             request_body    = body,
             updated_at      = now()
       WHERE kind = 'request'
         AND request_subject = 'Could you leave us a quick review?'
         AND subject IS NOT NULL;
    $u$;
    EXECUTE $u$
      UPDATE message_templates
         SET reminder_subject = subject,
             reminder_body    = body,
             updated_at       = now()
       WHERE kind = 'reminder'
         AND reminder_subject = 'A quick reminder — could you leave us a review?'
         AND subject IS NOT NULL;
    $u$;
    EXECUTE $u$
      INSERT INTO message_templates (business_id, kind, subject, body,
                                     request_subject, request_body,
                                     reminder_subject, reminder_body, updated_at)
      SELECT business_id, 'reminder',
             'A quick reminder — could you leave us a review?', '',
             'A quick reminder — could you leave us a review?', '',
             'A quick reminder — could you leave us a review?', '',
             now()
        FROM message_templates mt
       WHERE kind = 'request'
         AND NOT EXISTS (
           SELECT 1 FROM message_templates mt2
            WHERE mt2.business_id = mt.business_id AND mt2.kind = 'reminder'
         );
    $u$;
  END IF;
END $$;

-- Now drop the legacy columns (they're no longer used by the code).
ALTER TABLE message_templates DROP COLUMN IF EXISTS kind;
ALTER TABLE message_templates DROP COLUMN IF EXISTS subject;
ALTER TABLE message_templates DROP COLUMN IF EXISTS body;

-- Reinstate the UNIQUE (business_id) constraint if not present.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'message_templates_business_id_key') THEN
      ALTER TABLE message_templates ADD CONSTRAINT message_templates_business_id_key UNIQUE (business_id);
  END IF;
END $$;

-- ===========================================================================
-- click_events repair
-- ===========================================================================
-- Old schema: (id, review_request_id, clicked_at)
-- New schema: (id, request_id, ip_hash, user_agent, is_bot, created_at)
-- Rename columns if they exist under the old names.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='click_events' AND column_name='review_request_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='click_events' AND column_name='request_id') THEN
      ALTER TABLE click_events RENAME COLUMN review_request_id TO request_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='click_events' AND column_name='clicked_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_name='click_events' AND column_name='created_at') THEN
      ALTER TABLE click_events RENAME COLUMN clicked_at TO created_at;
  END IF;
END $$;

ALTER TABLE click_events
  ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES review_requests(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS ip_hash    TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS is_bot     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Re-add FK if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname LIKE '%click_events_request_id%fkey') THEN
      ALTER TABLE click_events ADD CONSTRAINT click_events_request_id_fkey
        FOREIGN KEY (request_id) REFERENCES review_requests(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure request_id is populated for any old row that has no value (defensive;
-- in practice the old review_request_id was renamed above).
-- We can't infer request_id from nothing so leave it NULL; new events from
-- the app will always write request_id.
