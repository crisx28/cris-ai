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

## ⚡ Run it live in 60 seconds

```bash
git clone https://github.com/crisx28/cris-ai.git
cd cris-ai
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...   # your Claude API key — enables real AI responses
python main.py
```

Then open **http://localhost:5000** and start chatting. The homepage shows
🟢 when the Claude API is connected. No key handy? It still runs — Cris.AI
drops to 🟡 offline mode with built-in replies, so you can see it working
either way.

Quick API test (no browser needed):

```bash
curl -X POST http://localhost:5000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "Explain MCP in one line"}'
```

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
