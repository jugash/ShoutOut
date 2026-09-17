#!/usr/bin/env bash
# Adds (or with --remove, deletes) ~6 months of demo shoutouts in the local cluster.
set -euo pipefail
NAMESPACE="${NAMESPACE:-shoutout}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
psql() { kubectl -n "$NAMESPACE" exec -i shoutout-postgres-0 -- psql -q -v ON_ERROR_STOP=1 -U shoutout -d shoutout "$@"; }

psql -c "DELETE FROM shoutouts WHERE id LIKE 'demo\_%'"
if [[ "${1:-}" == "--remove" ]]; then
  echo "Demo data removed."
  exit 0
fi
node "$ROOT/deploy/local/seed-demo.mjs" | psql
psql -tAc "SELECT COUNT(*) || ' demo shoutouts' FROM shoutouts WHERE id LIKE 'demo\_%'"
