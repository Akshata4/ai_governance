# AI Governance: LLM Prompt PII Blocker

<img width="2848" height="1600" alt="image" src="https://github.com/user-attachments/assets/3eb9e454-ab5b-4c8f-a696-192ca4911e2b" />

A Chrome extension that blocks sensitive data (PII, API keys, credentials) from being sent to browser-based LLMs. Works standalone with regex detection or can be enhanced with any OpenAI-compatible LLM API.

## Features

- **Real-time blocking** of sensitive data before it reaches LLMs
- **Comprehensive detection** for 20+ types of sensitive data:
  - Personal: SSN, credit cards, phone numbers, PAN cards, routing numbers
  - API Keys: AWS, GitHub, OpenAI, Anthropic, Stripe, Google, Slack, Discord, Twilio, SendGrid, Mailchimp, npm, PyPI
  - Secrets: Private keys, JWT tokens, Bearer tokens, database connection strings
- **Self-contained architecture** - works without any backend server
- **Optional AI enhancement** - connect any OpenAI-compatible API (Ollama, LM Studio, vLLM) for nuanced detection
- **Blocking overlay** with suggested redacted prompts
- **Dark-themed settings UI** for easy configuration
- **Multi-platform support** - ChatGPT, Claude, Perplexity, Gemini, Bard

## Supported Websites

- chat.openai.com / chatgpt.com (ChatGPT)
- claude.ai (Claude)
- perplexity.ai / www.perplexity.ai (Perplexity)
- gemini.google.com (Gemini)
- bard.google.com (Bard)

## Installation

### Quick Start (Extension Only)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai_governance
   ```

2. **Load the Chrome extension**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `llm_prompt_checker` directory

3. **Done!** The extension works immediately with regex-based detection.

### Optional: Enable AI-Enhanced Detection

For more nuanced detection, connect a self-hosted LLM:

1. **Install Ollama** from [ollama.ai/download](https://ollama.ai/download)

2. **Pull a model**
   ```bash
   ollama pull llama3
   ```

3. **Start Ollama server**
   ```bash
   ollama serve
   ```

4. **Configure the extension**
   - Click the PII Blocker extension icon
   - Enable "Use AI Detection"
   - Set API Endpoint: `http://localhost:11434/v1/`
   - Set Model Name: `llama3`
   - Click "Test Connection" to verify
   - Click "Save Settings"

## Usage

1. **Navigate to a supported LLM website** (ChatGPT, Claude, Perplexity, etc.)

2. **Type your prompt** - The extension monitors all input

3. **Press Enter or click Send** - The extension intercepts and checks for sensitive data

4. **If sensitive data detected**:
   - A blocking overlay appears
   - Shows what type of data was detected
   - Displays a suggested redacted version of your prompt
   - Click "I Understand - Edit My Prompt" to dismiss and edit

5. **If no sensitive data** - Your prompt is sent normally

## Configuration

Click the extension icon to access settings:

| Setting | Description |
|---------|-------------|
| Enable Protection | Toggle PII blocking on/off |
| Use AI Detection | Enable LLM-based detection (requires API) |
| API Endpoint | OpenAI-compatible API URL (e.g., `http://localhost:11434/v1/`) |
| API Key | Optional API key for authenticated endpoints |
| Model Name | Model to use (e.g., `llama3`, `gpt-4`, `claude-3`) |

## Detected Patterns

### Personal Information
- Social Security Numbers (XXX-XX-XXXX)
- Credit Card Numbers (16 digits)
- Phone Numbers
- PAN Card Numbers (Indian)
- Bank Routing Numbers

### API Keys & Tokens
- AWS Access Keys (AKIA...)
- GitHub Tokens (ghp_, gho_, ghu_, ghs_, ghr_)
- OpenAI API Keys (sk-...)
- Anthropic API Keys (sk-ant-...)
- Stripe Keys (sk_live_, sk_test_, pk_live_, pk_test_)
- Google API Keys (AIza...)
- Slack Tokens (xox...)
- Discord Tokens
- Twilio API Keys (SK...)
- SendGrid API Keys (SG...)
- Mailchimp API Keys
- npm Tokens (npm_...)
- PyPI Tokens (pypi-...)

### Secrets & Credentials
- Private Keys (RSA, DSA, EC, OPENSSH, PGP)
- JWT Tokens
- Bearer Tokens
- Database Connection Strings (MongoDB, MySQL, PostgreSQL, Redis)
- Generic API key patterns (api_key=, secret_key=, etc.)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│  content.js          │  background.js      │  popup.html    │
│  - Intercepts Enter  │  - Regex detection  │  - Settings UI │
│  - Intercepts clicks │  - LLM API calls    │  - Dark theme  │
│  - Shows overlay     │  - Message handler  │                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (optional)
                    ┌─────────────────────┐
                    │  OpenAI-Compatible  │
                    │  API (Ollama, etc.) │
                    └─────────────────────┘
```

## Optional: Legacy Backend Server

A Python backend is included for advanced use cases (image analysis):

```bash
# Install dependencies
uv sync

# Pull models
ollama pull llama3
ollama pull llava:7b

# Start server
uv run python main.py
```

The server runs on `http://127.0.0.1:8000` and provides `/check` endpoint for text/image analysis.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension not blocking | Ensure "Enable Protection" is on in settings |
| AI detection not working | Verify Ollama is running and model is pulled |
| Test connection fails | Check API URL ends with `/v1/` for Ollama |
| No overlay appears | Check browser console for errors; refresh the page |
| "Extension context invalidated" | Refresh the LLM page |

## Development

- **Extension files**: `llm_prompt_checker/`
  - `manifest.json` - Extension configuration
  - `content.js` - DOM interaction and event interception
  - `background.js` - Detection logic and API calls
  - `popup.html/js` - Settings UI
- **Backend files** (optional): `main.py`, `attachment_agent.py`, `prompt_modifier_agent.py`

To add more LLM sites, edit `llm_prompt_checker/manifest.json` and add URLs to the `matches` array.

## License

[Add license if applicable]
