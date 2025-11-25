console.log('LLM Checker extension loaded on:', window.location.href);

function showWarning(input) {
  // Remove existing warning if any
  const existing = input.parentNode.querySelector('.sensitive-warning');
  if (existing) existing.remove();

  // Create warning div
  const warning = document.createElement('div');
  warning.className = 'sensitive-warning';
  warning.textContent = '⚠️ Warning: Sensitive data detected in your prompt!';
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
  `;

  // Insert before the input
  input.parentNode.insertBefore(warning, input);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (warning.parentNode) warning.remove();
  }, 5000);
}

// Monitor input elements for LLM prompts
async function checkSensitiveData(text) {
  try {
    const response = await fetch('http://127.0.0.1:8000/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const result = await response.json();
    console.log('Server response:', result);
    return result.sensitive;
  } catch (error) {
    console.error('Error checking sensitive data:', error);
    return false; // Fallback to false if server down
  }
}

function monitorInputs() {
  const inputs = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
  console.log('Found inputs:', inputs.length);
  inputs.forEach((input, index) => {
    console.log(`Monitoring input ${index}:`, input.tagName, input.className);
    if (!input.hasAttribute('data-monitored')) {
      input.setAttribute('data-monitored', 'true');
      input.addEventListener('input', async function() {
        const text = input.tagName === 'TEXTAREA' || input.type === 'text' ? input.value : input.textContent;
        console.log('Input event triggered, text:', text);
        if (await checkSensitiveData(text)) {
          showWarning(input);
        }
      });
    }
  });
}

// Run immediately and observe for new elements
monitorInputs();
const observer = new MutationObserver(monitorInputs);
observer.observe(document.body, { childList: true, subtree: true });

