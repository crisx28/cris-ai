"""Keyless Google Workspace domain-wide delegation.

The process runs as its own identity (Cloud Run's service account, or your
`gcloud auth application-default login` user in local dev). It never holds a
service-account key: it asks the IAM Credentials API to sign a JWT as the
delegation service account, with `sub` set to the one Workspace user the
automation is allowed to act as.

Which delegation service account is used decides the scopes Google will grant,
because each one is registered in the Admin console with its own scope list:
the plan job signs as the read-only account, the apply job as the write one.
"""

from __future__ import annotations

import os

TOKEN_URI = "https://oauth2.googleapis.com/token"

SCOPES_PLAN = (
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
)
SCOPES_APPLY = ("https://www.googleapis.com/auth/calendar.events",)


class ConfigError(RuntimeError):
    pass


def delegated_credentials(scopes: tuple[str, ...]):
    """Credentials for AGENTFORM_SUBJECT via AGENTFORM_DWD_SA, signed keylessly."""
    import google.auth
    from google.auth import iam
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account

    dwd_sa = _env("AGENTFORM_DWD_SA")
    # The subject comes only from configuration — never from agent output or
    # spec content — so nothing at runtime can choose a different mailbox.
    subject = _env("AGENTFORM_SUBJECT")

    source, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    signer = iam.Signer(Request(), source, dwd_sa)
    return service_account.Credentials(
        signer=signer,
        service_account_email=dwd_sa,
        token_uri=TOKEN_URI,
        scopes=list(scopes),
        subject=subject,
    )


def _env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise ConfigError(f"{name} is not set — see automation/README.md")
    return value
