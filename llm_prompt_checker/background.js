// Background service worker - handles PII detection

// Default settings
let settings = {
  enabled: true,
  useLlm: false,
  apiUrl: 'http://localhost:11434/v1',
  apiKey: '',
  modelName: 'llama3'
};

// Default metrics
let metrics = {
  totalPromptsChecked: 0,
  totalPiiDetected: 0,
  piiByType: {},
  blockedSubmissions: 0,
  lastDetectionTime: null,
  sessionStart: Date.now()
};

// Track if settings are loaded
let settingsLoaded = false;
let settingsLoadPromise = null;

// Load settings on startup
function loadSettings() {
  if (settingsLoadPromise) {
    return settingsLoadPromise;
  }

  settingsLoadPromise = new Promise((resolve) => {
    chrome.storage.sync.get(settings, (items) => {
      settings = items;
      settingsLoaded = true;
      console.log('[PII Blocker] Settings loaded on startup:', {
        enabled: settings.enabled,
        useLlm: settings.useLlm,
        apiUrl: settings.apiUrl,
        modelName: settings.modelName,
        hasApiKey: !!settings.apiKey
      });
      resolve(settings);
    });
  });

  return settingsLoadPromise;
}

// Load metrics on startup
chrome.storage.local.get({ metrics: metrics }, (items) => {
  metrics = items.metrics;
  // Reset session start for new session
  metrics.sessionStart = Date.now();
});

// Initialize settings
loadSettings();

// Save metrics to storage
function saveMetrics() {
  chrome.storage.local.set({ metrics: metrics });
}

// Update metrics when PII is detected
function updateMetrics(detected, piiType = null) {
  metrics.totalPromptsChecked++;

  if (detected) {
    metrics.totalPiiDetected++;
    metrics.blockedSubmissions++;
    metrics.lastDetectionTime = Date.now();

    if (piiType) {
      metrics.piiByType[piiType] = (metrics.piiByType[piiType] || 0) + 1;
    }
  }

  saveMetrics();
}

// Listen for settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'settingsUpdated') {
    settings = request.settings;
    settingsLoaded = true;
    settingsLoadPromise = null; // Reset promise so next load gets fresh data
    console.log('[PII Blocker] Settings updated:', {
      enabled: settings.enabled,
      useLlm: settings.useLlm,
      apiUrl: settings.apiUrl,
      modelName: settings.modelName,
      hasApiKey: !!settings.apiKey
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'getMetrics') {
    sendResponse({ success: true, metrics: metrics });
    return true;
  }

  if (request.action === 'resetMetrics') {
    metrics = {
      totalPromptsChecked: 0,
      totalPiiDetected: 0,
      piiByType: {},
      blockedSubmissions: 0,
      lastDetectionTime: null,
      sessionStart: Date.now()
    };
    saveMetrics();
    sendResponse({ success: true, metrics: metrics });
    return true;
  }

  if (request.action === 'testConnection') {
    testLlmConnection(request.url, request.apiKey, request.model)
      .then(result => sendResponse(result))
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'testChatCompletion') {
    testChatCompletion(request.apiUrl, request.apiKey, request.model)
      .then(result => sendResponse(result))
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (request.action === 'checkSensitiveData') {
    if (!settings.enabled) {
      sendResponse({ sensitive: false, modified_prompt: null });
      return true;
    }

    checkSensitiveData(request.text)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('Background: Check error', error);
        sendResponse({ sensitive: false, modified_prompt: null, error: error.message });
      });
    return true; // Keep channel open for async response
  }
});

