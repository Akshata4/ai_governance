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
  const status = document.getElementById('status');

  // Load saved settings
  chrome.storage.sync.get({
    enabled: true,
    useLlm: false,
    apiUrl: 'http://localhost:11434/v1/',
    apiKey: '123abc',
    modelName: 'llama3'
  }, (items) => {
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
});
