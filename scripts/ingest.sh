#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f ".env.local" ]]; then
  echo "Missing .env.local. Create one with ADMIN_INGEST_SECRET and IRACING_CUST_ID." >&2
  exit 1
fi

set -a
source .env.local
set +a

if [[ -z "${ADMIN_INGEST_SECRET:-}" ]]; then
  echo "ADMIN_INGEST_SECRET is not set in .env.local." >&2
  exit 1
fi

if [[ -z "${IRACING_CUST_ID:-}" ]]; then
  echo "IRACING_CUST_ID is not set in .env.local." >&2
  exit 1
fi

echo "Ingesting schedule..."
curl -sS -X POST "http://127.0.0.1:3000/api/admin/ingest/schedule" \
  -H "x-ingest-secret: ${ADMIN_INGEST_SECRET}"
echo

echo "Ingesting member (custId=${IRACING_CUST_ID})..."
curl -sS -X POST "http://127.0.0.1:3000/api/admin/ingest/member?custId=${IRACING_CUST_ID}" \
  -H "x-ingest-secret: ${ADMIN_INGEST_SECRET}"
echo

echo "Ingesting member stats (custId=${IRACING_CUST_ID})..."
curl -sS -X POST "http://127.0.0.1:3000/api/admin/ingest/member-stats?custId=${IRACING_CUST_ID}" \
  -H "x-ingest-secret: ${ADMIN_INGEST_SECRET}"
echo
