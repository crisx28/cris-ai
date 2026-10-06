from datetime import date
from decimal import Decimal
from types import SimpleNamespace

import pytest

from agentform.apply import ApprovalError, apply_plan
from agentform.observe import GmailReader, Observation, compute_advisories, observe
from agentform.plan import compute_plan, next_occurrence
from agentform.providers.fake import FakeCalendar
from agentform.runs import LocalRunStore, new_run
from agentform.spec import SpecError, parse_spec

SPEC = """
version: 1
currency: PHP
timezone: Asia/Manila
resources:
  - id: rent
    type: bill_reminder
    name: Rent
    amount: 15000
    due_day: 1
    remind_days_before: 3
    gmail_query: 'subject:"rent statement"'
  - id: water
    type: bill_reminder
    name: Water
    amount: 450.5
    due_day: last
"""

TODAY = date(2026, 10, 6)


def plan_and_approve(spec, cal):
    plan = compute_plan(spec, cal.list_managed(), today=TODAY)
    return plan, plan["plan_hash"]


# ---------- spec ----------

def test_spec_rejects_day_29_and_duplicates():
    with pytest.raises(SpecError, match="due_day"):
        parse_spec(SPEC.replace("due_day: 1", "due_day: 30"))
    with pytest.raises(SpecError, match="duplicate"):
        parse_spec(SPEC.replace("id: water", "id: rent"))
    with pytest.raises(SpecError, match="unknown fields"):
        parse_spec(SPEC.replace("remind_days_before: 3", "remind_days_before: 3\n    owner: x"))


def test_next_occurrence():
    assert next_occurrence(1, TODAY) == date(2026, 11, 1)
    assert next_occurrence(6, TODAY) == date(2026, 10, 6)
    assert next_occurrence("last", date(2026, 2, 10)) == date(2026, 2, 28)
    assert next_occurrence(15, date(2026, 12, 20)) == date(2027, 1, 15)


# ---------- plan ----------

def test_first_plan_creates_everything_and_second_is_empty():
    spec, cal = parse_spec(SPEC), FakeCalendar()
    plan, approved = plan_and_approve(spec, cal)
    assert [s["action"] for s in plan["steps"]] == ["create", "create"]
    assert plan["steps"][0]["desired"]["summary"] == "Rent due · PHP 15,000.00"
    assert plan["steps"][1]["desired"]["recurrence"] == ["RRULE:FREQ=MONTHLY;BYMONTHDAY=-1"]

    result = apply_plan(plan, approved, cal)
    assert result["status"] == "applied"

    again = compute_plan(spec, cal.list_managed(), today=TODAY)
    assert again["steps"] == []  # idempotent


def test_spec_change_updates_and_removal_deletes():
    spec, cal = parse_spec(SPEC), FakeCalendar()
    apply_plan(*plan_and_approve(spec, cal), cal)

    changed = parse_spec(SPEC.replace("amount: 15000", "amount: 15500").replace(
        "  - id: water\n    type: bill_reminder\n    name: Water\n    amount: 450.5\n    due_day: last\n", ""))
    plan = compute_plan(changed, cal.list_managed(), today=TODAY)
    assert {(s["action"], s["resource_id"]) for s in plan["steps"]} == {("update", "rent"), ("delete", "water")}
    assert apply_plan(plan, plan["plan_hash"], cal)["status"] == "applied"
    assert [e.resource_id for e in cal.list_managed()] == ["rent"]


def test_manual_edit_is_reverted_and_unmanaged_events_untouched():
    spec, cal = parse_spec(SPEC), FakeCalendar()
    apply_plan(*plan_and_approve(spec, cal), cal)
    cal.events["someone-elses"] = {"summary": "Dentist"}
    rent_id = next(e.remote_id for e in cal.list_managed() if e.resource_id == "rent")
    cal.events[rent_id]["summary"] = "edited by hand"

    plan = compute_plan(spec, cal.list_managed(), today=TODAY)
    assert [(s["action"], s["resource_id"]) for s in plan["steps"]] == [("update", "rent")]
    apply_plan(plan, plan["plan_hash"], cal)
    assert cal.events["someone-elses"] == {"summary": "Dentist"}


def test_duplicates_are_deleted():
    spec, cal = parse_spec(SPEC), FakeCalendar()
    apply_plan(*plan_and_approve(spec, cal), cal)
    rent_id = next(e.remote_id for e in cal.list_managed() if e.resource_id == "rent")
    cal.events["zzz-dup"] = dict(cal.events[rent_id])
    plan = compute_plan(spec, cal.list_managed(), today=TODAY)
    assert [(s["action"], s.get("reason")) for s in plan["steps"]] == [("delete", "duplicate")]


# ---------- apply gate ----------

def test_apply_refuses_unapproved_or_tampered_plans():
    spec, cal = parse_spec(SPEC), FakeCalendar()
    plan, approved = plan_and_approve(spec, cal)
    with pytest.raises(ApprovalError):
        apply_plan(plan, None, cal)
    with pytest.raises(ApprovalError):
        apply_plan(plan, "0" * 64, cal)

    plan["steps"][0]["desired"]["summary"] = "something else"  # edited after approval
    with pytest.raises(ApprovalError):
        apply_plan(plan, approved, cal)
    assert cal.events == {}


