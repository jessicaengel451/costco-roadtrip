#!/usr/bin/env bash
# Emits web/src/aws-config.json from terraform outputs.
# Usage: ./scripts/emit-aws-config.sh
set -euo pipefail

cd "$(dirname "$0")/.."

OUT=$(cd infra && terraform output -json)

cat > web/src/aws-config.json <<EOF
{
  "region": $(echo "$OUT" | jq '.region.value'),
  "userPoolId": $(echo "$OUT" | jq '.user_pool_id.value'),
  "userPoolClientId": $(echo "$OUT" | jq '.user_pool_client_id.value'),
  "hostedUiDomain": $(echo "$OUT" | jq '.hosted_ui_domain.value'),
  "apiUrl": $(echo "$OUT" | jq '.api_url.value')
}
EOF

echo "wrote web/src/aws-config.json"
