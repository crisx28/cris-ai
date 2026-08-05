# 🤖 Cris.AI — Personal AI Assistant

A personal AI assistant web app powered by the **Claude API**, built with Python + Flask
and deployable to Railway. Falls back to simple rule-based replies when no API key is set,
so it runs anywhere out of the box.

## Features
- 💬 Interactive chat interface (web + JSON API)
- 🧠 Real generative responses via Anthropic's Claude
- 🟡 Graceful offline fallback when no API key is configured
- ⏰ Built-in time / joke helpers
- 🩺 `/health` endpoint for uptime checks

## How to Run
1. Install dependencies: `pip install -r requirements.txt`
2. (Optional but recommended) Set your key: `export ANTHROPIC_API_KEY=sk-ant-...`
3. Run: `python main.py`
4. Open: http://localhost:5000

## Configuration
| Env var | Purpose | Default |
|---|---|---|
| `ANTHROPIC_API_KEY` | Enables real Claude responses | _(offline mode if unset)_ |
| `CRIS_MODEL` | Which Claude model to use | `claude-sonnet-5` |
| `PORT` | Port to bind (set by Railway) | `5000` |

## Endpoints
- `GET /` — chat UI
- `POST /chat` — form-based chat (used by the UI)
- `POST /api/chat` — JSON: `{"message": "..."}` → `{"response": "..."}`
- `GET /health` — status check

## Built with Claude Code
This project was designed, built and deployed using **Claude Code**, Anthropic's
agentic coding tool — an example of directing an AI agent to write, review and ship
production code.
