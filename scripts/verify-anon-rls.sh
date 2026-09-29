#!/usr/bin/env bash
# verify-anon-rls.sh
#
# Confirms the anonymous Supabase role CANNOT read from businesses,
# customers, or review_requests. Passes only when RLS is correctly
# blocking anon access (i.e. the service-role-only approach is in place
# and migration 00002 did not add permissive policies).
#
# Required env vars (or a .env.local in the project root):
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#
# Exit code 0 = anon returned 0 rows on all three tables (good).
# Exit code 1 = anon was able to read rows (RLS misconfigured).

set -euo pipefail
ENV_FILE=".env.local"
if [ -f "$ENV_FILE" ]; then
  set -a; . "./$ENV_FILE"; set +a
fi

if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ] || [ -z "${NEXT_PUBLIC_SUPABASE_ANON_KEY:-}" ]; then
  echo "SKIP: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set."
  echo "Set them in .env.local or the environment to run the RLS test."
  exit 0
fi

fetch_count() {
  local table="$1"
  local body
  body=$(curl -sS "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=id&limit=1" \
    -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}")
  local code=$?
  # First, detect HTTP status via a separate tight call (curl -w on the same
  # stream above interleaves with -o; we use the body heuristic plus an -I
  # probe to confirm unauthorized vs empty). 401/403 = blocked. 200 + body=[] =
  # RLS is on and returns no rows (also acceptable).
  local status
  status=$(curl -sS -o /dev/null -w "%{http_code}" \
    "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=id&limit=1" \
    -H "apikey: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${NEXT_PUBLIC_SUPABASE_ANON_KEY}")
  if [ "$code" -ne 0 ]; then echo "ERROR"; return 1; fi
  if echo "$status" | grep -Eq "^40[13]$"; then echo "BLOCKED"; return 0; fi
  if [ "$status" = "200" ] && [ "$body" = "[]" ]; then echo "EMPTY"; return 0; fi
  echo "LEAK(http=$status body=$body)"
  return 1
}

rc=0
echo "Anon RLS test (expecting BLOCKED or []):"
for t in businesses customers review_requests; do
  result=$(fetch_count "$t") || rc=1
  echo "  $t -> $result"
done
if [ $rc -eq 0 ]; then
  echo "PASS: anon role has no read access to businesses/customers/review_requests."
else
  echo "FAIL: anon role is able to read one or more tables — check RLS policies."
fi
exit $rc
