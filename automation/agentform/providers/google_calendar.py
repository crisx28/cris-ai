"""Google Calendar provider. Only events tagged with agentform's private
extended property are read or touched; everything else on the calendar is
invisible to it."""

from __future__ import annotations

from . import RemoteEvent, managed_properties, normalize_fields
from ..spec import MANAGED_MARKER


class GoogleCalendar:
    def __init__(self, calendar_id: str, credentials):
        from googleapiclient.discovery import build

        self.calendar_id = calendar_id
        self.service = build("calendar", "v3", credentials=credentials, cache_discovery=False)

    def list_managed(self) -> list[RemoteEvent]:
        out: list[RemoteEvent] = []
        page_token = None
        while True:
            resp = (
                self.service.events()
                .list(
                    calendarId=self.calendar_id,
                    privateExtendedProperty=f"{MANAGED_MARKER}=1",
                    showDeleted=False,
                    singleEvents=False,
                    maxResults=250,
                    pageToken=page_token,
                )
                .execute()
            )
            for event in resp.get("items", []):
                private = (event.get("extendedProperties") or {}).get("private") or {}
                out.append(
                    RemoteEvent(event["id"], private.get(f"{MANAGED_MARKER}_id", ""), normalize_fields(event))
                )
            page_token = resp.get("nextPageToken")
            if not page_token:
                return out

    def create_event(self, resource_id: str, fields: dict, start_date: str) -> str:
        end = _next_day(start_date)
        body = {
            **fields,
            "start": {"date": start_date},
            "end": {"date": end},
            "transparency": "transparent",  # a reminder, not a busy block
            "extendedProperties": managed_properties(resource_id),
        }
        created = self.service.events().insert(calendarId=self.calendar_id, body=body).execute()
        return created["id"]

    def update_event(self, remote_id: str, fields: dict) -> None:
        self.service.events().patch(calendarId=self.calendar_id, eventId=remote_id, body=fields).execute()

    def delete_event(self, remote_id: str) -> None:
        self.service.events().delete(calendarId=self.calendar_id, eventId=remote_id).execute()


def _next_day(iso_date: str) -> str:
    from datetime import date, timedelta

    return (date.fromisoformat(iso_date) + timedelta(days=1)).isoformat()
