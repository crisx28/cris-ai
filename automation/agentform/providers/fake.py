"""A file-backed stand-in for Google Calendar, for local development and tests.

Lets you run the whole plan → approve → apply loop with no Google project.
"""

from __future__ import annotations

import json
import uuid
from pathlib import Path

from . import RemoteEvent, managed_properties, normalize_fields
from ..spec import MANAGED_MARKER


class FakeCalendar:
    def __init__(self, path: str | Path | None = None):
        self.path = Path(path) if path else None
        self.events: dict[str, dict] = {}
        if self.path and self.path.exists():
            self.events = json.loads(self.path.read_text(encoding="utf-8"))

    def list_managed(self) -> list[RemoteEvent]:
        out = []
        for remote_id, event in sorted(self.events.items()):
            private = (event.get("extendedProperties") or {}).get("private") or {}
            if private.get(MANAGED_MARKER) != "1":
                continue
            out.append(RemoteEvent(remote_id, private.get(f"{MANAGED_MARKER}_id", ""), normalize_fields(event)))
        return out

    def create_event(self, resource_id: str, fields: dict, start_date: str) -> str:
        remote_id = uuid.uuid4().hex[:12]
        self.events[remote_id] = {
            **fields,
            "start": {"date": start_date},
            "extendedProperties": managed_properties(resource_id),
        }
        self._save()
        return remote_id

    def update_event(self, remote_id: str, fields: dict) -> None:
        if remote_id not in self.events:
            raise KeyError(f"event {remote_id} not found")
        self.events[remote_id].update(fields)
        self._save()

    def delete_event(self, remote_id: str) -> None:
        if remote_id not in self.events:
            raise KeyError(f"event {remote_id} not found")
        del self.events[remote_id]
        self._save()

    def _save(self) -> None:
        if self.path:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            self.path.write_text(json.dumps(self.events, indent=2, sort_keys=True), encoding="utf-8")
