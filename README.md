# AI Governance: LLM Prompt Sensitive Data Checker

A system to detect sensitive data in prompts sent to LLMs, using a Chrome extension frontend and a local Ollama-powered backend.

## Features

- Real-time monitoring of LLM input fields and attachments (ChatGPT, Claude, Bard)
- AI-powered sensitive data detection in text and images using local Ollama model
- Intelligent prompt rewriting to remove sensitive data or provide safe alternatives
- Fallback to regex patterns for text
- Local server for privacy (no external API calls)

## Prerequisites

- Python 3.12 or higher
- [uv](https://github.com/astral-sh/uv) package manager
- [Ollama](https://ollama.ai/) installed and running
- Google Chrome browser

## Installation and Setup

### 1. Install uv (if not already installed)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Restart your terminal or source your shell profile.

### 2. Clone or download the repository

```bash
git clone <repository-url>
cd ai_governance
```

### 3. Install Python dependencies

```bash
uv sync
```

### 4. Install and setup Ollama

- Download and install Ollama from [ollama.ai/download](https://ollama.ai/download)
- Pull the required models:

```bash
ollama pull llama3
ollama pull llava:7b
```

- Start the Ollama server:

```bash
ollama serve
```

### 5. Start the local detection server

```bash
uv run python main.py
```

The server runs on `http://127.0.0.1:8000`.

### 6. Load the Chrome extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `llm_prompt_checker` directory
5. The extension is now active

## Usage

### Using the Extension

1. **Ensure the backend server is running**: Start the local detection server with `uv run python sensitive_check.py`. The server must be running on `http://127.0.0.1:8000` for the extension to function.

2. **Verify the extension is loaded**: Confirm the "LLM Prompt Sensitive Data Checker" extension is enabled in Chrome at `chrome://extensions/`.

3. **Visit a supported LLM website**: Navigate to one of the supported sites:
   - ChatGPT (chat.openai.com or chatgpt.com)
   - Claude (claude.ai)
   - Bard (bard.google.com)

4. **Locate the prompt input field**: Find the text input area where you enter your prompts (typically a textarea or contenteditable div).

5. **Type or paste your prompt and upload attachments**: As you enter text or upload images/files, the extension monitors your input and attachments in real-time.

6. **Sensitive data detection**:
   - If sensitive information (such as emails, phone numbers, Social Security numbers, credit card numbers, or other PII) is detected in the text or attachments, a red warning banner will appear above the input field with the message: "⚠️ Warning: Sensitive data detected in your prompt/attachment!"
   - For text prompts, a "Use Suggested Prompt" button will appear, allowing you to replace the prompt with a rewritten version that removes sensitive data or redirects to official sources if needed.
   - The warning automatically disappears after 10 seconds.
   - If no sensitive data is found, no warning appears.

7. **Debugging**: Open the browser console (F12 or right-click > Inspect > Console) to view debug logs from the extension, including server responses and any errors.

### How It Works

- The extension runs as a content script on supported websites, monitoring textarea, text input, contenteditable elements, and attached images.
- On each input event (as you type or upload), it sends the current text and any image data (as base64) to the local server for analysis.
- The server uses AI (via Ollama's llava model) to detect sensitive data in text and images, with regex patterns as a fallback for text.
- All processing happens locally for privacy - no data is sent to external servers.

## Supported Websites

- chat.openai.com (ChatGPT)
- claude.ai (Claude)
- bard.google.com (Bard)

To add more sites, edit `llm_prompt_checker/manifest.json` and update the `matches` array.

## Troubleshooting

- **Extension not working**: Ensure the server is running and accessible at localhost:8000
- **Ollama errors**: Verify Ollama is installed and the model is pulled
- **No alerts**: Check browser console for fetch errors; ensure the input element is detected
- **Model issues**: Ensure both llama3 and llava:7b are pulled. If detection is not working, check server logs for model responses.

## Development

- Modify detection logic in `main.py` and `attachment_agent.py`
- Update extension scripts in `llm_prompt_checker/`
- Reload the extension in Chrome after changes

## License

[Add license if applicable]