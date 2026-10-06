"""Run records: one per plan, carrying it through approval and apply.

Two backends with the same record shape:
- LocalRunStore — JSON files, for local development. The budget-os dev server
  reads the same directory, so you can approve from the app.
- SupabaseRunStore — the `automation_runs` table (budget-os/supabase/automation.sql).
  The runner writes with the service-role key; people approve through an RPC
  that checks ownership and the plan hash.
"""

from __future__ import annotations

import json
import os
import re
import secrets
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

RUN_ID_RE = re.compile(r"^[0-9]{8}-[0-9]{6}-[a-f0-9]{6}$")


def new_run(plan: dict) -> dict:
    now = datetime.now(timezone.utc)
    has_changes = bool(plan["steps"])
    return {
        "id": f"{now:%Y%m%d-%H%M%S}-{secrets.token_hex(3)}",
        "created_at": now.isoformat(timespec="seconds"),
        "status": "planned" if has_changes else "no_changes",
        "plan": plan,
        "plan_hash": plan["plan_hash"],
        "approved_plan_hash": None,
        "approved_at": None,
        "applied_at": None,
        "results": None,
        "error": None,
    }


class LocalRunStore:
    def __init__(self, directory: str | Path):
        self.dir = Path(directory)
        self.dir.mkdir(parents=True, exist_ok=True)

    def save(self, run: dict) -> None:
        _check_id(run["id"])
        tmp = self.dir / f"{run['id']}.json.tmp"
        tmp.write_text(json.dumps(run, indent=2, default=str), encoding="utf-8")
        tmp.replace(self.dir / f"{run['id']}.json")

    def get(self, run_id: str) -> dict | None:
        _check_id(run_id)
        path = self.dir / f"{run_id}.json"
        return json.loads(path.read_text(encoding="utf-8")) if path.exists() else None

    def list(self, status: str | None = None, limit: int = 50) -> list[dict]:
        runs = [json.loads(p.read_text(encoding="utf-8")) for p in self.dir.glob("*.json")]
        if status:
            runs = [r for r in runs if r["status"] == status]
        runs.sort(key=lambda r: r["created_at"], reverse=True)
        return runs[:limit]

    def claim_for_apply(self, run_id: str) -> dict | None:
        run = self.get(run_id)
        if not run or run["status"] != "approved":
            return None
        run["status"] = "applying"
        self.save(run)
        return run

    def update(self, run_id: str, fields: dict) -> None:
        run = self.get(run_id)
        if run is None:
            raise KeyError(run_id)
        run.update(fields)
        self.save(run)


class SupabaseRunStore:
    TABLE = "automation_runs"

    def __init__(self, url: str, service_key: str, owner_user_id: str):
        self.base = url.rstrip("/") + f"/rest/v1/{self.TABLE}"
        self.key = service_key
        self.owner = owner_user_id

    def save(self, run: dict) -> None:
        self._request("POST", "", body={**run, "user_id": self.owner}, prefer="return=minimal")

    def get(self, run_id: str) -> dict | None:
        _check_id(run_id)
        rows = self._request("GET", f"?id=eq.{run_id}&select=*")
        return rows[0] if rows else None

    def list(self, status: str | None = None, limit: int = 50) -> list[dict]:
        query = f"?select=*&order=created_at.desc&limit={int(limit)}"
        if status:
            query += f"&status=eq.{urllib.parse.quote(status)}"
        return self._request("GET", query)

    def claim_for_apply(self, run_id: str) -> dict | None:
        # Conditional update: only one runner can move a run out of "approved".
        _check_id(run_id)
        rows = self._request(
            "PATCH",
            f"?id=eq.{run_id}&status=eq.approved",
            body={"status": "applying"},
            prefer="return=representation",
        )
        return rows[0] if rows else None

    def update(self, run_id: str, fields: dict) -> None:
        _check_id(run_id)
        self._request("PATCH", f"?id=eq.{run_id}", body=fields, prefer="return=minimal")

    def _request(self, method: str, query: str, body: dict | None = None, prefer: str | None = None):
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer
        data = json.dumps(body, default=str).encode() if body is not None else None
        req = urllib.request.Request(self.base + query, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read()
        except urllib.error.HTTPError as e:
            raise RuntimeError(f"Supabase {method} failed ({e.code}): {e.read()[:300]!r}") from e
        return json.loads(raw) if raw else None


def store_from_env(data_dir: Path):
    if os.environ.get("AGENTFORM_STORE", "local") == "supabase":
        missing = [n for n in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "AGENTFORM_OWNER_USER_ID") if not os.environ.get(n)]
        if missing:
            raise RuntimeError(f"AGENTFORM_STORE=supabase needs {', '.join(missing)}")
        return SupabaseRunStore(
            os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"], os.environ["AGENTFORM_OWNER_USER_ID"]
        )
    return LocalRunStore(data_dir / "runs")


def _check_id(run_id: str) -> None:
    if not RUN_ID_RE.match(run_id):
        raise ValueError(f"invalid run id: {run_id!r}")
