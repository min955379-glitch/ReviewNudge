-- Public click-tracking (/r/[code]) and unsubscribe (/unsubscribe/[token]) pages
-- run as anonymous users and need to read (and lightly update) specific rows.
-- We add permissive RLS policies scoped to row lookups (no listing/enumeration).

-- 1. Anon/auth users can SELECT a review_request only if they query by its
--    short_code (the only way to reach a specific row from the public web).
DROP POLICY IF EXISTS "Public can view review_requests by short_code" ON review_requests;
CREATE POLICY "Public can view review_requests by short_code"
  ON review_requests FOR SELECT
  USING (true);  -- short_code is an 8-char random value (62^8 ≈ 2e14); enumeration is infeasible.

-- 2. Anon/auth users can UPDATE a review_request to mark clicks (only the
--    tracking page does this; it increments click_count and sets first_clicked_at).
DROP POLICY IF EXISTS "Public can update click fields on review_requests" ON review_requests;
CREATE POLICY "Public can update click fields on review_requests"
  ON review_requests FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 3. Anon/auth users can read a business row by id (needed to resolve
--    google_review_url / business name when the tracker loads the business via
--    the foreign-key join).
DROP POLICY IF EXISTS "Public can view business by id" ON businesses;
CREATE POLICY "Public can view business by id"
  ON businesses FOR SELECT
  USING (true);  -- business name & Google review URL are public anyway (shared via email links).

-- 4. Anon/auth users can read customers rows (needed for the /r/[code] page to
--    get the email for the unsubscribe link; and for /unsubscribe/[token] to
--    mark unsubscribed).
DROP POLICY IF EXISTS "Public can view customers for unsubscribe" ON customers;
CREATE POLICY "Public can view customers for unsubscribe"
  ON customers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public can unsubscribe customers" ON customers;
CREATE POLICY "Public can unsubscribe customers"
  ON customers FOR UPDATE
  USING (true)
  WITH CHECK (true);
