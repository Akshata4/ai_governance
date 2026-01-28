// Popup settings logic

document.addEventListener('DOMContentLoaded', () => {
  const enabledToggle = document.getElementById('enabled');
  const useLlmToggle = document.getElementById('useLlm');
  const llmSettings = document.getElementById('llmConfig');
  const apiUrl = document.getElementById('apiUrl');
  const apiKey = document.getElementById('apiKey');
  const modelName = document.getElementById('modelName');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const testChatBtn = document.getElementById('testChatBtn');
  const clearApiKeyBtn = document.getElementById('clearApiKeyBtn');
  const status = document.getElementById('status');

  // Metrics elements
  const totalChecked = document.getElementById('totalChecked');
  const totalBlocked = document.getElementById('totalBlocked');
  const piiTypesList = document.getElementById('piiTypesList');
  const lastDetection = document.getElementById('lastDetection');
  const resetMetricsBtn = document.getElementById('resetMetrics');

  // Load and display metrics
  loadMetrics();

  // Load saved settings
  chrome.storage.sync.get({
    enabled: true,
    useLlm: false,
    apiUrl: 'http://localhost:11434/v1/',
    apiKey: '',
    modelName: 'llama3'
  }, (items) => {
    console.log('[PII Blocker Popup] Loaded settings from storage:', {
      enabled: items.enabled,
      useLlm: items.useLlm,
      apiUrl: items.apiUrl,
      apiKey: items.apiKey ? `[${items.apiKey.length} chars]: "${items.apiKey}"` : '[EMPTY]',
      modelName: items.modelName
    });

    enabledToggle.checked = items.enabled;
    useLlmToggle.checked = items.useLlm;
    apiUrl.value = items.apiUrl;
    apiKey.value = items.apiKey;
    modelName.value = items.modelName;

    // Show/hide LLM settings
    llmSettings.classList.toggle('active', items.useLlm);
  });

  // Toggle LLM settings visibility
  useLlmToggle.addEventListener('change', () => {
    llmSettings.classList.toggle('active', useLlmToggle.checked);
  });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const settings = {
      enabled: enabledToggle.checked,
      useLlm: useLlmToggle.checked,
      apiUrl: apiUrl.value.trim(),
      apiKey: apiKey.value.trim(),
      modelName: modelName.value.trim()
    };

    console.log('[PII Blocker Popup] Saving settings:', {
      enabled: settings.enabled,
      useLlm: settings.useLlm,
      apiUrl: settings.apiUrl,
      apiKey: settings.apiKey ? `[${settings.apiKey.length} chars]: "${settings.apiKey}"` : '[EMPTY]',
      modelName: settings.modelName
    });

    chrome.storage.sync.set(settings, () => {
      showStatus('Settings saved!', 'success');

      // Notify background script of settings change
      chrome.runtime.sendMessage({ action: 'settingsUpdated', settings });
    });
  });

  // Test connection
  testBtn.addEventListener('click', async () => {
    if (!useLlmToggle.checked) {
      showStatus('LLM is disabled. Enable it to test connection.', 'error');
      return;
    }

    const url = apiUrl.value.trim() + '/models';
    const key = apiKey.value.trim();
    const model = modelName.value.trim();

    if (!url || !model) {
      showStatus('Please enter API URL and Model Name', 'error');
      return;
    }

    showStatus('Testing connection...', 'success');

    try {
      const response = await testLlmConnection(url, key, model);
      if (response.success) {
        showStatus('Connection successful! LLM is working.', 'success');
      } else {
        showStatus('Connection failed: ' + response.error, 'error');
      }
    } catch (error) {
      showStatus('Connection failed: ' + error.message, 'error');
    }
  });

  // Test chat completions endpoint
  testChatBtn.addEventListener('click', async () => {
    if (!useLlmToggle.checked) {
      showStatus('LLM is disabled. Enable it to test.', 'error');
      return;
    }

    const url = apiUrl.value.trim();
    const key = apiKey.value.trim();
    const model = modelName.value.trim();

    console.log('[PII Blocker Popup] Testing chat endpoint with:', {
      url: url,
      apiKey: key ? `[${key.length} chars]: "${key}"` : '[EMPTY]',
      model: model
    });

    if (!url || !model) {
      showStatus('Please enter API URL and Model Name', 'error');
      return;
    }

    showStatus('Testing chat completions endpoint...', 'success');

    try {
      const response = await testChatCompletion(url, key, model);
      if (response.success) {
        showStatus(`Chat endpoint working! Response: "${response.response}"`, 'success');
      } else {
        showStatus('Chat endpoint failed: ' + response.error + (response.details ? ' - ' + response.details : ''), 'error');
      }
    } catch (error) {
      showStatus('Chat endpoint failed: ' + error.message, 'error');
    }
  });

  // Force clear API key
  clearApiKeyBtn.addEventListener('click', () => {
    console.log('[PII Blocker Popup] Force clearing API key');
    apiKey.value = '';

    chrome.storage.sync.set({ apiKey: '' }, () => {
      showStatus('API key cleared! Click Save Settings to apply.', 'success');

      // Notify background script
      chrome.runtime.sendMessage({
        action: 'settingsUpdated',
        settings: {
          enabled: enabledToggle.checked,
          useLlm: useLlmToggle.checked,
          apiUrl: apiUrl.value.trim(),
          apiKey: '',
          modelName: modelName.value.trim()
        }
      });
    });
  });

  function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;

    if (type === 'success') {
      setTimeout(() => {
        status.className = 'status';
      }, 3000);
    }
  }

  // Test connection via background script (avoids CORS issues)
  function testLlmConnection(url, key, model) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'testConnection', url: url, apiKey: key, model: model },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { success: false, error: 'No response from background script' });
          }
        }
      );
    });
  }

  // Test chat completion endpoint via background script
  function testChatCompletion(apiUrl, key, model) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: 'testChatCompletion', apiUrl: apiUrl, apiKey: key, model: model },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { success: false, error: 'No response from background script' });
          }
        }
      );
    });
  }

  // Load and display metrics
  function loadMetrics() {
    chrome.runtime.sendMessage({ action: 'getMetrics' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        return;
      }

      const metrics = response.metrics;
      updateMetricsDisplay(metrics);
    });
  }

  // Update the metrics display
  function updateMetricsDisplay(metrics) {
    totalChecked.textContent = metrics.totalPromptsChecked || 0;
    totalBlocked.textContent = metrics.totalPiiDetected || 0;

    // Update PII breakdown
    const piiByType = metrics.piiByType || {};
    const types = Object.keys(piiByType);

    if (types.length > 0) {
      piiTypesList.innerHTML = types
        .sort((a, b) => piiByType[b] - piiByType[a])
        .map(type => `
          <div class="pii-type">
            <span class="pii-type-name">${type}</span>
            <span class="pii-type-count">${piiByType[type]}</span>
          </div>
        `)
        .join('');
    } else {
      piiTypesList.innerHTML = `
        <div class="pii-type">
          <span class="pii-type-name">No detections yet</span>
        </div>
      `;
    }

    // Update last detection time
    if (metrics.lastDetectionTime) {
      const date = new Date(metrics.lastDetectionTime);
      lastDetection.textContent = `Last detection: ${formatTimeAgo(date)}`;
    } else {
      lastDetection.textContent = 'No detections recorded';
    }
  }

  // Format time ago
  function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  // Reset metrics
  resetMetricsBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all metrics?')) {
      chrome.runtime.sendMessage({ action: 'resetMetrics' }, (response) => {
        if (response && response.success) {
          updateMetricsDisplay(response.metrics);
          showStatus('Metrics reset!', 'success');
        }
      });
    }
  });
});
