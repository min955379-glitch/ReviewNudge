-- Replace the 9999-date sentinel used to claim rows during reminder runs
-- with a nullable TIMESTAMPTZ column. This is cleaner than stuffing a magic
-- date into reminder_sent_at (which is semantically "when the reminder was
-- actually delivered").
--
-- Claim lifecycle:
--   1. At the start of each run, reset any claim older than 15 minutes
--      (set reminder_claimed_at = NULL) so rows abandoned by a crashed cron
--      worker can be retried.
--   2. UPDATE eligible rows SET reminder_claimed_at = now(), ordered by
--      sent_at ASC, LIMIT N. This is the atomic claim step.
--   3. SELECT rows WHERE reminder_claimed_at is within this run's window.
--   4. On send success: set reminder_sent_at = now(), reminder_claimed_at = NULL.
--      On send failure: set reminder_claimed_at = NULL (release for retry).
ALTER TABLE review_requests
  ADD COLUMN reminder_claimed_at TIMESTAMPTZ;

-- Fast lookup of claimed rows and rows eligible for claiming.
CREATE INDEX idx_review_requests_unreminded
  ON review_requests (sent_at ASC)
  WHERE status = 'sent'
    AND first_clicked_at IS NULL
    AND reminder_sent_at IS NULL
    AND manually_marked_reviewed = false;

CREATE INDEX idx_review_requests_claimed
  ON review_requests (reminder_claimed_at)
  WHERE reminder_claimed_at IS NOT NULL;
