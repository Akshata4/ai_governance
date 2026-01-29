# AI Governance: LLM Prompt PII Blocker

## 🎥 Demo Video

> **[Demo video will be added here]**

---

<img width="2848" height="1600" alt="image" src="https://github.com/user-attachments/assets/3eb9e454-ab5b-4c8f-a696-192ca4911e2b" />

## What is LLM Prompt PII Blocker?

A privacy-focused Chrome extension that **prevents accidental leakage of sensitive data** to browser-based Large Language Models (LLMs). It intercepts your prompts in real-time, scans for personally identifiable information (PII), API keys, credentials, and other confidential data **before** they reach ChatGPT, Claude, Gemini, or other LLM services.

### How It Works

1. **Intercepts** - Captures your prompt when you press Enter or click Send
2. **Analyzes** - Scans text using 30+ regex patterns for sensitive data
3. **Blocks** - Shows a full-screen warning if sensitive data is detected
4. **Suggests** - Provides a redacted version of your prompt
5. **Protects** - Prevents submission until you edit the sensitive information

The extension works **entirely client-side** with no data leaving your machine (except to your optional self-hosted LLM for enhanced detection).

## Features

### 🛡️ Protection
- **Real-time blocking** - Intercepts prompts before they reach LLMs
- **30+ detection patterns** - Comprehensive coverage for sensitive data
- **Dual detection strategy** - Fast regex + optional AI analysis
- **Full-screen overlay** - Unmissable warning with suggested alternatives
- **Zero false submissions** - Blocks until you explicitly edit the prompt

### 🔍 Detection Coverage
- **Personal Information:**
  - Social Security Numbers (SSN)
  - Credit card numbers (all major providers)
  - Phone numbers (multiple formats)
  - PAN cards (Indian tax ID)
  - Bank routing numbers

- **API Keys & Tokens:**
  - AWS (AKIA access keys, secret keys)
  - GitHub (PAT, OAuth, user, server, refresh tokens)
  - OpenAI (sk-...)
  - Anthropic (sk-ant-...)
  - Stripe (live/test secret/publishable)
  - Google Cloud (AIza...)
  - Slack (xox...)
  - Discord, Twilio, SendGrid, Mailchimp
  - npm, PyPI tokens

- **Secrets & Credentials:**
  - Private keys (RSA, DSA, EC, OPENSSH, PGP)
  - JWT tokens
  - Bearer tokens
  - Database URLs (MongoDB, MySQL, PostgreSQL, Redis)
  - Generic API key patterns (api_key=, secret_key=, auth_token=)

### 📊 Metrics & Monitoring
- **Usage tracking** - Total prompts checked and PII detections
- **Detection breakdown** - See which types of PII are most common
- **Platform usage** - Track which LLM sites you use most
- **Last detection timestamp** - When was the last PII blocked
- **Reset capability** - Clear all metrics when needed

### ⚙️ Configuration
- **Self-contained** - Works completely offline with regex detection
- **Optional AI enhancement** - Connect any OpenAI-compatible API
- **Dark-themed UI** - Easy on the eyes settings interface
- **Toggle protection** - Quickly enable/disable without uninstalling
- **Multi-platform support** - ChatGPT, Claude, Perplexity, Gemini, Bard
- **No data collection** - Everything stays on your machine

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

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│  content.js          │  background.js      │  popup.html    │
│  - Intercepts Enter  │  - Regex detection  │  - Settings UI │
│  - Intercepts clicks │  - LLM API calls    │  - Dark theme  │
│  - Shows overlay     │  - Message handler  │  - Metrics     │
│  - Platform detect   │  - Settings mgmt    │                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (optional)
                    ┌─────────────────────┐
                    │  OpenAI-Compatible  │
                    │  API (Ollama, etc.) │
                    └─────────────────────┘
