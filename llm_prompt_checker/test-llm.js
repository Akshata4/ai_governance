// Simple LLM connection test script
// Run in browser console or with Node.js (requires node-fetch for Node < 18)

const CONFIG = {
  apiUrl: 'http://localhost:11434/v1/chat/completions',
  apiKey: '', // Leave empty for local LLMs
  modelName: 'llama3'
};

async function testConnection() {
  console.log('=== LLM Connection Test ===');
  console.log('URL:', CONFIG.apiUrl);
  console.log('Model:', CONFIG.modelName);
  console.log('');

  const headers = { 'Content-Type': 'application/json' };
  if (CONFIG.apiKey) {
    headers['Authorization'] = `Bearer ${CONFIG.apiKey}`;
  }

  const body = {
    model: CONFIG.modelName,
    messages: [{ role: 'user', content: 'Say "OK" if you can read this.' }],
    max_tokens: 10
  };

  console.log('Request body:', JSON.stringify(body, null, 2));
  console.log('');

  try {
    console.log('Sending request...');
    const startTime = Date.now();

    const response = await fetch(CONFIG.apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    const elapsed = Date.now() - startTime;
    console.log(`Response received in ${elapsed}ms`);
    console.log('Status:', response.status, response.statusText);
    console.log('');

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ERROR: Request failed');
      console.error('Response body:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Response JSON:', JSON.stringify(data, null, 2));
    console.log('');

    // Extract the message content
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      console.log('SUCCESS! LLM Response:', content);
    } else {
      console.warn('WARNING: Could not extract message content from response');
      console.log('Full response structure:', Object.keys(data));
    }

  } catch (error) {
    console.error('ERROR: Connection failed');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);

    if (error.message.includes('fetch')) {
      console.log('');
      console.log('Possible causes:');
      console.log('1. LLM server is not running');
      console.log('2. Wrong URL or port');
      console.log('3. CORS issue (if running in browser)');
    }
  }
}

// Run the test
testConnection();
