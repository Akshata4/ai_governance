import re
from typing import Optional

import ollama
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from attachment_agent import check_attachment_sensitive
from prompt_modifier_agent import modify_prompt

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
    image: Optional[str] = None  # Optional base64 encoded image


def contains_sensitive_data_text(text):
    """
    Check if the given text contains sensitive data using local Ollama model.
    Falls back to regex if Ollama fails.
    Returns True if sensitive data is found, False otherwise.
    """
    try:
        response = ollama.chat(
            model="llava:7b",
            messages=[
                {
                    "role": "system",
                    "content": "You are a security expert. Determine if the following text contains sensitive information such as Social Security numbers, phone numbers, addresses,PAN card number, credit card numbers, bank account numbers, API keys, passwords, or other confidential data. Do NOT flag personal names or generic emails as sensitive. Answer only 'yes' or 'no'.",
                },
                {"role": "user", "content": text},
            ],
        )
        answer = response["message"]["content"].strip().lower()
        print(f"Text check Ollama response: {answer}")
        is_sensitive = answer == "yes"
        if not is_sensitive:
            # Fallback to regex check
            is_sensitive = contains_sensitive_data_regex(text)
            print(f"Regex fallback result: {is_sensitive}")
        return is_sensitive
    except Exception as e:
        print(f"Ollama error for text: {e}. Falling back to regex.")
        return contains_sensitive_data_regex(text)


def contains_sensitive_data(text, image=None):
    """
    Check if the given text or image contains sensitive data.
    Uses separate agents: text checker for text, attachment agent for images.
    Returns True if sensitive data is found, False otherwise.
    """
    if image:
        print("Attachment found, triggering attachment agent.")
        return check_attachment_sensitive(image)
    else:
        return contains_sensitive_data_text(text)


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
    is_sensitive = contains_sensitive_data(request.text, request.image)
    modified_prompt = None
    if is_sensitive and not request.image:  # Only modify text prompts
        modified_prompt = modify_prompt(request.text)
    return {"sensitive": is_sensitive, "modified_prompt": modified_prompt}


# For local testing
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
