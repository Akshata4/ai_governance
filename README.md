# AI Governance: LLM Prompt Sensitive Data Checker

A system to detect sensitive data in prompts sent to LLMs, using a Chrome extension frontend and a local Ollama-powered backend.

## Features

- Real-time monitoring of LLM input fields (ChatGPT, Claude, Bard)
- AI-powered sensitive data detection using local Ollama model
- Fallback to regex patterns
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
- Pull the required model:

```bash
ollama pull llava:7b
```

- Start the Ollama server:

```bash
ollama serve
```

### 5. Start the local detection server

```bash
uv run python sensitive_check.py
```

The server runs on `http://127.0.0.1:8000`.

### 6. Load the Chrome extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `llm_prompt_checker` directory
5. The extension is now active

## Usage

1. Visit a supported LLM website (e.g., chat.openai.com)
2. Start typing a prompt in the input field
3. If sensitive data (emails, phones, SSNs, etc.) is detected, an alert will appear
4. Check the browser console for debug logs

## Supported Websites

- chat.openai.com (ChatGPT)
- claude.ai (Claude)
- bard.google.com (Bard)

To add more sites, edit `llm_prompt_checker/manifest.json` and update the `matches` array.

## Troubleshooting

- **Extension not working**: Ensure the server is running and accessible at localhost:8000
- **Ollama errors**: Verify Ollama is installed and the model is pulled
- **No alerts**: Check browser console for fetch errors; ensure the input element is detected
- **Model issues**: If llava:7b doesn't work well for text, try `ollama pull llama3` and update the model in `sensitive_check.py`

## Development

- Modify detection logic in `sensitive_check.py`
- Update extension scripts in `llm_prompt_checker/`
- Reload the extension in Chrome after changes

## License

[Add license if applicable]