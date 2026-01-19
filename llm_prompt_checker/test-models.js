// Simple /models endpoint test script
// Usage: node test-models.js

const CONFIG = {
  modelsUrl: 'http://localhost:11434/v1/models',
  apiKey: '', // set if needed
  modelName: 'llama3'
};

async function testModels() {
  console.log('=== Models Endpoint Test ===');
  console.log('URL:', CONFIG.modelsUrl);
  console.log('Model to verify:', CONFIG.modelName);
  console.log('');

  const headers = {};
  if (CONFIG.apiKey) headers['Authorization'] = `Bearer ${CONFIG.apiKey}`;

  try {
    const res = await fetch(CONFIG.modelsUrl, { method: 'GET', headers });
    console.log('Status:', res.status, res.statusText);
    if (!res.ok) {
      const txt = await res.text();
      console.error('ERROR: Request failed:', txt);
      return;
    }

    const data = await res.json();
    console.log('Response JSON keys:', Object.keys(data));

    const modelsList = data.data || data.models || [];
    const modelIds = modelsList.map(m => m.id || m.model || m.name).filter(Boolean);

    console.log('Available models:', modelIds.join(', ') || '(none)');

    const found = modelIds.some(id => id === CONFIG.modelName || id.startsWith(CONFIG.modelName) || id.includes(CONFIG.modelName));

    if (found) {
      console.log('SUCCESS: Model found ✅');
    } else {
      console.warn('Model not found ⚠️');
    }
  } catch (err) {
    console.error('ERROR: Connection failed', err.message);
  }
}

// Node's fetch is available in modern Node; if not, user can run in browser console.
if (typeof fetch === 'undefined') {
  console.error('This script requires Node (v18+) with fetch support, or run it in a browser console.');
} else {
  testModels();
}
