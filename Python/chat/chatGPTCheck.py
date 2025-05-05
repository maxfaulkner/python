import os
from dotenv import load_dotenv

load_dotenv()  # Load from .env file

api_key = os.getenv("OPENAI_API_KEY")

if api_key and api_key.startswith("sk-"):
    print("✅ API key loaded successfully.")
else:
    print("❌ API key not found or improperly formatted.")
