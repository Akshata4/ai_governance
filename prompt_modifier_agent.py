import ollama


def modify_prompt(text):
    """
    Agent to modify a prompt by rewriting it to remove sensitive data.
    Uses AI to intelligently rewrite the prompt without sensitive information,
    or redirect to official sources if sensitive data is required.
    Returns the modified prompt.
    """
    try:
        response = ollama.chat(
            model="llama3",  # Use text-optimized model for prompt modification
            messages=[
                {
                    "role": "system",
                    "content": "You are a prompt sanitizer. Analyze the user's prompt and rewrite it to remove any sensitive data. If the user's request can be fulfilled without the sensitive information (e.g., general questions about topics), rewrite the prompt without the sensitive data. If the sensitive data is essential for the request (e.g., validating specific personal information), politely ask the user to use the official website or service instead. Do not include any sensitive data in your response. Keep the rewrite concise and helpful. Do not rewrite the sensitive data back to the response.",
                },
                {"role": "user", "content": text},
            ],
        )
        rewritten = response["message"]["content"].strip()
        print(f"Prompt modifier response: {rewritten}")
        return rewritten
    except Exception as e:
        print(f"Prompt modifier error: {e}")
        # Fallback to simple redaction
        import re

        redactions = [
            (r"\b\d{3}-\d{2}-\d{4}\b", "[REDACTED SSN]"),
            (r"\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b", "[REDACTED CREDIT CARD]"),
            (r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b", "[REDACTED PHONE]"),
        ]
        modified = text
        for pattern, replacement in redactions:
            modified = re.sub(pattern, replacement, modified, flags=re.IGNORECASE)
        return modified