// Regex patterns for PII detection
const PII_PATTERNS = [
  // Personal Identifiers
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'SSN', replacement: '[REDACTED SSN]' },
  { pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, type: 'Credit Card', replacement: '[REDACTED CREDIT CARD]' },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, type: 'Phone', replacement: '[REDACTED PHONE]' },
  { pattern: /\b\d{9}-\d{1,2}\b/g, type: 'Routing Number', replacement: '[REDACTED ROUTING]' },
  { pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/gi, type: 'PAN Card', replacement: '[REDACTED PAN]' },

  // AWS Keys
  { pattern: /\bAKIA[0-9A-Z]{16}\b/g, type: 'AWS Access Key', replacement: '[REDACTED AWS KEY]' },
  { pattern: /\b[A-Za-z0-9/+=]{40}\b/g, type: 'AWS Secret Key', replacement: '[REDACTED AWS SECRET]' },

  // GitHub Tokens
  { pattern: /\bghp_[A-Za-z0-9]{36,}\b/g, type: 'GitHub PAT', replacement: '[REDACTED GITHUB TOKEN]' },
  { pattern: /\bgho_[A-Za-z0-9]{36,}\b/g, type: 'GitHub OAuth', replacement: '[REDACTED GITHUB TOKEN]' },
  { pattern: /\bghu_[A-Za-z0-9]{36,}\b/g, type: 'GitHub User Token', replacement: '[REDACTED GITHUB TOKEN]' },
  { pattern: /\bghs_[A-Za-z0-9]{36,}\b/g, type: 'GitHub Server Token', replacement: '[REDACTED GITHUB TOKEN]' },
  { pattern: /\bghr_[A-Za-z0-9]{36,}\b/g, type: 'GitHub Refresh Token', replacement: '[REDACTED GITHUB TOKEN]' },

  // OpenAI API Keys
  { pattern: /\bsk-[A-Za-z0-9]{20,}\b/g, type: 'OpenAI API Key', replacement: '[REDACTED OPENAI KEY]' },

  // Anthropic API Keys
  { pattern: /\bsk-ant-[A-Za-z0-9-]{20,}\b/g, type: 'Anthropic API Key', replacement: '[REDACTED ANTHROPIC KEY]' },

  // Stripe Keys
  { pattern: /\bsk_live_[A-Za-z0-9]{20,}\b/g, type: 'Stripe Live Secret', replacement: '[REDACTED STRIPE KEY]' },
  { pattern: /\bsk_test_[A-Za-z0-9]{20,}\b/g, type: 'Stripe Test Secret', replacement: '[REDACTED STRIPE KEY]' },
  { pattern: /\bpk_live_[A-Za-z0-9]{20,}\b/g, type: 'Stripe Live Publishable', replacement: '[REDACTED STRIPE KEY]' },
  { pattern: /\bpk_test_[A-Za-z0-9]{20,}\b/g, type: 'Stripe Test Publishable', replacement: '[REDACTED STRIPE KEY]' },

  // Google API Keys
  { pattern: /\bAIza[A-Za-z0-9_-]{35}\b/g, type: 'Google API Key', replacement: '[REDACTED GOOGLE KEY]' },

  // Slack Tokens
  { pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, type: 'Slack Token', replacement: '[REDACTED SLACK TOKEN]' },

  // Discord Tokens
  { pattern: /\b[MN][A-Za-z0-9]{23,}\.[A-Za-z0-9-_]{6}\.[A-Za-z0-9-_]{27}\b/g, type: 'Discord Token', replacement: '[REDACTED DISCORD TOKEN]' },

  // Twilio
  { pattern: /\bSK[A-Za-z0-9]{32}\b/g, type: 'Twilio API Key', replacement: '[REDACTED TWILIO KEY]' },

  // SendGrid
  { pattern: /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g, type: 'SendGrid API Key', replacement: '[REDACTED SENDGRID KEY]' },

  // Mailchimp
  { pattern: /\b[A-Za-z0-9]{32}-us\d{1,2}\b/g, type: 'Mailchimp API Key', replacement: '[REDACTED MAILCHIMP KEY]' },

  // npm tokens
  { pattern: /\bnpm_[A-Za-z0-9]{36}\b/g, type: 'npm Token', replacement: '[REDACTED NPM TOKEN]' },

  // PyPI tokens
  { pattern: /\bpypi-[A-Za-z0-9_-]{50,}\b/g, type: 'PyPI Token', replacement: '[REDACTED PYPI TOKEN]' },

  // Private Keys
  { pattern: /-----BEGIN\s+(RSA|DSA|EC|OPENSSH|PGP)?\s*PRIVATE KEY-----/gi, type: 'Private Key', replacement: '[REDACTED PRIVATE KEY]' },

  // JWT Tokens (basic pattern)
  { pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, type: 'JWT Token', replacement: '[REDACTED JWT]' },

  // Generic API Key patterns (fallback - more conservative)
  { pattern: /\b(?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token|secret[_-]?key)[=:]["']?([A-Za-z0-9_-]{20,})["']?/gi, type: 'Generic API Key', replacement: '[REDACTED API KEY]' },

  // Bearer tokens in headers
  { pattern: /\bBearer\s+[A-Za-z0-9_-]{20,}\b/gi, type: 'Bearer Token', replacement: 'Bearer [REDACTED TOKEN]' },

  // Database connection strings
  { pattern: /\b(mongodb|mysql|postgres|postgresql|redis):\/\/[^\s"']+/gi, type: 'Database URL', replacement: '[REDACTED DATABASE URL]' },
];

// Check for sensitive data using regex
function checkRegex(text) {
  for (const { pattern, type } of PII_PATTERNS) {
    pattern.lastIndex = 0; // Reset regex
    if (pattern.test(text)) {
      return { sensitive: true, type };
    }
  }
  return { sensitive: false };
}

// Redact sensitive data from text
function redactSensitiveData(text) {
  let redacted = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    pattern.lastIndex = 0;
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

// Normalize API URL to ensure it ends with /chat/completions
function getChatCompletionsUrl(baseUrl) {
  let url = baseUrl.trim();
  // Remove trailing slash
  url = url.replace(/\/+$/, '');
  // If it already ends with /chat/completions, return as is
  if (url.endsWith('/chat/completions')) {
    return url;
  }
  // If it ends with /v1, append /chat/completions
  if (url.endsWith('/v1')) {
    return url + '/chat/completions';
  }
  // Otherwise append /chat/completions
  return url + '/chat/completions';
}

// Check using LLM (OpenAI compatible format)
async function checkWithLlm(text) {
  const systemPrompt = `You are a security expert. Determine if the following text contains sensitive information such as Social Security numbers, phone numbers, addresses, PAN card numbers, credit card numbers, bank account numbers, API keys, passwords, or other confidential data. Do NOT flag personal names or generic emails as sensitive. Answer only 'yes' or 'no'.`;

  console.log('[PII Blocker] checkWithLlm called:', {
    apiKeyType: typeof settings.apiKey,
    apiKeyValue: settings.apiKey,
    apiKeyLength: settings.apiKey ? settings.apiKey.length : 0,
    isEmpty: !settings.apiKey || settings.apiKey.trim().length === 0,
    apiUrl: settings.apiUrl,
    modelName: settings.modelName
  });

  let headers = { 'Content-Type': 'application/json' };

  // Only add Authorization header if API key exists and is not empty
  // Note: Ollama does not require auth and will reject requests with Authorization header (403)
  if (settings.apiKey && typeof settings.apiKey === 'string' && settings.apiKey.trim().length > 0) {
    console.log('[PII Blocker] checkWithLlm: Adding Authorization header');
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  } else {
    console.log('[PII Blocker] checkWithLlm: Skipping Authorization header (Ollama mode)');
  }

  const body = JSON.stringify({
    model: settings.modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ],
    max_tokens: 10,
    temperature: 0
  });

  const apiUrl = getChatCompletionsUrl(settings.apiUrl);
  console.log('[PII Blocker] Calling LLM API:', {
    url: apiUrl,
    hasAuth: !!headers['Authorization'],
    model: settings.modelName
  });

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: body
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error response');
    console.error('[PII Blocker] LLM API error:', {
      status: response.status,
      statusText: response.statusText,
      url: apiUrl,
      errorBody: errorText,
      hasAuth: !!headers['Authorization']
    });
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim().toLowerCase() || '';

  return answer === 'yes';
}

// Get modified prompt using LLM (OpenAI compatible format)
async function getModifiedPrompt(text) {
  if (!settings.useLlm) {
    // Use regex redaction as fallback
    return redactSensitiveData(text);
  }

  const systemPrompt = `You are a prompt sanitizer. Rewrite the user's prompt to remove any sensitive data. If the request can be fulfilled without the sensitive information, rewrite it without the data. If the sensitive data is essential, politely ask the user to use official services instead. Keep the rewrite concise. Do not include any sensitive data in your response.`;

  console.log('[PII Blocker] getModifiedPrompt called:', {
    apiKeyType: typeof settings.apiKey,
    apiKeyValue: settings.apiKey,
    apiKeyLength: settings.apiKey ? settings.apiKey.length : 0,
    isEmpty: !settings.apiKey || settings.apiKey.trim().length === 0,
    apiUrl: settings.apiUrl,
    modelName: settings.modelName,
    useLlm: settings.useLlm
  });

  let headers = { 'Content-Type': 'application/json' };

  // Only add Authorization header if API key exists and is not empty
  // Note: Ollama does not require auth and will reject requests with Authorization header (403)
  if (settings.apiKey && typeof settings.apiKey === 'string' && settings.apiKey.trim().length > 0) {
    console.log('[PII Blocker] getModifiedPrompt: Adding Authorization header');
    headers['Authorization'] = `Bearer ${settings.apiKey}`;
  } else {
    console.log('[PII Blocker] getModifiedPrompt: Skipping Authorization header (Ollama mode)');
  }

  const body = JSON.stringify({
    model: settings.modelName,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ],
    max_tokens: 500,
    temperature: 0.3
  });

  try {
    const apiUrl = getChatCompletionsUrl(settings.apiUrl);
    console.log('[PII Blocker] Calling LLM API for prompt modification:', {
      url: apiUrl,
      hasAuth: !!headers['Authorization'],
      model: settings.modelName
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: body
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response');
      console.error('[PII Blocker] LLM API error in getModifiedPrompt:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        errorBody: errorText,
        hasAuth: !!headers['Authorization']
      });
      throw new Error(`LLM API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || redactSensitiveData(text);
  } catch (error) {
    console.warn('LLM unavailable, using regex redaction:', error.message);
    return redactSensitiveData(text);
  }
}

// Test chat completion endpoint directly
async function testChatCompletion(baseUrl, apiKey, model) {
  const headers = { 'Content-Type': 'application/json' };

  console.log('[PII Blocker] testChatCompletion - API key check:', {
    apiKeyType: typeof apiKey,
    apiKeyValue: apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    isEmpty: !apiKey || apiKey.trim().length === 0
  });

  // Only add Authorization header if API key exists and is not empty
  // Ollama does NOT require auth and will reject requests with Authorization header (403)
  if (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0) {
    console.log('[PII Blocker] Adding Authorization header');
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else {
    console.log('[PII Blocker] Skipping Authorization header (no API key or empty)');
  }

  const chatUrl = getChatCompletionsUrl(baseUrl);

  const body = JSON.stringify({
    model: model,
    messages: [
      { role: 'system', content: 'You are a test assistant.' },
      { role: 'user', content: 'Say "OK" if you can read this.' }
    ],
    max_tokens: 10,
    temperature: 0
  });

  console.log('[PII Blocker] Testing chat completion endpoint:', {
    url: chatUrl,
    model: model,
    headers: headers,
    hasAuth: !!headers['Authorization']
  });

  try {
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: headers,
      body: body,
      mode: 'cors',
      credentials: 'omit'
    });

    console.log('[PII Blocker] Fetch response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()])
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error');
      console.error('[PII Blocker] Chat completion test failed:', {
        status: response.status,
        statusText: response.statusText,
        errorBody: errorText,
        responseHeaders: Object.fromEntries([...response.headers.entries()]),
        hasAuth: !!headers['Authorization']
      });
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: errorText
      };
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    console.log('[PII Blocker] Chat completion test succeeded:', {
      response: responseText,
      model: data.model
    });

    return {
      success: true,
      message: 'Chat completion endpoint working!',
      response: responseText,
      modelUsed: data.model
    };
  } catch (error) {
    console.error('[PII Blocker] Chat completion test exception:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test LLM connection - prefer calling /models to verify model existence
async function testLlmConnection(url, apiKey, model) {
  // Try GET /models first (url should already include /models from the popup)
  const headers = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Support different response shapes: { data: [...] } or { models: [...] }
    const modelsList = data.data || data.models || [];
    const modelIds = modelsList.map(m => m.id || m.model || m.name).filter(Boolean);

    const found = modelIds.some(id => id === model || id.startsWith(model) || id.includes(model));

    if (found) {
      return { success: true, models: modelIds, modelFound: true };
    } else {
      return { success: false, models: modelIds, modelFound: false, error: `Model '${model}' not found` };
    }
  } catch (getError) {
    // Fallback: try POST-based test to check the API is reachable (compat for chat endpoints)
    const base = url.replace(/\/models\/?$/i, '');

    const tryPost = async (postUrl) => {
      const body = JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Say "OK" if you can read this.' }],
        max_tokens: 10
      });

      const postHeaders = { 'Content-Type': 'application/json' };
      if (apiKey) postHeaders['Authorization'] = `Bearer ${apiKey}`;

      const resp = await fetch(postUrl, { method: 'POST', headers: postHeaders, body });
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${errorText}`);
      }
      return await resp.json();
    };

    try {
      // Try POST to the base URL first, then fall back to common path
      let data = await tryPost(base).catch(() => tryPost(base.replace(/\/$/, '') + '/chat/completions'));
      // If POST succeeds we can't verify model list, but the API is reachable and model likely accepted
      return { success: true, modelFound: true, note: 'Fallback POST succeeded (models list unavailable)', data };
    } catch (postError) {
      return { success: false, error: `GET error: ${getError.message}; POST error: ${postError.message}` };
    }
  }
}

// Main check function
async function checkSensitiveData(text) {
  // Ensure settings are loaded before processing
  if (!settingsLoaded) {
    await loadSettings();
  }

  // First, check with regex (fast)
  const regexResult = checkRegex(text);

  if (regexResult.sensitive) {
    // Definitely sensitive, get modified prompt
    const modified_prompt = await getModifiedPrompt(text);
    // Update metrics with detected PII type
    updateMetrics(true, regexResult.type);
    return { sensitive: true, modified_prompt, detectedType: regexResult.type };
  }

  // If LLM is enabled, also check with LLM for more nuanced detection
  if (settings.useLlm) {
    try {
      const llmSensitive = await checkWithLlm(text);
      if (llmSensitive) {
        const modified_prompt = await getModifiedPrompt(text);
        // Update metrics - LLM detected something regex didn't
        updateMetrics(true, 'AI Detected');
        return { sensitive: true, modified_prompt, detectedType: 'AI Detected' };
      }
    } catch (error) {
      console.error('LLM check failed, falling back to regex only:', error);
      // If LLM fails, we already did regex check
    }
  }

  // No sensitive data detected, still update metrics for prompts checked
  updateMetrics(false);
  return { sensitive: false, modified_prompt: null };
}
