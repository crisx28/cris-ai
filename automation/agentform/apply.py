"""The executor: the only code path that writes to the calendar.

It runs exactly the steps of an approved plan and nothing else. Before each
step it re-reads the calendar and checks the target still looks the way it did
at plan time; anything that drifted in between is skipped as stale rather than
overwritten, the same way Terraform refuses a stale plan.
"""

from __future__ import annotations

from .plan import fingerprint, plan_hash
from .providers import CalendarProvider


class ApprovalError(RuntimeError):
    pass


def verify_approval(plan: dict, approved_plan_hash: str | None) -> None:
    recomputed = plan_hash(plan["spec_hash"], plan["steps"])
    if recomputed != plan.get("plan_hash"):
        raise ApprovalError("plan contents do not match its recorded hash — refusing to apply")
    if not approved_plan_hash or approved_plan_hash != recomputed:
        raise ApprovalError("this exact plan has not been approved")


def apply_plan(plan: dict, approved_plan_hash: str | None, provider: CalendarProvider) -> dict:
    verify_approval(plan, approved_plan_hash)

    actual = provider.list_managed()
    by_remote = {e.remote_id: e for e in actual}
    resources_present = {e.resource_id for e in actual}

    results = []
    for step in plan["steps"]:
        outcome = {"step_id": step["step_id"]}
        try:
            action = step["action"]
            if action == "create":
                if step["resource_id"] in resources_present:
                    outcome["status"] = "stale"
                    outcome["detail"] = "an event for this resource appeared after the plan was made"
                else:
                    outcome["remote_id"] = provider.create_event(
                        step["resource_id"], step["desired"], step["start_date"]
                    )
                    outcome["status"] = "ok"
            elif action in ("update", "delete"):
                current = by_remote.get(step["remote_id"])
                if current is None or fingerprint(current) != step["before_fingerprint"]:
                    outcome["status"] = "stale"
                    outcome["detail"] = "the event changed or disappeared after the plan was made"
                elif action == "update":
                    provider.update_event(step["remote_id"], step["desired"])
                    outcome["status"] = "ok"
                else:
                    provider.delete_event(step["remote_id"])
                    outcome["status"] = "ok"
            else:
                outcome["status"] = "failed"
                outcome["detail"] = f"unknown action {action!r}"
        except Exception as e:  # one failed step must not hide the others' outcomes
            outcome["status"] = "failed"
            outcome["detail"] = f"{type(e).__name__}: {e}"[:500]
        results.append(outcome)

    return {"status": overall_status(results), "steps": results}


def overall_status(results: list[dict]) -> str:
    statuses = {r["status"] for r in results}
    if not results or statuses == {"ok"}:
        return "applied"
    if "ok" in statuses:
        return "partially_applied"
    return "failed" if "failed" in statuses else "stale"