```

### Codebase Structure

```
ai_governance/
├── llm_prompt_checker/          # Main Chrome Extension
│   ├── manifest.json            # Extension configuration (29 lines)
│   │   ├── Permissions: activeTab, storage, <all_urls>
│   │   ├── Content scripts for 7 LLM platforms
│   │   └── Service worker: background.js
│   │
│   ├── background.js            # Core detection engine (599 lines)
│   │   ├── SettingsManager class - Handles concurrent settings access
│   │   ├── PII_PATTERNS[] - 30+ regex patterns for sensitive data
│   │   ├── checkRegex() - Fast pattern matching
│   │   ├── checkWithLlm() - Optional AI-powered detection
│   │   ├── getModifiedPrompt() - Generates safe alternatives
│   │   ├── Metrics tracking - Usage stats and detection counts
│   │   └── Message handlers - Communication with content/popup
│   │
│   ├── content.js               # DOM interaction (346 lines)
│   │   ├── Event listeners - Keydown, click, submit interception
│   │   ├── Platform detection - Identifies ChatGPT, Claude, etc.
│   │   ├── getPromptText() - Extracts text from various input types
│   │   ├── showBlockingWarning() - Full-screen red overlay
│   │   ├── attachEventListeners() - Dynamic enable/disable
│   │   └── Chrome messaging - Talks to background.js
│   │
│   ├── popup.html               # Settings UI (425 lines)
│   │   ├── Control card - Enable/disable toggles
│   │   ├── Metrics dashboard - Usage statistics
│   │   ├── LLM configuration - API endpoint, key, model
│   │   └── Styling - Dark theme with gradients
│   │
│   └── popup.js                 # Settings logic (237 lines)
│       ├── Settings persistence - Chrome storage sync
│       ├── Metrics display - Real-time stats
│       ├── Test connection - Validates LLM API
│       └── Event handlers - Save, test, reset actions
│
├── archive/                     # Legacy implementations
│   └── python-backend/          # Optional FastAPI server (archived)
│       ├── main.py             # FastAPI endpoints
│       ├── pyproject.toml      # Python dependencies
│       └── README.md           # Backend documentation
│
└── README.md                    # This file
```

### Component Details

#### **background.js** - Service Worker (Core Engine)
- **Settings Management**: Thread-safe settings with `SettingsManager` class
- **Detection Engine**:
  - Regex-based (fast, 100% client-side)
  - LLM-based (optional, more accurate)
- **Metrics**: Tracks prompts checked, PII detected, platform usage
- **API Integration**: OpenAI-compatible endpoints (Ollama, LM Studio, vLLM)

#### **content.js** - Content Script (UI Layer)
- **Event Interception**: Captures Enter key and send button clicks
- **Smart Selectors**: Works across different LLM UI implementations
- **Blocking Overlay**: Full-screen warning with suggested alternatives
- **Dynamic Loading**: Attaches/detaches listeners based on settings

#### **popup.html/js** - Extension Popup (Settings)
- **Configuration UI**: Toggle protection, enable AI detection
- **Metrics Dashboard**: View detection stats and platform usage
- **LLM Setup**: Configure API endpoint, key, and model
- **Connection Testing**: Verify LLM API before saving

### Detection Strategy

```
User types prompt
        ↓
content.js intercepts (Enter/Click)
        ↓
Sends to background.js
        ↓
┌─────────────────────┐
│ 1. Regex Check      │ ← Fast (< 1ms)
│    (30+ patterns)   │
└─────────────────────┘
        ↓
  Sensitive?
    ├─ YES → Block & show overlay
    └─ NO  ↓
┌─────────────────────┐
│ 2. LLM Check        │ ← Accurate (optional)
│    (if enabled)     │
└─────────────────────┘
        ↓
  Sensitive?
    ├─ YES → Block & show overlay
    └─ NO  → Allow submission
```

## Optional: Legacy Backend Server

A Python backend is archived in `archive/python-backend/` for advanced use cases (image analysis):

```bash
cd archive/python-backend

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
| **403 Forbidden from Ollama** | Restart Ollama with CORS: `OLLAMA_ORIGINS="*" ollama serve` |
| LLM API timeout | Increase max_tokens or check model is loaded: `ollama list` |
| Settings not saving | Check Chrome storage permissions in `chrome://extensions/` |
| Multiple detections for same PII | This is expected - extension checks each submission independently |

### Common Ollama Issues

**Problem:** Getting 403 Forbidden error when testing connection

**Solution:**
```bash
# Stop Ollama
pkill ollama

# Restart with CORS enabled
OLLAMA_ORIGINS="*" ollama serve
```

**Problem:** Model not found

**Solution:**
```bash
# List installed models
ollama list

# Pull the model if missing
ollama pull llama3
```

**Problem:** Connection timeout

**Solution:**
- Reduce `max_tokens` in background.js (currently 10 for detection, 500 for modification)
- Use a faster model like `llama3:8b` instead of `llama3:70b`
- Check Ollama logs: `journalctl -u ollama -f` (Linux) or Console.app (Mac)

## Development

### Project Structure

