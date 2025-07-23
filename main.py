# Simple version of Cris.AI to test

from flask import Flask, request, jsonify
import datetime
import os

app = Flask(__name__)

@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>🤖 Cris.AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { 
                font-family: Arial, sans-serif; 
                max-width: 600px; 
                margin: 50px auto; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container { 
                background: white; 
                padding: 30px; 
                border-radius: 15px; 
                box-shadow: 0 5px 15px rgba(0,0,0,0.1); 
            }
            h1 { 
                color: #333; 
                text-align: center; 
                margin-bottom: 10px; 
            }
            p { 
                text-align: center; 
                color: #666; 
                margin-bottom: 30px; 
            }
            form { 
                text-align: center; 
                margin: 20px 0; 
            }
            input[type="text"] { 
                width: 60%; 
                padding: 15px; 
                border: 2px solid #ddd; 
                border-radius: 25px; 
                font-size: 16px; 
                margin-bottom: 15px;
            }
            button { 
                padding: 15px 25px; 
                background: #007bff; 
                color: white; 
                border: none; 
                border-radius: 25px; 
                cursor: pointer; 
                font-size: 16px;
            }
            button:hover { 
                background: #0056b3; 
            }
            .examples { 
                text-align: center; 
                margin-top: 20px; 
            }
            .example { 
                display: inline-block; 
                background: #e9ecef; 
                padding: 8px 12px; 
                margin: 5px; 
                border-radius: 15px; 
                font-size: 14px; 
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 Cris.AI is Running!</h1>
            <p>Your personal AI assistant is online!</p>
            <form action="/chat" method="post">
                <input type="text" name="message" placeholder="Ask me anything..." required>
                <button type="submit">Send 🚀</button>
            </form>
            
            <div class="examples">
                <strong>Try these:</strong><br>
                <span class="example">"Hello"</span>
                <span class="example">"What time is it?"</span>
                <span class="example">"Tell me a joke"</span>
            </div>
        </div>
    </body>
    </html>
    '''

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.form.get('message', '')
    
    # Enhanced responses
    msg_lower = user_message.lower()
    
    if any(word in msg_lower for word in ['hello', 'hi', 'hey']):
        response = "Hello! I'm Cris.AI! 😊 Great to meet you!"
    elif any(word in msg_lower for word in ['time', 'clock']):
        response = f"⏰ Current time: {datetime.datetime.now().strftime('%I:%M %p on %A')}"
    elif any(word in msg_lower for word in ['joke', 'funny', 'laugh']):
        jokes = [
            "Why don't scientists trust atoms? Because they make up everything! 😄",
            "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
            "What's a computer's favorite snack? Microchips! 🍪",
            "Why did the AI go to therapy? It had too many deep learning issues! 🤖"
        ]
        import random
        response = random.choice(jokes)
    elif any(word in msg_lower for word in ['name', 'who are you']):
        response = "I'm Cris.AI, your personal AI assistant created just for you! 🤖✨"
    elif 'how are you' in msg_lower:
        response = "I'm doing fantastic! Thanks for asking! How are you doing today? 😊"
    elif any(word in msg_lower for word in ['help', 'what can you do']):
        response = "I can chat with you, tell you the current time, share jokes, and respond to your messages! Just ask me anything! 💡"
    else:
        response = f"You said: '{user_message}' - That's really interesting! I love chatting with you! What else would you like to talk about? 💭"
    
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Cris.AI Response</title>
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
            .response {{ 
                background: #d4edda; 
                padding: 20px; 
                border-radius: 10px; 
                margin: 20px 0; 
                border-left: 5px solid #28a745; 
            }}
            .user-msg {{ 
                background: #cce5ff; 
                padding: 15px; 
                border-radius: 10px; 
                margin: 10px 0; 
                border-left: 5px solid #007bff; 
            }}
            a {{ 
                display: inline-block; 
                padding: 15px 25px; 
                background: #007bff; 
                color: white; 
                text-decoration: none; 
                border-radius: 25px; 
                margin: 20px 0; 
            }}
            a:hover {{ 
                background: #0056b3; 
            }}
            h1 {{ 
                text-align: center; 
                color: #333; 
                margin-bottom: 20px;
            }}
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

# ...existing code...

if __name__ == '__main__':
    # Get port from environment (Railway needs this)
    port = int(os.environ.get('PORT', 5000))
    print("🚀 Cris.AI Starting...")
    print(f"🌐 Running on port {port}")
    # IMPORTANT: host='0.0.0.0' for deployment
    app.run(host='0.0.0.0', port=port, debug=False)
