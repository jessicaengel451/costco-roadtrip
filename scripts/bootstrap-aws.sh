#!/usr/bin/env bash
# Bootstraps the one-time AWS resources Terraform expects to find:
#   - GitHub Actions OIDC identity provider
#   - IAM role for GitHub Actions to assume (printed at end → save as AWS_ROLE_ARN secret)
#   - (optional) S3 bucket for terraform remote state (locking via S3-native
#     use_lockfile — no DynamoDB needed)
#
# Run this ONCE per AWS account, with credentials that have IAM admin.
#
# Usage:
#   GITHUB_OWNER=jessicaengel451 GITHUB_REPO=costco-roadtrip ./scripts/bootstrap-aws.sh
#
# Optional env vars:
#   AWS_REGION           default us-east-1
#   ROLE_NAME            default costco-roadtrip-gha
#   PROVIDER_THUMBPRINT  default GitHub's public thumbprint (Feb 2024+)
#   STATE_BUCKET         default costco-roadtrip-tfstate-<account>
#   LOCK_TABLE           default costco-roadtrip-tflock
#   SKIP_REMOTE_STATE=1  to skip S3+DDB creation
set -euo pipefail

: "${GITHUB_OWNER:?Set GITHUB_OWNER (e.g. jessicaengel451)}"
: "${GITHUB_REPO:?Set GITHUB_REPO (e.g. costco-roadtrip)}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ROLE_NAME="${ROLE_NAME:-costco-roadtrip-gha}"
PROVIDER_URL="token.actions.githubusercontent.com"
PROVIDER_THUMBPRINT="${PROVIDER_THUMBPRINT:-6938fd4d98bab03faadb97b34396831e3780aea1}"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "→ AWS account: $ACCOUNT_ID, region: $AWS_REGION"

# ───────────────────────────────────────────────────────── 1. OIDC provider
PROVIDER_ARN="arn:aws:iam::${ACCOUNT_ID}:oidc-provider/${PROVIDER_URL}"

if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "$PROVIDER_ARN" >/dev/null 2>&1; then
  echo "✓ OIDC provider already exists: $PROVIDER_ARN"
else
  echo "→ Creating OIDC provider for GitHub Actions"
  aws iam create-open-id-connect-provider \
    --url "https://${PROVIDER_URL}" \
    --client-id-list "sts.amazonaws.com" \
    --thumbprint-list "$PROVIDER_THUMBPRINT" \
    >/dev/null
  echo "✓ Created: $PROVIDER_ARN"
fi

# ───────────────────────────────────────────────────────── 2. IAM role
TRUST_POLICY=$(cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Federated": "${PROVIDER_ARN}" },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": { "${PROVIDER_URL}:aud": "sts.amazonaws.com" },
      "StringLike":   { "${PROVIDER_URL}:sub": "repo:${GITHUB_OWNER}/${GITHUB_REPO}:*" }
    }
  }]
}
JSON
)

if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
  echo "✓ Role already exists: $ROLE_NAME (updating trust policy)"
  aws iam update-assume-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-document "$TRUST_POLICY"
else
  echo "→ Creating role $ROLE_NAME"
  aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "GitHub Actions OIDC role for ${GITHUB_OWNER}/${GITHUB_REPO}" \
    >/dev/null
fi

# Permissions: broad enough for what Terraform manages. Tighten later if you
# want least-privilege.
PERMS_POLICY=$(cat <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:*",
        "dynamodb:*",
        "lambda:*",
        "apigateway:*",
        "iam:GetRole", "iam:CreateRole", "iam:DeleteRole", "iam:PassRole",
        "iam:AttachRolePolicy", "iam:DetachRolePolicy",
        "iam:PutRolePolicy", "iam:DeleteRolePolicy", "iam:GetRolePolicy",
        "iam:ListAttachedRolePolicies", "iam:ListRolePolicies",
        "iam:TagRole", "iam:UntagRole", "iam:ListInstanceProfilesForRole",
        "amplify:*",
        "logs:*",
        "s3:*",
        "cloudfront:*",
        "tag:*"
      ],
      "Resource": "*"
    }
  ]
}
JSON
)

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "${ROLE_NAME}-perms" \
  --policy-document "$PERMS_POLICY"
echo "✓ Permissions policy attached to $ROLE_NAME"

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

# ───────────────────────────────────────────────────────── 3. Remote state (optional)
if [[ "${SKIP_REMOTE_STATE:-0}" != "1" ]]; then
  STATE_BUCKET="${STATE_BUCKET:-costco-roadtrip-tfstate-${ACCOUNT_ID}}"
  LOCK_TABLE="${LOCK_TABLE:-costco-roadtrip-tflock}"

  if aws s3api head-bucket --bucket "$STATE_BUCKET" >/dev/null 2>&1; then
    echo "✓ State bucket exists: $STATE_BUCKET"
  else
    echo "→ Creating state bucket: $STATE_BUCKET"
    if [[ "$AWS_REGION" == "us-east-1" ]]; then
      aws s3api create-bucket --bucket "$STATE_BUCKET" --region "$AWS_REGION" >/dev/null
    else
      aws s3api create-bucket --bucket "$STATE_BUCKET" --region "$AWS_REGION" \
        --create-bucket-configuration "LocationConstraint=$AWS_REGION" >/dev/null
    fi
    aws s3api put-bucket-versioning --bucket "$STATE_BUCKET" \
      --versioning-configuration Status=Enabled
    aws s3api put-bucket-encryption --bucket "$STATE_BUCKET" \
      --server-side-encryption-configuration \
      '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
    aws s3api put-public-access-block --bucket "$STATE_BUCKET" \
      --public-access-block-configuration \
      "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    echo "✓ Versioning + SSE + public-access block on $STATE_BUCKET"
  fi

  # NOTE: terraform's S3 backend now uses native locking via `use_lockfile`,
  # so we no longer create a DynamoDB lock table. If you have an old one
  # from a previous bootstrap, you can delete it manually.
fi

# ───────────────────────────────────────────────────────── 4. Summary
echo
echo "════════════════════════════════════════════════════════════"
echo "Done. Save this as a GitHub Actions secret named AWS_ROLE_ARN:"
echo
echo "  $ROLE_ARN"
echo
if [[ "${SKIP_REMOTE_STATE:-0}" != "1" ]]; then
  echo "Then point infra/backend.tf at this bucket:"
  echo "  bucket       = \"$STATE_BUCKET\""
  echo "  region       = \"$AWS_REGION\""
  echo "  use_lockfile = true"
  echo "and run: cd infra && terraform init -migrate-state"
fi
echo "════════════════════════════════════════════════════════════"
