"""Calendar providers: where agentform reads actual state and applies changes.

Every provider exposes the same four calls. Only the executor in apply.py calls
the three write methods, and only for steps in an approved plan.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from ..spec import MANAGED_MARKER, canonical_json

MANAGED_FIELDS = ("summary", "description", "recurrence", "reminders")


@dataclass(frozen=True)
class RemoteEvent:
    remote_id: str
    resource_id: str
    fields: dict  # normalized MANAGED_FIELDS only


class CalendarProvider(Protocol):
    def list_managed(self) -> list[RemoteEvent]: ...

    def create_event(self, resource_id: str, fields: dict, start_date: str) -> str: ...

    def update_event(self, remote_id: str, fields: dict) -> None: ...

    def delete_event(self, remote_id: str) -> None: ...


def normalize_fields(event: dict) -> dict:
    """Reduce a calendar event to the managed fields in a comparable form."""
    reminders = event.get("reminders") or {}
    overrides = sorted(
        ({"method": o.get("method"), "minutes": o.get("minutes")} for o in reminders.get("overrides") or []),
        key=canonical_json,
    )
    return {
        "summary": event.get("summary") or "",
        "description": event.get("description") or "",
        "recurrence": list(event.get("recurrence") or []),
        "reminders": {"useDefault": bool(reminders.get("useDefault", False)), "overrides": overrides},
    }


def managed_properties(resource_id: str) -> dict:
    return {"private": {MANAGED_MARKER: "1", f"{MANAGED_MARKER}_id": resource_id}}
