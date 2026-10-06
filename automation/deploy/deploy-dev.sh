#!/usr/bin/env bash
# Build the runner image and (re)deploy the two Cloud Run Jobs + schedules.
#
#   agentform-plan   nightly, read-only identity  → writes a run awaiting approval
#   agentform-apply  every 15 min, write identity → applies runs you approved
#
# Usage (run from the automation/ directory, after setup-dev.sh):
#   PROJECT=finance-agent-dev REGION=asia-southeast1 \
#   AGENTFORM_SUBJECT=finance-test@yourdomain.com \
#   AGENTFORM_CALENDAR_ID=xxxx@group.calendar.google.com \
#   SUPABASE_URL=https://xxxx.supabase.co \
#   AGENTFORM_OWNER_USER_ID=<your Supabase auth user id> \
#   ./deploy/deploy-dev.sh

set -euo pipefail

: "${PROJECT:?set PROJECT}"
: "${REGION:=asia-southeast1}"
: "${AGENTFORM_SUBJECT:?set AGENTFORM_SUBJECT (the one mailbox the jobs act as)}"
: "${AGENTFORM_CALENDAR_ID:?set AGENTFORM_CALENDAR_ID}"
: "${SUPABASE_URL:?set SUPABASE_URL}"
: "${AGENTFORM_OWNER_USER_ID:?set AGENTFORM_OWNER_USER_ID}"
: "${TIMEZONE:=Asia/Manila}"

sa_email() { echo "$1@$PROJECT.iam.gserviceaccount.com"; }

if [[ ! -f spec/finance.yaml ]]; then
  echo "spec/finance.yaml not found — copy spec/finance.example.yaml and fill in your bills first." >&2
  exit 1
fi

REPO="$REGION-docker.pkg.dev/$PROJECT/agentform"
IMAGE="$REPO/runner:$(date +%Y%m%d-%H%M%S)"

gcloud artifacts repositories describe agentform --location="$REGION" --project="$PROJECT" >/dev/null 2>&1 ||
  gcloud artifacts repositories create agentform --repository-format=docker --location="$REGION" --project="$PROJECT"

echo "== Building $IMAGE"
gcloud builds submit --project="$PROJECT" --tag="$IMAGE" .

COMMON_ENV="AGENTFORM_PROVIDER=google,AGENTFORM_STORE=supabase,AGENTFORM_SPEC=/app/spec/finance.yaml"
COMMON_ENV+=",AGENTFORM_SUBJECT=$AGENTFORM_SUBJECT,AGENTFORM_CALENDAR_ID=$AGENTFORM_CALENDAR_ID"
COMMON_ENV+=",SUPABASE_URL=$SUPABASE_URL,AGENTFORM_OWNER_USER_ID=$AGENTFORM_OWNER_USER_ID"

echo "== Plan job (read-only delegation)"
gcloud run jobs deploy agentform-plan --project="$PROJECT" --region="$REGION" --image="$IMAGE" \
  --service-account="$(sa_email agentform-runner-plan)" \
  --args=plan,--observe --max-retries=0 --task-timeout=15m \
  --set-env-vars="$COMMON_ENV,AGENTFORM_DWD_SA=$(sa_email agentform-dwd-plan)" \
  --set-secrets="ANTHROPIC_API_KEY=agentform-anthropic-key:latest,SUPABASE_SERVICE_ROLE_KEY=agentform-supabase-service-key:latest"

echo "== Apply job (write delegation, no Anthropic key — no model runs at apply time)"
gcloud run jobs deploy agentform-apply --project="$PROJECT" --region="$REGION" --image="$IMAGE" \
  --service-account="$(sa_email agentform-runner-apply)" \
  --args=apply,--approved --max-retries=0 --task-timeout=10m \
  --set-env-vars="$COMMON_ENV,AGENTFORM_DWD_SA=$(sa_email agentform-dwd-apply)" \
  --set-secrets="SUPABASE_SERVICE_ROLE_KEY=agentform-supabase-service-key:latest"

SCHED_SA="$(sa_email agentform-scheduler)"
for job in agentform-plan agentform-apply; do
  gcloud run jobs add-iam-policy-binding "$job" --project="$PROJECT" --region="$REGION" \
    --member="serviceAccount:$SCHED_SA" --role=roles/run.invoker >/dev/null
done

schedule() {
  local name=$1 cron=$2 job=$3
  local uri="https://run.googleapis.com/v2/projects/$PROJECT/locations/$REGION/jobs/$job:run"
  local verb=create
  gcloud scheduler jobs describe "$name" --project="$PROJECT" --location="$REGION" >/dev/null 2>&1 && verb=update
  gcloud scheduler jobs "$verb" http "$name" --project="$PROJECT" --location="$REGION" \
    --schedule="$cron" --time-zone="$TIMEZONE" --uri="$uri" --http-method=POST \
    --oauth-service-account-email="$SCHED_SA"
}

echo "== Schedules"
schedule agentform-plan-nightly  "17 6 * * *"   agentform-plan
schedule agentform-apply-poll    "*/15 * * * *" agentform-apply

cat <<EOF

Deployed. Try it now instead of waiting for the schedule:
  gcloud run jobs execute agentform-plan --region=$REGION --project=$PROJECT --wait
Then open the app → Settings → Automations to review and approve.
EOF
