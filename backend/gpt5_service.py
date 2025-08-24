
from dotenv import load_dotenv
load_dotenv()
import os
import requests

AIML_API_URL = "https://api.aimlapi.com/v1/chat/completions"
AIML_API_KEY = os.getenv("AIML_API_KEY")  # Set this in your environment variables
GPT5_MODEL = "openai/gpt-5-2025-08-07"

class GPT5Service:
    def __init__(self, api_key=None):
        self.api_key = api_key or AIML_API_KEY
        if not self.api_key:
            raise ValueError("AIML_API_KEY is not set in environment variables.")

    def chat(self, messages, max_tokens=512, temperature=1.0):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": GPT5_MODEL,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }
        response = requests.post(AIML_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        # Extract the main output text
        if "output_text" in data:
            return data["output_text"]
        # Fallback: try to extract from nested structure
        try:
            for item in data.get("output", []):
                if item.get("type") == "message":
                    for content in item.get("content", []):
                        if content.get("type") == "output_text":
                            return content.get("text")
        except Exception:
            pass
        return data
