"""agentform CLI.

    python -m agentform plan [--observe]      refresh, diff, save a run awaiting approval
    python -m agentform list                  recent runs
    python -m agentform show RUN_ID           a run's plan and results
    python -m agentform approve RUN_ID        approve that exact plan (local dev)
    python -m agentform reject RUN_ID
    python -m agentform apply RUN_ID          apply one approved run
    python -m agentform apply --approved      apply every approved run (what the scheduler runs)
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from .apply import ApprovalError, apply_plan
from .plan import compute_plan
from .runs import store_from_env, new_run
from .spec import load_spec

HERE = Path(__file__).resolve().parent.parent  # automation/


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="agentform", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("plan", help="diff the spec against the calendar and save a run")
    p.add_argument("--spec", type=Path, default=None)
    p.add_argument("--observe", action="store_true", help="also check bill emails with the read-only agent")

    sub.add_parser("list", help="list recent runs")
    s = sub.add_parser("show", help="show one run")
    s.add_argument("run_id")
    a = sub.add_parser("approve", help="approve a planned run")
    a.add_argument("run_id")
    a.add_argument("--yes", action="store_true", help="skip the confirmation prompt")
    r = sub.add_parser("reject", help="reject a planned run")
    r.add_argument("run_id")
    ap = sub.add_parser("apply", help="apply approved runs")
    group = ap.add_mutually_exclusive_group(required=True)
    group.add_argument("run_id", nargs="?")
    group.add_argument("--approved", action="store_true", help="apply every approved run, oldest first")

    args = parser.parse_args(argv)
    data_dir = Path(os.environ.get("AGENTFORM_DATA_DIR") or HERE / ".agentform")
    store = store_from_env(data_dir)

    if args.command == "plan":
        return cmd_plan(args, store, data_dir)
    if args.command == "list":
        for run in store.list():
            s = run["plan"]["summary"]
            print(f"{run['id']}  {run['status']:<17} +{s['create']} ~{s['update']} -{s['delete']}  !{s['advisories']}")
        return 0
    if args.command == "show":
        run = _get(store, args.run_id)
        print_run(run)
        return 0
    if args.command == "approve":
        return cmd_approve(args, store)
    if args.command == "reject":
        run = _get(store, args.run_id)
        if run["status"] != "planned":
            print(f"run is {run['status']}, not planned", file=sys.stderr)
            return 1
        store.update(run["id"], {"status": "rejected"})
        print(f"rejected {run['id']}")
        return 0
    if args.command == "apply":
        return cmd_apply(args, store, data_dir)
    return 2


def cmd_plan(args, store, data_dir: Path) -> int:
    spec_path = args.spec or Path(os.environ.get("AGENTFORM_SPEC") or _default_spec())
    spec = load_spec(spec_path)
    provider = make_provider("plan", data_dir)

    advisories: list[dict] = []
    warnings: list[str] = []
    if args.observe:
        advisories, warnings = run_observer(spec)

    plan = compute_plan(spec, provider.list_managed(), advisories)
    plan["warnings"] = warnings
    run = new_run(plan)
    store.save(run)
    print_run(run)
    if run["status"] == "planned":
        print(f"\nApprove in the app (Settings → Automations) or: python -m agentform approve {run['id']}")
    return 0


def cmd_approve(args, store) -> int:
    run = _get(store, args.run_id)
    if run["status"] != "planned":
        print(f"run is {run['status']}, not planned", file=sys.stderr)
        return 1
    print_run(run)
    if not args.yes and input("\nApprove this plan? Type 'yes': ").strip() != "yes":
        print("not approved")
        return 1
    store.update(
        run["id"],
        {
            "status": "approved",
            "approved_plan_hash": run["plan_hash"],
            "approved_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        },
    )
    print(f"approved {run['id']} (plan {run['plan_hash'][:12]})")
    return 0


def cmd_apply(args, store, data_dir: Path) -> int:
    if args.approved:
        ids = [r["id"] for r in sorted(store.list(status="approved"), key=lambda r: r["created_at"])]
    else:
        ids = [args.run_id]
    if not ids:
        print("nothing approved to apply")
        return 0

    provider = make_provider("apply", data_dir)
    exit_code = 0
    for run_id in ids:
        run = store.claim_for_apply(run_id)
        if run is None:
            print(f"{run_id}: not approved (or already being applied) — skipped", file=sys.stderr)
            exit_code = 1
            continue
        try:
            result = apply_plan(run["plan"], run.get("approved_plan_hash"), provider)
            store.update(
                run_id,
                {
                    "status": result["status"],
                    "results": result,
                    "applied_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                },
            )
            print(f"{run_id}: {result['status']}")
            for step in result["steps"]:
                print(f"  {step['status']:<6} {step['step_id']}  {step.get('detail', '')}")
            if result["status"] != "applied":
                exit_code = 1
        except ApprovalError as e:
            store.update(run_id, {"status": "failed", "error": str(e)})
            print(f"{run_id}: {e}", file=sys.stderr)
            exit_code = 1
        except Exception as e:
            store.update(run_id, {"status": "failed", "error": f"{type(e).__name__}: {e}"[:500]})
            raise
    return exit_code


def make_provider(phase: str, data_dir: Path):
    kind = os.environ.get("AGENTFORM_PROVIDER", "fake")
    if kind == "fake":
        from .providers.fake import FakeCalendar

        return FakeCalendar(data_dir / "fake_calendar.json")
    if kind == "google":
        from .google_auth import SCOPES_APPLY, SCOPES_PLAN, ConfigError, delegated_credentials
        from .providers.google_calendar import GoogleCalendar

        calendar_id = os.environ.get("AGENTFORM_CALENDAR_ID")
        if not calendar_id:
            raise ConfigError("AGENTFORM_CALENDAR_ID is not set")
        scopes = SCOPES_PLAN if phase == "plan" else SCOPES_APPLY
        return GoogleCalendar(calendar_id, delegated_credentials(scopes))
    raise SystemExit(f"unknown AGENTFORM_PROVIDER {kind!r} (use fake or google)")


def run_observer(spec):
    if os.environ.get("AGENTFORM_PROVIDER", "fake") != "google":
        return [], ["observer skipped: it reads Gmail, so it needs AGENTFORM_PROVIDER=google"]
    from googleapiclient.discovery import build

    from .google_auth import SCOPES_PLAN, delegated_credentials
    from .observe import GmailReader, compute_advisories, observe

    gmail = build("gmail", "v1", credentials=delegated_credentials(SCOPES_PLAN), cache_discovery=False)
    reader = GmailReader(gmail, {r.id: r.gmail_query for r in spec.resources if r.gmail_query})
    observations, warnings = observe(spec, reader)
    return compute_advisories(spec, observations), warnings


def print_run(run: dict) -> None:
    plan = run["plan"]
    print(f"Run {run['id']} — {run['status']} — plan {run['plan_hash'][:12]}")
    if not plan["steps"]:
        print("  No changes. The calendar matches the spec.")
    symbols = {"create": "+", "update": "~", "delete": "-"}
    for step in plan["steps"]:
        print(f"  {symbols[step['action']]} {step['action']:<6} {step['resource_id']}" + (f"  ({step['reason']})" if step.get("reason") else ""))
        for change in step["changes"]:
            if step["action"] == "update":
                print(f"      {change['field']}: {_short(change['from'])} → {_short(change['to'])}")
            elif step["action"] == "create" and change["field"] == "summary":
                print(f"      {_short(change['to'])}  (first: {step['start_date']})")
    for adv in plan.get("advisories", []):
        what = "amount" if adv["kind"] == "amount_differs" else "due day"
        print(f"  ! {adv['resource_id']}: latest statement {what} is {adv['observed_value']}, spec says {adv['spec_value']} ({adv['confidence']} confidence)")
    for warning in plan.get("warnings", []):
        print(f"  · {warning}")
    if run.get("results"):
        for step in run["results"]["steps"]:
            print(f"  [{step['status']}] {step['step_id']} {step.get('detail', '')}")
    if run.get("error"):
        print(f"  error: {run['error']}")


def _short(value) -> str:
    text = value if isinstance(value, str) else str(value)
    return text if len(text) <= 70 else text[:67] + "…"


def _get(store, run_id: str) -> dict:
    run = store.get(run_id)
    if run is None:
        raise SystemExit(f"no run {run_id}")
    return run


def _default_spec() -> Path:
    own = HERE / "spec" / "finance.yaml"
    return own if own.exists() else HERE / "spec" / "finance.example.yaml"


if __name__ == "__main__":
    sys.exit(main())
