#!/usr/bin/env python3
"""
llava_quickstart.py
Run a local LLaVA (via Ollama) on an image with a text prompt.

Usage:
  python llava_quickstart.py /path/to/image.jpg "What sensitive info is visible?"
"""

import sys
import ollama

def main():
    if len(sys.argv) < 2:
        print("Usage: python llava_quickstart.py <image_path> [prompt]")
        sys.exit(1)

    image_path = sys.argv[1]
    prompt = sys.argv[2] if len(sys.argv) > 2 else "Describe this image."

    # Choose the LLaVA model you pulled (7b or 13b)
    model = "llava:7b"
    print(f"Using model: {model}")

    # With ollama-python, you can pass paths in the 'images' list
    messages = [{
        "role": "user",
        "content": prompt,
        "images": [image_path],   # you can add multiple image paths here
    }]
    print(f"Sending prompt: {prompt} with image: {image_path}")

    resp = ollama.chat(model=model, messages=messages)
    print("\n--- LLaVA response ---\n")
    print(resp["message"]["content"])

if __name__ == "__main__":
    main()
