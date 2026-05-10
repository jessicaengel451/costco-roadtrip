# Setup & deployment

This refactor splits the project into:

- `web/` — Vite + React 18 + TypeScript app (Path B: `@aws-amplify/ui-react` for auth, `aws-amplify` for the underlying client)
- `infra/` — Terraform that owns Cognito, DynamoDB, Lambda, API Gateway, and Amplify Hosting
- `infra/lambdas/` — Node 20 TS Lambda handlers, bundled by esbuild
- `scripts/` — one-off build helpers (locations data pipeline, aws-config emit)

## Secret reference (TL;DR)

What you need to put in **GitHub repo Settings → Secrets and variables → Actions**:

| Secret | What it is | Where it comes from |
|---|---|---|
| `AWS_ROLE_ARN` | OIDC role ARN that GitHub Actions assumes for AWS access. | Created in AWS IAM (step 1 below). Format: `arn:aws:iam::ACCOUNT:role/<role-name>`. |
| `TF_VAR_GOOGLE_CLIENT_ID` | Google OAuth client ID for Cognito's Google IdP. | Google Cloud Console (step 2). |
| `TF_VAR_GOOGLE_CLIENT_SECRET` | Matching OAuth client secret. | Google Cloud Console (step 2). |
| `TF_VAR_GITHUB_REPO` | Public repo URL for Amplify Hosting to clone. e.g. `https://github.com/jessicaengel451/costco-roadtrip`. | Your GitHub repo URL. |
| `TF_VAR_GITHUB_OAUTH_TOKEN` | Personal access token Amplify Hosting uses to pull the repo. | GitHub → Developer settings → PAT (classic) with `repo` scope (step 3). |
| `AWS_CONFIG_JSON` | Frontend auth/api config. Written to `web/src/aws-config.json` in CI before `npm run build` and Playwright. | After first `terraform apply`, download the `aws-config-json` artifact from the deploy-dev workflow run and paste its contents here. (This mirrors swimcoach's `AMPLIFY_OUTPUTS_JSON` pattern.) |

You'll also create a **GitHub Environment** named `dev` (Settings → Environments) so the deploy job has a soft gate. Add a `prod` environment with required reviewers when you're ready for prod.

What does **NOT** need to be a secret: the AWS account ID (it's in `AWS_ROLE_ARN` already), the Cognito user pool ID, the API URL — those are all derivable from `AWS_CONFIG_JSON`.

## One-time bootstrap

### 1. AWS account + OIDC role

GitHub Actions assumes an IAM role via OIDC — no long-lived AWS keys.

1. In AWS, create an OIDC identity provider for `https://token.actions.githubusercontent.com` (audience: `sts.amazonaws.com`).
2. Create an IAM role with a trust policy that lets your GitHub repo's main branch and PR runs assume it. Example:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": { "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com" },
       "Action": "sts:AssumeRoleWithWebIdentity",
       "Condition": {
         "StringEquals": { "token.actions.githubusercontent.com:aud": "sts.amazonaws.com" },
         "StringLike": { "token.actions.githubusercontent.com:sub": "repo:OWNER/costco-roadtrip:*" }
       }
     }]
   }
   ```
3. Attach a permissions policy broad enough to manage the resources Terraform creates (Cognito, DynamoDB, Lambda, API Gateway, IAM, S3 for state, Amplify). Tighten over time.
4. Save the role ARN as the GitHub Actions secret `AWS_ROLE_ARN`.

### 2. Google OAuth client (for Cognito Google IdP)

1. Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application).
2. Authorized redirect URIs: `https://<cognito-domain>.auth.us-east-1.amazoncognito.com/oauth2/idpresponse` — fill in after first apply.
3. Save client id + secret as GitHub Actions secrets:
   - `TF_VAR_GOOGLE_CLIENT_ID`
   - `TF_VAR_GOOGLE_CLIENT_SECRET`

### 3. GitHub OAuth token (for Amplify Hosting)

Personal access token with `repo` scope — Amplify Hosting needs it to clone the repo on builds.

- Save as `TF_VAR_GITHUB_OAUTH_TOKEN`.
- Save the repo URL as `TF_VAR_GITHUB_REPO` (e.g. `https://github.com/jessicaengel/costco-roadtrip`).

### 3a. AWS_CONFIG_JSON (after first apply)

The frontend imports `web/src/aws-config.json` (region, user pool id, client id, hosted UI domain, API URL). It's gitignored. The flow:

1. **First deploy** runs `terraform apply` and emits `aws-config.json` as a workflow artifact (`aws-config-json`).
2. **Download that artifact**, copy its JSON contents, and paste into a new GitHub Actions secret named `AWS_CONFIG_JSON`.
3. **From then on**, every PR's `web` and `playwright` job writes that secret to `web/src/aws-config.json` before building. PR builds use the same auth/api config as production.

If the secret isn't set yet (very first PR before deploy), CI falls back to the placeholder values in `web/src/aws-config.example.json` — the build still passes, but the resulting bundle won't authenticate against a real Cognito.

When you re-run terraform and it changes any output (e.g. you bound a custom domain), repeat step 2 to refresh the secret.

### 4. Remote Terraform state (optional but recommended)

`infra/backend.tf` is currently commented out — state lives locally. To share state across machines and CI, create an S3 bucket + DynamoDB lock table in your account, uncomment the backend block, edit the bucket/table names, and run `terraform init -migrate-state`.

## Local development

```bash
# Frontend
cd web
npm install
npm run dev          # localhost:5173 (or next free port)

# Run unit tests (bail at 15 failures)
npm test

# Run E2E tests (mocked, hermetic)
npx playwright install chromium
npm run test:e2e
```

For the auth + API to work locally, you need a deployed dev stack — `web/src/aws-config.json` is a placeholder until then.

```bash
# Build lambda bundles (Terraform reads the .zip files)
cd infra/lambdas
npm install
node build.mjs

# Apply infra
cd ../
terraform init
terraform apply -var-file=envs/dev.tfvars
# (provide TF_VAR_google_client_id, TF_VAR_google_client_secret, etc. via env)

# Emit aws-config.json from outputs
cd ..
./scripts/emit-aws-config.sh
```

## CI/CD

Workflow: `.github/workflows/ci.yml`

On PR:
- `web` job: typecheck, vitest, build
- `lambdas` job: typecheck, vitest, esbuild bundle (uploaded as artifact)
- `playwright` job: hermetic E2E (MSW-mocked)
- `terraform-plan` job: fmt check, validate, plan, comment on PR

On `main` (push):
- All of the above
- `deploy-dev` job (gated on `dev` GitHub Environment): `terraform apply` to dev account

A prod deploy job can be added later that gates on a `prod` GitHub Environment with manual approval.

## Cutover from the old static site

1. Wait for the new site to be deployed and verified.
2. (Optional) Run `scripts/migrate-firebase.ts` to export visits from Firestore and bulk-import into DynamoDB. Users will need to re-link with their Cognito identity afterward, so the script keys data by email and the Lambda performs a one-time merge on first sign-in.
3. Update the `CNAME` file (or DNS record) to point at the Amplify Hosting domain (or a custom domain bound to it).
4. Archive the legacy Firebase project.
5. Move the legacy files (`index.html`, the `costco_*.csv`, the data prep scripts) into a `legacy/` directory or delete them.