- **Extension files**: `llm_prompt_checker/`
  - `manifest.json` - Extension configuration (29 lines)
  - `content.js` - DOM interaction and event interception (346 lines)
  - `background.js` - Detection logic and API calls (599 lines)
  - `popup.html` - Settings UI layout (425 lines)
  - `popup.js` - Settings logic (237 lines)
- **Archived backend** (optional): `archive/python-backend/`

### Recent Improvements (v1.1)

**Critical Fixes:**
1. ✅ **Fixed Regex Memory Leak** - Removed `/g` flag from stored patterns to prevent `lastIndex` issues
2. ✅ **Fixed Settings Race Condition** - Implemented thread-safe `SettingsManager` class
3. ✅ **Optimized Event Listeners** - Added proper attach/detach with dynamic enable/disable

**Performance:**
- Regex detection: < 1ms average
- Zero false negatives from pattern reuse
- Clean memory management with event listener cleanup

**Reliability:**
- Thread-safe settings across multiple tabs
- Real-time settings sync without page refresh
- Graceful degradation if LLM API unavailable

### Adding Support for New LLM Sites

To add more LLM websites, edit `llm_prompt_checker/manifest.json`:

```json
{
  "content_scripts": [
    {
      "matches": [
        "*://chat.openai.com/*",
        "*://claude.ai/*",
        "*://your-new-llm-site.com/*"  // Add here
      ],
      "js": ["content.js"]
    }
  ]
}
```

Then update `detectPlatform()` in `content.js`:

```javascript
function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('your-new-llm-site.com')) {
    return 'YourLLM';
  }
  // ... existing platforms
}
```

### Building and Testing

1. **Make changes** to extension files
2. **Reload extension** at `chrome://extensions/` (click reload icon)
3. **Test on LLM site** - Try entering: "My API key is sk-test123456789"
4. **Check console** - Use DevTools to see logs
5. **Verify metrics** - Click extension icon to view statistics

## Privacy & Security

### What Data is Collected?

**None.** The extension operates entirely on your local machine:

- ✅ All detection happens client-side
- ✅ No data sent to external servers (except your optional self-hosted LLM)
- ✅ Metrics stored locally in Chrome storage
- ✅ Settings synced only via Chrome's built-in sync
- ✅ No analytics, tracking, or telemetry

### What Permissions Are Required?

The extension requests these Chrome permissions:

| Permission | Why It's Needed |
|------------|----------------|
| `activeTab` | To read and intercept prompts on LLM websites |
| `storage` | To save settings and metrics locally |
| `<all_urls>` | To make API calls to your self-hosted LLM (optional) |

### Is My Sensitive Data Safe?

**Yes.** The extension is designed to **protect** your sensitive data:

1. **Detection only** - Sensitive data is identified but never stored or transmitted
2. **Local processing** - Regex detection runs entirely in your browser
3. **Optional LLM** - If enabled, only communicates with YOUR self-hosted instance
4. **Open source** - All code is visible and auditable in this repository
5. **No backend** - No company servers processing your data

## Technical Specifications

| Metric | Value |
|--------|-------|
| **Lines of Code** | 1,636 total |
| **Detection Patterns** | 30+ regex patterns |
| **Supported Sites** | 7 LLM platforms |
| **Detection Speed** | < 1ms (regex), ~100ms (LLM) |
| **Memory Usage** | < 5MB |
| **Manifest Version** | Chrome Extension v3 |

## Contributing

Contributions are welcome! Areas for improvement:

1. **Add more patterns** - New PII types or API key formats
2. **Support more LLM sites** - Add to manifest.json
3. **Improve detection accuracy** - Reduce false positives/negatives
4. **Enhance UI/UX** - Better overlay design or settings interface
5. **Add tests** - Unit tests for detection functions

To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on multiple LLM sites
5. Submit a pull request

## Roadmap

- [ ] Firefox extension support
- [ ] Configurable detection patterns via UI
- [ ] Whitelist for trusted data patterns
- [ ] Export/import settings
- [ ] Keyboard shortcuts for quick enable/disable
- [ ] Notification on detection (optional)
- [ ] Detection confidence scores
- [ ] Support for more languages (non-English PII formats)

## License

[Add license information here]

## Acknowledgments

- Built with Chrome Extension Manifest V3
- Regex patterns inspired by common secret scanning tools
- UI design influenced by modern dark theme aesthetics

---

**Made with ❤️ for privacy-conscious AI users**
