-- ReviewNudge initial schema
-- All tables enable RLS. Policies ensure a user can only access their own business's data.

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- BUSINESSES (one per owner for MVP)
-- ============================================================================
CREATE TABLE businesses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  google_review_url TEXT NOT NULL,
  reply_to_email  TEXT,
  contact_line    TEXT,                         -- shown in email footer
  timezone        TEXT NOT NULL DEFAULT 'Europe/London',
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','business')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own business"
  ON businesses FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can insert their own business"
  ON businesses FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own business"
  ON businesses FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own business"
  ON businesses FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================================
-- CUSTOMERS
-- ============================================================================
CREATE TABLE customers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  email              TEXT,
  phone              TEXT,                         -- for future SMS
  consent_confirmed  BOOLEAN NOT NULL DEFAULT false,
  unsubscribed       BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, email)
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view customers of their business"
  ON customers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = customers.business_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert customers into their business"
  ON customers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = customers.business_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update customers of their business"
  ON customers FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = customers.business_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete customers of their business"
  ON customers FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = customers.business_id AND b.owner_id = auth.uid()
  ));

CREATE INDEX idx_customers_business_id ON customers(business_id);

-- ============================================================================
-- REVIEW_REQUESTS
-- ============================================================================
CREATE TABLE review_requests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id              UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id              UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  short_code               TEXT NOT NULL UNIQUE,
  status                   TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','clicked')),
  sent_at                  TIMESTAMPTZ,
  first_clicked_at         TIMESTAMPTZ,
  click_count              INT NOT NULL DEFAULT 0,
  reminder_sent_at         TIMESTAMPTZ,
  manually_marked_reviewed BOOLEAN NOT NULL DEFAULT false,
  error_message            TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view review_requests of their business"
  ON review_requests FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = review_requests.business_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert review_requests into their business"
  ON review_requests FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = review_requests.business_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update review_requests of their business"
  ON review_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = review_requests.business_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete review_requests of their business"
  ON review_requests FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = review_requests.business_id AND b.owner_id = auth.uid()
  ));

CREATE INDEX idx_review_requests_business_created ON review_requests(business_id, created_at DESC);
CREATE INDEX idx_review_requests_short_code ON review_requests(short_code);

-- ============================================================================
-- MESSAGE_TEMPLATES
-- ============================================================================
CREATE TABLE message_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('request','reminder')),
  subject      TEXT NOT NULL,
  body         TEXT NOT NULL,
  UNIQUE (business_id, kind)
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view templates of their business"
  ON message_templates FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = message_templates.business_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert templates into their business"
  ON message_templates FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = message_templates.business_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update templates of their business"
  ON message_templates FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = message_templates.business_id AND b.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can delete templates of their business"
  ON message_templates FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = message_templates.business_id AND b.owner_id = auth.uid()
  ));

-- ============================================================================
-- UNSUBSCRIBES
-- ============================================================================
CREATE TABLE unsubscribes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, email)
);

ALTER TABLE unsubscribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view unsubscribes of their business"
  ON unsubscribes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = unsubscribes.business_id AND b.owner_id = auth.uid()
  ));

-- Inserts into unsubscribes may be done by public unsubscribe route via service role.
CREATE POLICY "Owners can insert unsubscribes into their business"
  ON unsubscribes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = unsubscribes.business_id AND b.owner_id = auth.uid()
  ));

-- ============================================================================
-- CLICK_EVENTS
-- ============================================================================
CREATE TABLE click_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_request_id UUID NOT NULL REFERENCES review_requests(id) ON DELETE CASCADE,
  clicked_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent        TEXT
);

ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view click_events of their business"
  ON click_events FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM review_requests r
    JOIN businesses b ON b.id = r.business_id
    WHERE r.id = click_events.review_request_id AND b.owner_id = auth.uid()
  ));

-- Inserts into click_events are done by public /r/[code] route via service role.
CREATE POLICY "Owners can insert click_events for their business"
  ON click_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM review_requests r
    JOIN businesses b ON b.id = r.business_id
    WHERE r.id = click_events.review_request_id AND b.owner_id = auth.uid()
  ));

-- ============================================================================
-- HELPER: generate_unique_short_code()
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_unique_short_code(len INT DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INT := 0;
  pos INT := 0;
  collision BOOLEAN := FALSE;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..len LOOP
      pos := 1 + floor(random() * length(chars))::INT;
      result := result || substr(chars, pos, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM review_requests WHERE short_code = result) INTO collision;
    EXIT WHEN NOT collision;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;
