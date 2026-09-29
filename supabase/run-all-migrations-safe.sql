-- ReviewNudge idempotent schema sync
-- Run this in the Supabase SQL Editor. It is safe to re-run:
--   - only creates tables/extensions/policies/indexes/columns that are missing
--   - leaves existing data intact
-- Run this INSTEAD OF running 00001–00005 individually if those fail on duplicates.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper: short_code (nanoid-like) 8 alnum
CREATE OR REPLACE FUNCTION generate_short_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  code  TEXT := '';
  i     INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ===========================================================================
-- TABLES (only create if missing)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS businesses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL,
  name            TEXT NOT NULL,
  google_review_url TEXT NOT NULL,
  reply_to_email  TEXT,
  contact_line    TEXT,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  plan            TEXT NOT NULL DEFAULT 'free',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  consent_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  unsubscribed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, email)
);

CREATE TABLE IF NOT EXISTS message_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
  request_subject TEXT NOT NULL DEFAULT 'Could you leave us a quick review?',
  request_body  TEXT NOT NULL DEFAULT '',
  reminder_subject TEXT NOT NULL DEFAULT 'A quick reminder — could you leave us a review?',
  reminder_body TEXT NOT NULL DEFAULT '',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS review_requests (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id          UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id          UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  short_code           TEXT NOT NULL UNIQUE,
  status               TEXT NOT NULL DEFAULT 'queued',
  sent_at              TIMESTAMPTZ,
  first_clicked_at     TIMESTAMPTZ,
  click_count          INTEGER NOT NULL DEFAULT 0,
  reminder_sent_at     TIMESTAMPTZ,
  manually_marked_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  error_message        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS click_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  UUID NOT NULL REFERENCES review_requests(id) ON DELETE CASCADE,
  ip_hash     TEXT,
  user_agent  TEXT,
  is_bot      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===========================================================================
-- Columns added in later migrations (only add if missing)
-- ===========================================================================
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS mailing_address       TEXT NOT NULL DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_customer_id  TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_subscription_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_provider     TEXT DEFAULT 'polar';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status  TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS current_period_end   TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

ALTER TABLE review_requests ADD COLUMN IF NOT EXISTS reminder_claimed_at TIMESTAMPTZ;

-- Constrain plan if the plain TEXT default was used (safe if constraint exists)
DO $$ BEGIN
  ALTER TABLE businesses ADD CONSTRAINT businesses_plan_check
    CHECK (plan IN ('free','pro','business'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Constrain status
DO $$ BEGIN
  ALTER TABLE review_requests ADD CONSTRAINT review_requests_status_check
    CHECK (status IN ('queued','sent','clicked','failed','reviewed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================================================
-- RLS — owner-only policies (skip if policies already exist)
-- ===========================================================================
ALTER TABLE businesses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events      ENABLE ROW LEVEL SECURITY;

-- Helper to create policies idempotently
CREATE OR REPLACE FUNCTION private.ensure_policy(pol text, tbl text, def text)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = pol AND tablename = tbl) THEN
    EXECUTE format('CREATE POLICY %I ON %I %s', pol, tbl, def);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- businesses: owner selects/updates/inserts their own row
SELECT private.ensure_policy('business_owner_select','businesses','FOR SELECT USING (owner_id = auth.uid())');
SELECT private.ensure_policy('business_owner_insert','businesses','FOR INSERT WITH CHECK (owner_id = auth.uid())');
SELECT private.ensure_policy('business_owner_update','businesses','FOR UPDATE USING (owner_id = auth.uid())');

-- customers: scoped to business of the owner
SELECT private.ensure_policy('customer_business_select','customers',
  'FOR SELECT USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = customers.business_id AND b.owner_id = auth.uid()))');
SELECT private.ensure_policy('customer_business_insert','customers',
  'FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM businesses b WHERE b.id = customers.business_id AND b.owner_id = auth.uid()))');
SELECT private.ensure_policy('customer_business_update','customers',
  'FOR UPDATE USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = customers.business_id AND b.owner_id = auth.uid()))');
SELECT private.ensure_policy('customer_business_delete','customers',
  'FOR DELETE USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = customers.business_id AND b.owner_id = auth.uid()))');

-- message_templates
SELECT private.ensure_policy('template_business_select','message_templates',
  'FOR SELECT USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = message_templates.business_id AND b.owner_id = auth.uid()))');
SELECT private.ensure_policy('template_business_all','message_templates',
  'FOR ALL USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = message_templates.business_id AND b.owner_id = auth.uid()))');

-- review_requests
SELECT private.ensure_policy('request_business_select','review_requests',
  'FOR SELECT USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = review_requests.business_id AND b.owner_id = auth.uid()))');
SELECT private.ensure_policy('request_business_insert','review_requests',
  'FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM businesses b WHERE b.id = review_requests.business_id AND b.owner_id = auth.uid()))');
SELECT private.ensure_policy('request_business_update','review_requests',
  'FOR UPDATE USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = review_requests.business_id AND b.owner_id = auth.uid()))');
SELECT private.ensure_policy('request_business_delete','review_requests',
  'FOR DELETE USING (EXISTS (SELECT 1 FROM businesses b WHERE b.id = review_requests.business_id AND b.owner_id = auth.uid()))');

-- click_events
SELECT private.ensure_policy('click_business_select','click_events',
  'FOR SELECT USING (EXISTS (SELECT 1 FROM review_requests r JOIN businesses b ON b.id = r.business_id AND b.owner_id = auth.uid() WHERE r.id = click_events.request_id))');
SELECT private.ensure_policy('click_business_insert','click_events',
  'FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM review_requests r JOIN businesses b ON b.id = r.business_id AND b.owner_id = auth.uid() WHERE r.id = click_events.request_id))');

DROP FUNCTION IF EXISTS private.ensure_policy;

-- Drop any leftover permissive policies from the older build (USING (true) on public tables)
DROP POLICY IF EXISTS "Public can read clicked requests" ON review_requests;
DROP POLICY IF EXISTS "Public can read businesses for links" ON businesses;
DROP POLICY IF EXISTS "Public can read customers for links" ON customers;
DROP POLICY IF EXISTS "Public can update clicks" ON review_requests;
DROP POLICY IF EXISTS "Public can update unsubscribe" ON customers;

-- ===========================================================================
-- Indexes (IF NOT EXISTS)
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_customers_business_email  ON customers (business_id, email);
CREATE INDEX IF NOT EXISTS idx_requests_business_status ON review_requests (business_id, status, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_short_code      ON review_requests (short_code);
CREATE INDEX IF NOT EXISTS idx_requests_unreminded      ON review_requests (business_id, sent_at)
  WHERE reminder_sent_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_requests_claimed         ON review_requests (reminder_claimed_at)
  WHERE reminder_claimed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_billing_subscription ON businesses (billing_subscription_id)
  WHERE billing_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_billing_customer     ON businesses (billing_customer_id)
  WHERE billing_customer_id IS NOT NULL;
