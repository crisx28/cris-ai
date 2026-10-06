"""Load and validate the desired-state spec, and render each resource into the
exact calendar fields agentform manages."""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path

import yaml

ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,62}$")
RESOURCE_TYPES = {"bill_reminder"}
MANAGED_MARKER = "agentform"
MANAGED_DESCRIPTION = (
    "Managed by agentform. Change the finance spec and approve a plan "
    "instead of editing this event — manual edits are reverted on the next apply."
)


class SpecError(ValueError):
    pass


@dataclass(frozen=True)
class BillReminder:
    id: str
    name: str
    amount: Decimal
    due_day: int | str  # 1–28, or "last"
    remind_days_before: int
    gmail_query: str | None = None


@dataclass(frozen=True)
class Spec:
    version: int
    currency: str
    timezone: str
    resources: tuple[BillReminder, ...]
    raw_hash: str

    def by_id(self) -> dict[str, BillReminder]:
        return {r.id: r for r in self.resources}


def load_spec(path: str | Path) -> Spec:
    text = Path(path).read_text(encoding="utf-8")
    return parse_spec(text)


def parse_spec(text: str) -> Spec:
    try:
        data = yaml.safe_load(text)
    except yaml.YAMLError as e:
        raise SpecError(f"spec is not valid YAML: {e}") from e
    if not isinstance(data, dict):
        raise SpecError("spec must be a mapping")

    version = data.get("version")
    if version != 1:
        raise SpecError("spec.version must be 1")
    currency = _require_str(data, "currency", "spec")
    if not re.fullmatch(r"[A-Z]{3}", currency):
        raise SpecError("spec.currency must be a 3-letter ISO code, e.g. PHP")
    timezone = _require_str(data, "timezone", "spec")

    items = data.get("resources")
    if not isinstance(items, list) or not items:
        raise SpecError("spec.resources must be a non-empty list")

    resources: list[BillReminder] = []
    seen: set[str] = set()
    for i, item in enumerate(items):
        where = f"resources[{i}]"
        if not isinstance(item, dict):
            raise SpecError(f"{where} must be a mapping")
        rid = _require_str(item, "id", where)
        if not ID_RE.match(rid):
            raise SpecError(f"{where}.id must be lowercase letters, digits and dashes")
        if rid in seen:
            raise SpecError(f"duplicate resource id: {rid}")
        seen.add(rid)

        rtype = item.get("type")
        if rtype not in RESOURCE_TYPES:
            raise SpecError(f"{where}.type must be one of {sorted(RESOURCE_TYPES)}")

        unknown = set(item) - {
            "id", "type", "name", "amount", "due_day", "remind_days_before", "gmail_query",
        }
        if unknown:
            raise SpecError(f"{where} has unknown fields: {sorted(unknown)}")

        resources.append(
            BillReminder(
                id=rid,
                name=_require_str(item, "name", where),
                amount=_parse_amount(item.get("amount"), where),
                due_day=_parse_due_day(item.get("due_day"), where),
                remind_days_before=_parse_remind(item.get("remind_days_before", 1), where),
                gmail_query=_optional_str(item, "gmail_query", where),
            )
        )

    return Spec(
        version=version,
        currency=currency,
        timezone=timezone,
        resources=tuple(resources),
        raw_hash=hashlib.sha256(text.encode("utf-8")).hexdigest(),
    )


def desired_event_fields(resource: BillReminder, spec: Spec) -> dict:
    """The calendar fields agentform owns for a resource.

    Deliberately excludes the start date: it depends on "today", and including
    it would make every plan show a change. The start date is set once on
    create and the recurrence rule carries the schedule after that.
    """
    by_month_day = "-1" if resource.due_day == "last" else str(resource.due_day)
    return {
        "summary": f"{resource.name} due · {spec.currency} {resource.amount:,.2f}",
        "description": MANAGED_DESCRIPTION,
        "recurrence": [f"RRULE:FREQ=MONTHLY;BYMONTHDAY={by_month_day}"],
        "reminders": {
            "useDefault": False,
            "overrides": [{"method": "popup", "minutes": reminder_minutes(resource.remind_days_before)}],
        },
    }


def reminder_minutes(days_before: int) -> int:
    # All-day events start at midnight; aim the popup at 09:00 local time.
    if days_before == 0:
        return 0
    return days_before * 24 * 60 - 9 * 60


def canonical_json(value) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def _require_str(obj: dict, key: str, where: str) -> str:
    value = obj.get(key)
    if not isinstance(value, str) or not value.strip():
        raise SpecError(f"{where}.{key} is required and must be a string")
    return value.strip()


def _optional_str(obj: dict, key: str, where: str) -> str | None:
    value = obj.get(key)
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise SpecError(f"{where}.{key} must be a non-empty string when set")
    return value.strip()


def _parse_amount(value, where: str) -> Decimal:
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        raise SpecError(f"{where}.amount must be a number")
    try:
        amount = Decimal(str(value)).quantize(Decimal("0.01"))
    except InvalidOperation as e:
        raise SpecError(f"{where}.amount must be a number") from e
    if amount < 0:
        raise SpecError(f"{where}.amount must not be negative")
    return amount


def _parse_due_day(value, where: str) -> int | str:
    if value == "last":
        return "last"
    # Days 29–31 don't exist in every month and Google skips those months
    # entirely, so a reminder would silently vanish. Use "last" instead.
    if isinstance(value, int) and not isinstance(value, bool) and 1 <= value <= 28:
        return value
    raise SpecError(f'{where}.due_day must be 1–28 or "last"')


def _parse_remind(value, where: str) -> int:
    # Google caps reminders at four weeks before the event.
    if isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 27:
        return value
    raise SpecError(f"{where}.remind_days_before must be an integer from 0 to 27")
