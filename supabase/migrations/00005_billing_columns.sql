-- Migration 00005: Billing fields
--
-- Adds columns required to sync subscription state from the billing
-- provider (Polar). All new columns are nullable so existing rows are
-- unaffected; defaults will be backfilled by the webhook handler as
-- customers upgrade/downgrade.
--
-- `plan` already exists from 00001_initial_schema and stays as the
-- source-of-truth enum used by quota enforcement. Billing metadata
-- (customer/subscription IDs and period end) is stored alongside for
-- support/debugging and for customer-portal link generation.

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS billing_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_provider TEXT DEFAULT 'polar',
  ADD COLUMN IF NOT EXISTS subscription_status TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Fast lookup by subscription/customer when webhooks arrive.
CREATE INDEX IF NOT EXISTS idx_businesses_billing_subscription
  ON businesses (billing_subscription_id)
  WHERE billing_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_billing_customer
  ON businesses (billing_customer_id)
  WHERE billing_customer_id IS NOT NULL;
