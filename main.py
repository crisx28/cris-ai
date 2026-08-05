# Cris.AI — a real Claude-powered personal assistant
# Uses the Anthropic Claude API for genuine generative responses,
# with a graceful rule-based fallback when no API key is configured.

from flask import Flask, request, jsonify
import datetime
import os
import random

app = Flask(__name__)

# --- Claude integration -----------------------------------------------------
# Set ANTHROPIC_API_KEY in your environment to enable real AI responses.
# Without it, Cris.AI falls back to simple rule-based replies so the app
# still runs anywhere.

MODEL = os.environ.get("CRIS_MODEL", "claude-sonnet-5")

SYSTEM_PROMPT = (
    "You are Cris.AI, a warm, concise personal assistant. "
    "Be genuinely helpful, friendly and to the point. "
    "Use light emoji where it feels natural, never overdo it."
)

_client = None


def get_client():
    """Lazily create the Anthropic client if an API key is available."""
    global _client
    if _client is not None:
        return _client
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        from anthropic import Anthropic
        _client = Anthropic(api_key=api_key)
        return _client
    except Exception as e:
        print(f"⚠️  Could not init Anthropic client: {e}")
        return None


def rule_based_reply(user_message: str) -> str:
    """Fallback used when no API key is set or the API call fails."""
    msg = user_message.lower()
    if any(w in msg for w in ["hello", "hi", "hey"]):
        return "Hello! I'm Cris.AI! 😊 Great to meet you!"
    if any(w in msg for w in ["time", "clock"]):
        return f"⏰ Current time: {datetime.datetime.now().strftime('%I:%M %p on %A')}"
    if any(w in msg for w in ["joke", "funny", "laugh"]):
        jokes = [
            "Why don't scientists trust atoms? Because they make up everything! 😄",
            "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
            "What's a computer's favorite snack? Microchips! 🍪",
            "Why did the AI go to therapy? It had too many deep learning issues! 🤖",
        ]
        return random.choice(jokes)
    if any(w in msg for w in ["name", "who are you"]):
        return "I'm Cris.AI, your personal AI assistant! 🤖✨"
    if "how are you" in msg:
        return "I'm doing fantastic! Thanks for asking! How are you today? 😊"
    if any(w in msg for w in ["help", "what can you do"]):
        return ("I can chat, tell you the time, share jokes, and — when connected "
                "to the Claude API — answer just about anything! 💡")
    return (f"You said: '{user_message}'. I'm running in offline mode right now "
            "(no API key set), so I can't fully reason about that yet. Set "
            "ANTHROPIC_API_KEY to unlock real AI responses! 💭")


def generate_reply(user_message: str) -> str:
    """Return a Claude-generated reply, falling back to rules on any failure."""
    client = get_client()
    if client is None:
        return rule_based_reply(user_message)
    try:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        # Concatenate any text blocks in the response
        parts = [block.text for block in resp.content if getattr(block, "type", "") == "text"]
        text = "".join(parts).strip()
        return text or rule_based_reply(user_message)
    except Exception as e:
        print(f"⚠️  Claude API error, using fallback: {e}")
        return rule_based_reply(user_message)


# --- Routes -----------------------------------------------------------------

@app.route('/')
def home():
    ai_status = "🟢 Claude API connected" if get_client() else "🟡 Offline mode (set ANTHROPIC_API_KEY)"
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <title>🤖 Cris.AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }}
            .container {{
                background: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }}
            h1 {{ color: #333; text-align: center; margin-bottom: 10px; }}
            p {{ text-align: center; color: #666; margin-bottom: 10px; }}
            .status {{ text-align: center; font-size: 13px; color: #888; margin-bottom: 25px; }}
            form {{ text-align: center; margin: 20px 0; }}
            input[type="text"] {{
                width: 60%; padding: 15px; border: 2px solid #ddd;
                border-radius: 25px; font-size: 16px; margin-bottom: 15px;
            }}
            button {{
                padding: 15px 25px; background: #007bff; color: white; border: none;
                border-radius: 25px; cursor: pointer; font-size: 16px;
            }}
            button:hover {{ background: #0056b3; }}
            .examples {{ text-align: center; margin-top: 20px; }}
            .example {{
                display: inline-block; background: #e9ecef; padding: 8px 12px;
                margin: 5px; border-radius: 15px; font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Cris.AI is Running!</h1>
            <p>Your personal AI assistant, powered by Claude.</p>
            <div class="status">{ai_status}</div>
            <form action="/chat" method="post">
                <input type="text" name="message" placeholder="Ask me anything..." required>
                <button type="submit">Send 🚀</button>
            </form>
            <div class="examples">
                <strong>Try these:</strong><br>
                <span class="example">"Explain MCP in one line"</span>
                <span class="example">"What time is it?"</span>
                <span class="example">"Write me a haiku about automation"</span>
            </div>
        </div>
    </body>
    </html>
    '''


@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.form.get('message', '')
    response = generate_reply(user_message)
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Cris.AI Response</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto;
                padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }}
            .container {{
                background: white; padding: 30px; border-radius: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }}
            .response {{
                background: #d4edda; padding: 20px; border-radius: 10px; margin: 20px 0;
                border-left: 5px solid #28a745; white-space: pre-wrap;
            }}
            .user-msg {{
                background: #cce5ff; padding: 15px; border-radius: 10px; margin: 10px 0;
                border-left: 5px solid #007bff;
            }}
            a {{
                display: inline-block; padding: 15px 25px; background: #007bff; color: white;
                text-decoration: none; border-radius: 25px; margin: 20px 0;
            }}
            a:hover {{ background: #0056b3; }}
            h1 {{ text-align: center; color: #333; margin-bottom: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Cris.AI Response</h1>
            <div class="user-msg"><strong>You:</strong> {user_message}</div>
            <div class="response"><strong>Cris.AI:</strong> {response}</div>
            <a href="/">← Ask me something else!</a>
        </div>
    </body>
    </html>
    '''


@app.route('/api/chat', methods=['POST'])
def api_chat():
    """JSON API endpoint — returns a Claude-generated reply."""
    data = request.get_json(silent=True) or {}
    user_message = data.get('message', '')
    if not user_message:
        return jsonify({"error": "Missing 'message' field"}), 400
    return jsonify({
        "message": user_message,
        "response": generate_reply(user_message),
        "model": MODEL if get_client() else "rule-based-fallback",
    })


@app.route('/health')
def health():
    return jsonify({"status": "ok", "ai": "connected" if get_client() else "offline"})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("🚀 Cris.AI Starting...")
    print(f"🌐 Running on port {port}")
    print("🟢 Claude API connected" if get_client() else "🟡 Offline mode (set ANTHROPIC_API_KEY)")
    app.run(host='0.0.0.0', port=port, debug=False)
