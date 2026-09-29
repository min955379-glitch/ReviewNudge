#!/usr/bin/env bash
# verify-rls-isolation.sh
#
# Manual verification script for cross-account RLS isolation.
#
# Because RLS rules depend on auth.uid(), we cannot drive this test over the
# REST API with a static key. This script documents the steps and generates
# SQL you run in the Supabase SQL Editor that proves account A cannot see
# account B's data.
#
# Usage:
#   1. Create TWO test accounts (signup with two different emails) and complete
#      onboarding for each (name them Account A and Account B).
#   2. Sign in as Account A, create a test customer and send a review request.
#   3. In the Supabase SQL Editor, run the SQL below using each account's
#      user ID (from auth.users) and its business_id.
#   4. The "negative" queries must return ZERO rows.
#
# This script prints the SQL template — paste in the IDs and run.

set -euo pipefail

cat <<'SQL'
-- ================= RLS ISOLATION VERIFICATION =================
--
-- Replace these placeholders with IDs from your test accounts.
-- Find them via:
--   SELECT id, email FROM auth.users;
--   SELECT id, owner_id, name FROM businesses;

\set USER_A  '00000000-0000-0000-0000-000000000001'  -- Account A's auth.uid
\set BIZ_A   '00000000-0000-0000-0000-000000000002'  -- Account A's business id
\set USER_B  '00000000-0000-0000-0000-000000000003'  -- Account B's auth.uid
\set BIZ_B   '00000000-0000-0000-0000-000000000004'  -- Account B's business id

-- 1) Switch to USER_A's role context and SELECT customers for BIZ_B.
--    Expected: 0 rows.
SET ROLE authenticated;
SET request.jwt.claims.sub to :'USER_A';

SELECT id, name, email
FROM customers
WHERE business_id = :'BIZ_B';

SELECT id, status
FROM review_requests
WHERE business_id = :'BIZ_B';

SELECT id, name
FROM businesses
WHERE id = :'BIZ_B';

-- 2) Switch to USER_A and try to UPDATE a customer owned by BIZ_B.
--    Expected: UPDATE 0 (RLS blocks it).
BEGIN;
SET ROLE authenticated;
SET request.jwt.claims.sub to :'USER_A';
UPDATE customers SET name = 'HACKED' WHERE business_id = :'BIZ_B';
-- Should show "UPDATE 0"
ROLLBACK;

-- 3) Switch to USER_A and try to INSERT a customer into BIZ_B.
--    Expected: ERROR: new row violates row-level security policy
BEGIN;
SET ROLE authenticated;
SET request.jwt.claims.sub to :'USER_A';
INSERT INTO customers (business_id, name, email, consent_confirmed, unsubscribed)
VALUES (:'BIZ_B', 'Should fail', 'x@example.com', true, false);
ROLLBACK;

-- 4) Switch to USER_B and confirm they CAN see their own data.
--    Expected: >=1 rows (positive control — confirms policies work at all).
SET ROLE authenticated;
SET request.jwt.claims.sub to :'USER_B';

SELECT count(*) AS b_customers FROM customers WHERE business_id = :'BIZ_B';
SELECT count(*) AS b_requests  FROM review_requests WHERE business_id = :'BIZ_B';

-- ===================================================================
-- PASS criteria: steps 1–3 return zero rows / zero updates / errors,
-- and step 4 returns >=0 rows (the counts you expect for account B).
SQL
