// LLM Prompt Sensitive Data Checker - Content Script
let checking = false;
let blockSubmission = false;

// Detect which platform we're on
function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
    return 'ChatGPT';
  } else if (hostname.includes('claude.ai')) {
    return 'Claude';
  } else if (hostname.includes('gemini.google.com')) {
    return 'Gemini';
  } else if (hostname.includes('perplexity.ai')) {
    return 'Perplexity';
  } else if (hostname.includes('bard.google.com')) {
    return 'Bard';
  } else {
    return 'Other';
  }
}

function showBlockingWarning(modifiedPrompt = null) {
  const existing = document.querySelector('.pii-blocker-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'pii-blocker-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.8);
    z-index: 9999999;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  const warningBox = document.createElement('div');
  warningBox.style.cssText = `
    background-color: #ff4444;
    color: white;
    padding: 32px 48px;
    border-radius: 16px;
    font-size: 18px;
    font-weight: bold;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    max-width: 600px;
    text-align: center;
  `;

  const icon = document.createElement('div');
  icon.style.cssText = 'font-size: 64px; margin-bottom: 16px;';
  icon.textContent = '🚫';
  warningBox.appendChild(icon);

  const title = document.createElement('div');
  title.style.cssText = 'font-size: 24px; margin-bottom: 16px;';
  title.textContent = 'SUBMISSION BLOCKED';
  warningBox.appendChild(title);

  const message = document.createElement('div');
  message.style.cssText = 'font-size: 16px; margin-bottom: 24px; font-weight: normal;';
  message.textContent = 'Sensitive/confidential data detected in your prompt. This data cannot be sent to the LLM.';
  warningBox.appendChild(message);

  if (modifiedPrompt) {
    const suggestedDiv = document.createElement('div');
    suggestedDiv.style.cssText = `
      background-color: #e8f5e9;
      color: #1b5e20;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: normal;
      margin-bottom: 24px;
      text-align: left;
      max-height: 150px;
      overflow-y: auto;
      border: 2px solid #4caf50;
    `;
    suggestedDiv.innerHTML = '<strong style="color: #2e7d32;">Suggested prompt:</strong><br>' + modifiedPrompt;
    warningBox.appendChild(suggestedDiv);
  }

  const dismissBtn = document.createElement('button');
  dismissBtn.style.cssText = `
    background-color: white;
    color: #ff4444;
    border: none;
    padding: 12px 32px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
  `;
  dismissBtn.textContent = 'I Understand - Edit My Prompt';
  dismissBtn.onclick = () => {
    overlay.remove();
    blockSubmission = false;
    clearPromptInput();
  };
  warningBox.appendChild(dismissBtn);

  overlay.appendChild(warningBox);
  document.body.appendChild(overlay);
  blockSubmission = true;
}

function clearPromptInput() {
  const selectors = ['#prompt-textarea', '.ProseMirror', '[contenteditable="true"]', 'textarea'];
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      if (el.value !== undefined) {
        el.value = '';
      } else {
        el.textContent = '';
        el.innerHTML = '';
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      break;
    }
  }
}

// Use Chrome messaging to communicate with background script
async function checkSensitiveData(text) {
  return new Promise((resolve) => {
    // Check if chrome.runtime is available (extension context may be invalidated)
    if (!chrome?.runtime?.sendMessage) {
      console.warn('PII Checker: Extension context invalidated. Please refresh the page.');
      resolve({ sensitive: false, modified_prompt: null });
      return;
    }

    try {
      const platform = detectPlatform();
      chrome.runtime.sendMessage(
        { action: 'checkSensitiveData', text: text, platform: platform },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('PII Checker: Message error', chrome.runtime.lastError);
            resolve({ sensitive: false, modified_prompt: null });
          } else {
            resolve(response || { sensitive: false, modified_prompt: null });
          }
        }
      );
    } catch (error) {
      console.error('PII Checker: Error sending message', error);
      resolve({ sensitive: false, modified_prompt: null });
    }
  });
}

function getPromptText() {
  const selectors = [
    '#prompt-textarea',
    '[data-id="root"] textarea',
    '.ProseMirror',
    '[contenteditable="true"]',
    '[enterkeyhint="enter"]',
    'textarea',
  ];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      const text = el.value || el.textContent || el.innerText;
      if (text && text.trim()) {
        return text.trim();
      }
    }
  }
  return '';
}

function isSendButton(element) {
  if (!element) return false;
  const btn = element.closest('button') || (element.tagName === 'BUTTON' ? element : null);
  if (!btn) return false;

  const testId = btn.getAttribute('data-testid') || '';
  const ariaLabel = btn.getAttribute('aria-label') || '';
  const className = btn.className || '';

  if (testId.includes('send') || testId.includes('submit')) return true;
  if (ariaLabel.toLowerCase().includes('send')) return true;
  if (className.includes('send') || className.includes('submit')) return true;

  const hasSvg = btn.querySelector('svg');
  const isNearTextarea = document.querySelector('#prompt-textarea, .ProseMirror, textarea');
  if (hasSvg && isNearTextarea && btn.type !== 'button') return true;

  return false;
}

// Intercept Enter key
document.addEventListener('keydown', async function(event) {
  if (blockSubmission) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }

  if (event.key !== 'Enter' || event.shiftKey) return;

  const target = event.target;
  const isInput = target.tagName === 'TEXTAREA' ||
                  target.tagName === 'INPUT' ||
                  target.isContentEditable ||
                  target.closest('[contenteditable="true"]') ||
                  target.closest('.ProseMirror');

  if (!isInput) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (checking) return;
  checking = true;

  const text = getPromptText();
  if (!text) {
    checking = false;
    return;
  }

  const result = await checkSensitiveData(text);
  checking = false;

  if (result.sensitive) {
    showBlockingWarning(result.modified_prompt);
  } else {
    const sendBtn = document.querySelector('button[data-testid="send-button"]') ||
                    document.querySelector('button[data-testid="composer-send-button"]') ||
                    document.querySelector('button[aria-label*="Send"]') ||
                    document.querySelector('form button[type="submit"]') ||
                    document.querySelector('button svg')?.closest('button');
    if (sendBtn) sendBtn.click();
  }
}, true);

// Intercept send button clicks
document.addEventListener('click', async function(event) {
  const target = event.target;

  // Allow clicks inside our overlay (dismiss button)
  if (target.closest('.pii-blocker-overlay')) {
    return; // Let the click through
  }

  if (blockSubmission) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
  const sendButton = isSendButton(target) ? (target.closest('button') || target) : null;
  if (!sendButton) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  if (checking) return;
  checking = true;

  const text = getPromptText();
  if (!text) {
    checking = false;
    sendButton.click();
    return;
  }

  const result = await checkSensitiveData(text);
  checking = false;

  if (result.sensitive) {
    showBlockingWarning(result.modified_prompt);
  } else {
    blockSubmission = false;
    setTimeout(() => sendButton.click(), 10);
  }
}, true);

// Intercept form submissions
document.addEventListener('submit', function(event) {
  if (blockSubmission) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return false;
  }
}, true);
