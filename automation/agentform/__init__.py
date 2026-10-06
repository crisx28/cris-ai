"""agentform — Terraform-style plan/approve/apply for household finance automations.

Desired state lives in a YAML spec. A plan is a deterministic diff between that
spec and what actually exists (Google Calendar events tagged as managed). A
plan only touches the outside world after a person approves its exact hash.
The Claude agent's job is observation: reading bill emails through read-only
tools and flagging amounts that no longer match the spec.
"""

__version__ = "0.1.0"
