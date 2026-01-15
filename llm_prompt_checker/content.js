console.log('LLM Checker extension loaded on:', window.location.href);

function showWarning(input, source = 'prompt', modifiedPrompt = null) {
  // Remove existing warning if any
  const existing = input.parentNode.querySelector('.sensitive-warning');
  if (existing) existing.remove();

  // Create warning div
  const warning = document.createElement('div');
  warning.className = 'sensitive-warning';
  warning.style.cssText = `
    background-color: #ff4444;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 8px;
  `;

  const message = document.createElement('div');
  message.textContent = `⚠️ Warning: Sensitive data detected in your ${source}!`;
  warning.appendChild(message);

  if (modifiedPrompt && source === 'prompt') {
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      align-items: center;
      margin-top: 4px;
    `;

    const modifiedDiv = document.createElement('div');
    modifiedDiv.style.cssText = `
      background-color: #f0f0f0;
      color: black;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      word-wrap: break-word;
      flex: 1;
    `;
    modifiedDiv.textContent = `Suggested: ${modifiedPrompt}`;

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.style.cssText = `
      margin-left: 8px;
      padding: 2px 6px;
      font-size: 10px;
      background-color: #ddd;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      color: black;
    `;
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(modifiedPrompt);
    });

    container.appendChild(modifiedDiv);
    container.appendChild(copyButton);
    warning.appendChild(container);
  }

  // Insert before the input
  input.parentNode.insertBefore(warning, input);

  // Auto-hide after 10 seconds if no action
  setTimeout(() => {
    if (warning.parentNode) warning.remove();
  }, 10000);
}

// Monitor input elements for LLM prompts
async function checkSensitiveData(text, imageData = null) {
  try {
    const payload = { text };
    if (imageData) {
      payload.image = imageData;
    }
    const response = await fetch('http://127.0.0.1:8000/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    console.log('Server response:', result, 'for payload:', payload);
    return result;
  } catch (error) {
    console.error('Error checking sensitive data:', error);
    return { sensitive: false, modified_prompt: null }; // Fallback
  }
}

async function getImageData(input) {
  const imgs = input.querySelectorAll('img');
  console.log('Found imgs in input:', imgs.length);
  if (imgs.length > 0) {
    // For simplicity, take the first image's src
    const img = imgs[0];
    const src = img.src;
    console.log('Img src starts with:', src.substring(0, 20));
    if (src.startsWith('data:image/')) {
      // Extract base64
      return src.split(',')[1];
    } else if (src.startsWith('blob:')) {
      // Fetch blob and convert to base64
      try {
        const response = await fetch(src);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error('Error fetching blob:', e);
        return null;
      }
    }
  }
  return null;
}

async function checkInput(input) {
  const text = input.tagName === 'TEXTAREA' || input.type === 'text' ? input.value : input.textContent;
  const imageData = await getImageData(input);
  console.log('Checking input, text length:', text.length, 'image:', imageData ? 'yes (' + imageData.substring(0, 20) + '...)' : 'no');
  const source = imageData ? 'attachment' : 'prompt';
  const result = await checkSensitiveData(text, imageData);
  if (result.sensitive) {
    showWarning(input, source, result.modified_prompt);
  }
}

function monitorInputs() {
  const inputs = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
  console.log('Found inputs:', inputs.length);
  inputs.forEach((input, index) => {
    console.log(`Monitoring input ${index}:`, input.tagName, input.className);
    if (!input.hasAttribute('data-monitored')) {
      input.setAttribute('data-monitored', 'true');

      let checking = false;
      input.addEventListener('keydown', async function(event) {
        if (checking) return;
        if (event.key === 'Enter') {
          event.preventDefault();
          checking = true;
          const text = input.tagName === 'TEXTAREA' || input.type === 'text' ? input.value : input.textContent;
          const result = await checkSensitiveData(text);
          checking = false;
          if (result.sensitive) {
            showWarning(input, 'prompt', result.modified_prompt);
          } else {
            // Allow submission by re-dispatching the event
            input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
          }
        }
      });

    }
  });
}

      input.addEventListener('keydown', async function(event) {
        if (event.key === 'Enter') {
          const text = input.tagName === 'TEXTAREA' || input.type === 'text' ? input.value : input.textContent;
          const imageData = await getImageData(input);
          const source = imageData ? 'attachment' : 'prompt';
          const result = await checkSensitiveData(text, imageData);
          if (result.sensitive) {
            event.preventDefault();
            showWarning(input, source, result.modified_prompt);
          }
        }
      });

      // Also listen for paste events to catch image pastes
      input.addEventListener('paste', async function() {
        console.log('Paste event triggered');
        // Wait a bit for the image to be inserted
        setTimeout(async () => {
          await checkInput(input);
        }, 100);
      });
// Run immediately and observe for new elements
monitorInputs();
const observer = new MutationObserver(monitorInputs);
observer.observe(document.body, { childList: true, subtree: true });

