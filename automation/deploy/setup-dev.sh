#!/usr/bin/env bash
# One-time identity setup for the agentform DEV project.
#
# Creates the four service accounts, lets each runner sign ONLY as its own
# delegation account (no key files anywhere), stores secrets, and prints the
# exact Client IDs + scopes a Workspace super admin pastes into
#   Admin console → Security → Access and data control → API controls
#   → Manage Domain Wide Delegation → Add new
#
# Usage:
#   PROJECT=finance-agent-dev REGION=asia-southeast1 \
#   DEV_USER=you@yourdomain.com ./deploy/setup-dev.sh
#
# DEV_USER (optional) is granted permission to sign as the delegation accounts
# so you can run the CLI from your laptop with `gcloud auth application-default login`.
# Leave it out for prod.

set -euo pipefail

: "${PROJECT:?set PROJECT}"
: "${REGION:=asia-southeast1}"

gcloud config set project "$PROJECT" >/dev/null

echo "== Enabling APIs"
gcloud services enable \
  gmail.googleapis.com calendar-json.googleapis.com iamcredentials.googleapis.com \
  run.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com \
  cloudbuild.googleapis.com artifactregistry.googleapis.com

sa_email() { echo "$1@$PROJECT.iam.gserviceaccount.com"; }

create_sa() {
  local name=$1 display=$2
  if ! gcloud iam service-accounts describe "$(sa_email "$name")" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$name" --display-name="$display"
  fi
}

echo "== Service accounts"
create_sa agentform-runner-plan  "agentform plan job (runtime identity)"
create_sa agentform-runner-apply "agentform apply job (runtime identity)"
create_sa agentform-dwd-plan     "agentform delegation: read-only scopes"
create_sa agentform-dwd-apply    "agentform delegation: calendar write"
create_sa agentform-scheduler    "Cloud Scheduler → runs agentform jobs"

allow_sign() {
  gcloud iam service-accounts add-iam-policy-binding "$(sa_email "$2")" \
    --member="$1" --role=roles/iam.serviceAccountTokenCreator >/dev/null
}

echo "== Each runner may sign only as its own delegation account"
allow_sign "serviceAccount:$(sa_email agentform-runner-plan)"  agentform-dwd-plan
allow_sign "serviceAccount:$(sa_email agentform-runner-apply)" agentform-dwd-apply

if [[ -n "${DEV_USER:-}" ]]; then
  echo "== Local development: $DEV_USER may sign as both delegation accounts (dev only)"
  allow_sign "user:$DEV_USER" agentform-dwd-plan
  allow_sign "user:$DEV_USER" agentform-dwd-apply
fi

echo "== Secrets (values are read from your terminal, not from arguments)"
put_secret() {
  local name=$1 prompt=$2 value
  if gcloud secrets describe "$name" >/dev/null 2>&1; then
    echo "   $name exists — skipping (add a version with: gcloud secrets versions add $name --data-file=-)"
    return
  fi
  read -r -s -p "   $prompt: " value; echo
  printf '%s' "$value" | gcloud secrets create "$name" --replication-policy=automatic --data-file=-
}
put_secret agentform-anthropic-key        "Anthropic API key"
put_secret agentform-supabase-service-key "Supabase service-role key"

grant_secret() {
  gcloud secrets add-iam-policy-binding "$1" \
    --member="serviceAccount:$(sa_email "$2")" --role=roles/secretmanager.secretAccessor >/dev/null
}
grant_secret agentform-anthropic-key        agentform-runner-plan
grant_secret agentform-supabase-service-key agentform-runner-plan
grant_secret agentform-supabase-service-key agentform-runner-apply

client_id() { gcloud iam service-accounts describe "$(sa_email "$1")" --format='value(oauth2ClientId)'; }

cat <<EOF

== Paste into the Workspace Admin console (super admin), one entry per row:

  Client ID: $(client_id agentform-dwd-plan)
  Scopes:    https://www.googleapis.com/auth/calendar.readonly,https://www.googleapis.com/auth/gmail.readonly

  Client ID: $(client_id agentform-dwd-apply)
  Scopes:    https://www.googleapis.com/auth/calendar.events

Neither entry includes gmail.send or any money-moving scope.

== For local CLI runs (after: gcloud auth application-default login):

  export AGENTFORM_PROVIDER=google
  export AGENTFORM_SUBJECT=finance-test@yourdomain.com        # dedicated test mailbox
  export AGENTFORM_CALENDAR_ID=<calendar id from Calendar → Settings → Integrate calendar>
  export AGENTFORM_DWD_SA=$(sa_email agentform-dwd-plan)   # use agentform-dwd-apply for 'apply'

Then deploy the jobs with ./deploy/deploy-dev.sh
EOF