def test_stale_plan_is_not_applied():
    spec, cal = parse_spec(SPEC), FakeCalendar()
    apply_plan(*plan_and_approve(spec, cal), cal)
    changed = parse_spec(SPEC.replace("amount: 15000", "amount: 15500"))
    plan = compute_plan(changed, cal.list_managed(), today=TODAY)

    rent_id = plan["steps"][0]["remote_id"]
    cal.events[rent_id]["summary"] = "changed between plan and apply"
    result = apply_plan(plan, plan["plan_hash"], cal)
    assert result["status"] == "stale"
    assert cal.events[rent_id]["summary"] == "changed between plan and apply"


# ---------- run store ----------

def test_local_store_claim_once(tmp_path):
    spec, cal = parse_spec(SPEC), FakeCalendar()
    store = LocalRunStore(tmp_path)
    run = new_run(compute_plan(spec, cal.list_managed(), today=TODAY))
    store.save(run)
    assert store.claim_for_apply(run["id"]) is None  # not approved yet
    store.update(run["id"], {"status": "approved", "approved_plan_hash": run["plan_hash"]})
    assert store.claim_for_apply(run["id"])["status"] == "applying"
    assert store.claim_for_apply(run["id"]) is None
    with pytest.raises(ValueError):
        store.get("../../etc/passwd")


# ---------- observer ----------

class FakeGmailService:
    """Mimics the googleapiclient call chain for users().messages()."""

    def __init__(self, messages):
        self.messages_by_id = messages

    def users(self):
        return self

    def messages(self):
        return self

    def list(self, userId, q, maxResults):
        assert "newer_than:60d" in q
        return SimpleNamespace(execute=lambda: {"messages": [{"id": i} for i in self.messages_by_id]})

    def get(self, userId, id, format, metadataHeaders=None):
        msg = self.messages_by_id[id]
        return SimpleNamespace(execute=lambda: msg)


def _email(mid, body_b64):
    return {
        "id": mid,
        "payload": {
            "mimeType": "text/plain",
            "headers": [{"name": "Subject", "value": "Rent statement"}, {"name": "Date", "value": "1 Oct 2026"}],
            "body": {"data": body_b64},
        },
    }


class ScriptedClient:
    """Plays back canned model turns so the loop runs without the API."""

    def __init__(self, turns):
        self.turns = list(turns)
        self.requests = []
        self.beta = SimpleNamespace(messages=SimpleNamespace(create=self._create))

    def _create(self, **kwargs):
        self.requests.append(kwargs)
        return self.turns.pop(0)


def tool_use(id_, name, input_):
    return SimpleNamespace(type="tool_use", id=id_, name=name, input=input_)


def text(t):
    return SimpleNamespace(type="text", text=t)


def test_observer_loop_and_evidence_check():
    import base64
    import json

    spec = parse_spec(SPEC)
    body = base64.urlsafe_b64encode(b"Amount due: PHP 15,500.00. Due 2026-11-01.").decode()
    reader = GmailReader(FakeGmailService({"m1": _email("m1", body)}), {"rent": 'subject:"rent statement"'})
    final = {
        "observations": [
            {"resource_id": "rent", "observed_amount": 15500, "observed_due_date": "2026-11-01", "message_id": "m1", "confidence": "high"},
            {"resource_id": "rent", "observed_amount": 1, "observed_due_date": None, "message_id": "never-read", "confidence": "high"},
        ]
    }
    client = ScriptedClient([
        SimpleNamespace(stop_reason="tool_use", content=[tool_use("t1", "search_bill_emails", {"resource_id": "rent"})]),
        SimpleNamespace(stop_reason="tool_use", content=[tool_use("t2", "read_message", {"message_id": "m1"})]),
        SimpleNamespace(stop_reason="end_turn", content=[text(json.dumps(final))]),
    ])

    observations, warnings = observe(spec, reader, client)
    assert len(observations) == 1 and observations[0].observed_amount == Decimal("15500.00")
    assert any("unread message" in w for w in warnings)
    # The read tool result reached the model as untrusted data in a tool_result.
    # (The SDK receives the same list object, so the final assistant turn sits after it.)
    last_user = client.requests[-1]["messages"][-2]["content"][0]
    assert last_user["type"] == "tool_result" and "15,500.00" in last_user["content"]

    advisories = compute_advisories(spec, observations)
    assert advisories == [{
        "resource_id": "rent", "kind": "amount_differs", "spec_value": "15000.00",
        "observed_value": "15500.00", "message_date": "1 Oct 2026", "confidence": "high",
    }]


def test_reader_refuses_ids_it_did_not_return():
    reader = GmailReader(FakeGmailService({}), {"rent": "x"})
    with pytest.raises(ValueError):
        reader.read("guessed-id")
    with pytest.raises(ValueError):
        reader.search("water")  # no gmail_query configured


def test_low_confidence_observations_are_ignored():
    spec = parse_spec(SPEC)
    obs = [Observation("rent", Decimal("1.00"), None, "m", None, "low")]
    assert compute_advisories(spec, obs) == []


def test_refusal_returns_no_observations():
    spec = parse_spec(SPEC)
    reader = GmailReader(FakeGmailService({}), {"rent": "x"})
    client = ScriptedClient([SimpleNamespace(stop_reason="refusal", content=[])])
    observations, warnings = observe(spec, reader, client)
    assert observations == [] and "declined" in warnings[0]
