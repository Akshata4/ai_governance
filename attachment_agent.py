import ollama


def check_attachment_sensitive(image_data):
    """
    Separate agent to check if an attachment (image) contains sensitive/confidential data.
    Uses Ollama llava model for analysis.
    Returns True if sensitive data is found, False otherwise.
    """
    try:
        prompt = "As a security expert, analyze this image for any sensitive or confidential information. Look for text or visual elements that could be personal identifiable information (PII) such as credit card numbers, Social Security numbers, phone numbers, addresses, API keys, passwords, email addresses, or other private data. Do not flag generic or public information. Answer only 'yes' if sensitive data is clearly present, otherwise 'no'."

        response = ollama.chat(
            model="llava:7b",
            messages=[
                {
                    "role": "system",
                    "content": "You are a specialized agent for detecting sensitive data in images. Be thorough but conservative - only flag clear instances of confidential information.",
                },
                {"role": "user", "content": prompt, "images": [image_data]},
            ],
        )
        answer = response["message"]["content"].strip().lower()
        print(f"Attachment agent response: {answer}")
        return answer == "yes"
    except Exception as e:
        print(f"Attachment agent error: {e}")
        return False
