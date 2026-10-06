"""Deterministic diff between the spec and actual calendar state.

No model is involved here: the same spec and the same calendar always produce
the same steps, which is what makes a plan something a person can approve.
"""

from __future__ import annotations

import calendar as _calendar
import hashlib
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from .providers import RemoteEvent
from .spec import Spec, canonical_json, desired_event_fields


def fingerprint(event: RemoteEvent) -> str:
    return hashlib.sha256(canonical_json({"id": event.remote_id, "fields": event.fields}).encode()).hexdigest()


def plan_hash(spec_hash: str, steps: list[dict]) -> str:
    return hashlib.sha256(canonical_json({"spec_hash": spec_hash, "steps": steps}).encode()).hexdigest()


def compute_plan(
    spec: Spec,
    actual: list[RemoteEvent],
    advisories: list[dict] | None = None,
    today: date | None = None,
) -> dict:
    today = today or datetime.now(ZoneInfo(spec.timezone)).date()
    desired = spec.by_id()

    by_resource: dict[str, list[RemoteEvent]] = {}
    for event in actual:
        by_resource.setdefault(event.resource_id, []).append(event)

    steps: list[dict] = []
    for rid in sorted(set(desired) | set(by_resource)):
        remotes = sorted(by_resource.get(rid, []), key=lambda e: e.remote_id)
        resource = desired.get(rid)

        if resource is None:
            # Tagged as ours but no longer in the spec.
            for event in remotes:
                steps.append(_step("delete", rid, event, None, _changes(event.fields, None)))
            continue

        want = desired_event_fields(resource, spec)
        if not remotes:
            steps.append(
                {
                    **_step("create", rid, None, want, _changes(None, want)),
                    "start_date": next_occurrence(resource.due_day, today).isoformat(),
                }
            )
            continue

        keep, *duplicates = remotes
        if keep.fields != want:
            steps.append(_step("update", rid, keep, want, _changes(keep.fields, want)))
        for event in duplicates:
            steps.append(_step("delete", rid, event, None, _changes(event.fields, None), reason="duplicate"))

    counts = {a: sum(1 for s in steps if s["action"] == a) for a in ("create", "update", "delete")}
    return {
        "version": 1,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "spec_hash": spec.raw_hash,
        "steps": steps,
        "advisories": advisories or [],
        "summary": {**counts, "advisories": len(advisories or [])},
        "plan_hash": plan_hash(spec.raw_hash, steps),
    }


def next_occurrence(due_day: int | str, today: date) -> date:
    """The next date (today included) that falls on the due day."""
    year, month = today.year, today.month
    for _ in range(2):
        last = _calendar.monthrange(year, month)[1]
        day = last if due_day == "last" else int(due_day)
        candidate = date(year, month, day)
        if candidate >= today:
            return candidate
        year, month = (year + 1, 1) if month == 12 else (year, month + 1)
    raise AssertionError("unreachable: a due day always occurs within two months")


def _step(action, rid, event: RemoteEvent | None, desired, changes, reason: str | None = None) -> dict:
    step = {
        "step_id": f"{action}:{rid}:{event.remote_id if event else 'new'}",
        "action": action,
        "resource_id": rid,
        "remote_id": event.remote_id if event else None,
        "before_fingerprint": fingerprint(event) if event else None,
        "desired": desired,
        "changes": changes,
    }
    if reason:
        step["reason"] = reason
    return step


def _changes(before: dict | None, after: dict | None) -> list[dict]:
    keys = sorted(set(before or {}) | set(after or {}))
    out = []
    for key in keys:
        old = (before or {}).get(key)
        new = (after or {}).get(key)
        if old != new:
            out.append({"field": key, "from": old, "to": new})
    return out
