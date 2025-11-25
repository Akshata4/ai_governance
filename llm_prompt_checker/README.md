# LLM Prompt Sensitive Data Checker

A Chrome extension that monitors prompts entered into LLM interfaces and alerts if sensitive data is detected using a local Ollama model.

## Prerequisites

- Python 3.12+
- Ollama installed and running locally with a model (e.g., llama3)
- Install dependencies: `pip install -r requirements.txt` or `uv sync`

## Setup

1. Start the local server: `python sensitive_check.py`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `llm_prompt_checker` directory
5. The extension is now installed

## Usage

- Visit supported LLM websites (ChatGPT, Claude, Bard)
- Start typing a prompt in the input field
- If sensitive data is detected, an alert will appear

## Supported Sites

- chat.openai.com
- claude.ai
- bard.google.com

Add more sites by updating the `matches` in `manifest.json`

## Detection

Uses local Ollama model for AI-powered detection, with regex fallback.