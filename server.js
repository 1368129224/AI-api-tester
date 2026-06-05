// Copyright (C) 2024 zooter
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const path = require('path');

const app = express();
const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT) || 55443;
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS) || 60000;

// Limit request body size to prevent abuse
app.use(express.json({ limit: '1mb' }));

// Serve static files from 'dist' in production, otherwise 'public'
const isProd = process.env.NODE_ENV === 'production';
const staticDir = isProd ? path.join(__dirname, 'dist') : path.join(__dirname, 'public');
app.use(express.static(staticDir));

// API Configurations for different providers
const API_CONFIGS = {
  openai: {
    modelEndpoint: '/models',
    chatEndpoint: '/chat/completions',
    apiKeyHeader: 'Authorization',
    apiKeyPrefix: 'Bearer ',
  },
  anthropic: {
    modelEndpoint: '/v1/models', // Anthropic has a /v1/models endpoint, but it's not a list, so we'll simulate.
    chatEndpoint: '/v1/messages',
    apiKeyHeader: 'x-api-key',
    apiKeyPrefix: '',
    versionHeader: 'anthropic-version',
    apiVersion: '2023-06-01',
  },
  gemini: {
    modelEndpoint: '/models', // Gemini has /models, but requires model name in path
    chatEndpoint: '/models/{model}:generateContent', // Placeholder for model in path
    apiKeyHeader: 'x-goog-api-key',
    apiKeyPrefix: '',
  },
  custom: { // Default for custom or unknown types, assumes OpenAI compatibility
    modelEndpoint: '/models',
    chatEndpoint: '/chat/completions',
    apiKeyHeader: 'Authorization',
    apiKeyPrefix: 'Bearer ',
  }
};

function normalizeBase(baseUrl) {
  return baseUrl.replace(/\/+$/, '');
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithFallback(baseUrl, endpoint, options) {
  const base = normalizeBase(baseUrl);
  let response = await fetchWithTimeout(`${base}${endpoint}`, options);

  // If the first attempt fails with a 404, and the baseUrl doesn't already end with /v1, try adding it.
  if (response.status === 404 && !base.endsWith('/v1')) {
    response = await fetchWithTimeout(`${base}/v1${endpoint}`, options);
  }

  return response;
}


function buildHeaders(config, apiKey) {
  const headers = {
    'Content-Type': 'application/json',
    // Add a standard browser User-Agent to prevent WAFs (like NVIDIA's) from blocking the request
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  };
  if (config.apiKeyHeader && apiKey) {
    headers[config.apiKeyHeader] = `${config.apiKeyPrefix}${apiKey}`;
  }
  if (config.versionHeader && config.apiVersion) {
    headers[config.versionHeader] = config.apiVersion;
  }
  return headers;
}


app.post('/api/models', async (req, res) => {
  const { apiType, baseUrl, apiKey } = req.body;
  if (!apiType || !baseUrl || !apiKey) {
    return res.status(400).json({ error: 'Missing apiType, baseUrl, or apiKey' });
  }

  const config = API_CONFIGS[apiType] || API_CONFIGS.custom;
  const headers = buildHeaders(config, apiKey);

  try {
    if (apiType === 'anthropic') {
      // Try fetching models from the API first; fall back to a static list.
      try {
        const response = await fetchWithTimeout(`${normalizeBase(baseUrl)}/v1/models`, { headers });
        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            return res.json({ ok: true, data });
          }
        }
      } catch { /* fall through to static list */ }

      const anthropicModels = [
        'claude-sonnet-4-20250514',
        'claude-haiku-4-20250414',
        'claude-3-7-sonnet-20250219',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ];
      return res.json({ ok: true, data: { data: anthropicModels.map(id => ({ id, object: 'model' })) } });
    } else if (apiType === 'gemini') {
      // Try fetching models from the API first; fall back to a static list.
      try {
        const response = await fetchWithTimeout(`${normalizeBase(baseUrl)}/models`, { headers });
        if (response.ok) {
          const data = await response.json();
          if (data.models && Array.isArray(data.models)) {
            const models = data.models.map(m => ({
              id: m.name ? m.name.replace(/^models\//, '') : m.name,
              object: 'model',
            }));
            return res.json({ ok: true, data: { data: models } });
          }
        }
      } catch { /* fall through to static list */ }

      const geminiModels = [
        'gemini-2.5-flash-preview-05-20',
        'gemini-2.5-pro-preview-05-06',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
      ];
      return res.json({ ok: true, data: { data: geminiModels.map(id => ({ id, object: 'model' })) } });
    } else { // OpenAI and Custom
      const response = await fetchWithFallback(baseUrl, config.modelEndpoint, { headers });
      const data = await response.json();
      res.json({ ok: response.ok, data });
    }
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    res.status(502).json({ ok: false, data: { error: isTimeout ? 'Request timed out' : error.message } });
  }
});

app.post('/api/test', async (req, res) => {
  const { apiType, baseUrl, apiKey, model, messages, extraBody } = req.body;

  if (!apiType || !baseUrl || !apiKey || !model) {
    return res.status(400).json({ error: 'Missing required fields: apiType, baseUrl, apiKey, model' });
  }

  const config = API_CONFIGS[apiType] || API_CONFIGS.custom;
  const headers = buildHeaders(config, apiKey);

  const startTime = Date.now();

  try {
    let endpoint;
    let requestBody;
    const safeExtraBody = extraBody || {};
    if (apiType === 'anthropic') {
      endpoint = config.chatEndpoint;
      requestBody = {
        model: model,
        messages: messages,
        max_tokens: safeExtraBody.max_tokens || 1024, // Anthropic requires max_tokens
        ...safeExtraBody,
      };
    } else if (apiType === 'gemini') {
      endpoint = config.chatEndpoint.replace('{model}', model);
      requestBody = {
        contents: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model', // Gemini uses 'user'/'model' roles
          parts: [{ text: msg.content }]
        })),
        ...safeExtraBody,
      };
    } else { // OpenAI and Custom
      endpoint = config.chatEndpoint;
      requestBody = {
        model: model,
        messages: messages,
        ...safeExtraBody,
      };
    }

    const response = await fetchWithFallback(baseUrl, endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    const duration = Date.now() - startTime;
    const responseHeaders = Object.fromEntries(response.headers.entries());
    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }

    res.json({ ok: response.ok, status: response.status, statusText: response.statusText, headers: responseHeaders, duration, data });
  } catch (error) {
    const duration = Date.now() - startTime;
    const isTimeout = error.name === 'AbortError';
    res.status(502).json({
      ok: false,
      status: null,
      statusText: isTimeout ? 'Request Timed Out' : 'Network Error',
      headers: {},
      duration,
      data: { error: isTimeout ? `Request timed out after ${TIMEOUT_MS}ms` : error.message },
    });
  }
});

app.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`API Tester running at http://${displayHost}:${PORT}`);
});
