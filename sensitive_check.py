import re
import ollama
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextRequest(BaseModel):
    text: str


def contains_sensitive_data(text):
    """
    Check if the given text contains sensitive data using local Ollama model.
    Falls back to regex if Ollama fails.
    Returns True if sensitive data is found, False otherwise.
    """
    try:
        response = ollama.chat(
            model="llava:7b",  # Using llava:7b model
            messages=[
                {
                    "role": "system",
                    "content": "You are a security expert. Determine if the following text contains sensitive information such as API keys, account numbers, banking details (e.g., credit cards, bank accounts, routing numbers), passwords, or other confidential data. Do NOT flag personal names or emails as sensitive. Answer only 'yes' or 'no'.",
                },
                {"role": "user", "content": text},
            ],
        )
        answer = response["message"]["content"].strip().lower()
        return answer == "yes"
    except Exception as e:
        print(f"Ollama error: {e}. Falling back to regex.")
        return contains_sensitive_data_regex(text)


def contains_sensitive_data_regex(text):
    """
    Fallback regex-based check. Focus on API keys, banking, etc. Exclude emails.
    """
    patterns = [
        r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b",  # Phone number (still sensitive?)
        r"\b\d{3}-\d{2}-\d{4}\b",  # SSN
        r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b",  # Credit card
        r"\b\d{9,}\b",  # Long numbers (potential account numbers)
        r"\b[A-Za-z0-9]{20,}\b",  # Long alphanumeric (potential API keys)
        r"\b\d{9}-\d{1,2}\b",  # Routing numbers or similar
    ]
    return any(re.search(pattern, text, re.IGNORECASE) for pattern in patterns)


@app.post("/check")
async def check_text(request: TextRequest):
    is_sensitive = contains_sensitive_data(request.text)
    return {"sensitive": is_sensitive}


# For local testing
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
