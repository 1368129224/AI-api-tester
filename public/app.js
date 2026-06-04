let currentResponse = null;
let allModels = [];
let currentLang = localStorage.getItem('lang') || 'en'; // Default language

const translations = {
  en: {
    pageTitle: 'AI API Tester',
    appTitle: 'AI API Tester',
    savedConfigsTitle: 'Saved Configurations',
    loadConfigLabel: 'Load a saved configuration',
    deleteSelectedBtn: 'Delete',
    importBtn: 'Import',
    exportAllBtn: 'Export All',
    configurationTitle: 'Configuration',
    configNameLabel: 'Configuration Name (for saving)',
    configNamePlaceholder: 'e.g., My OpenAI Key',
    apiTypeLabel: 'API Type',
    customOption: 'Custom',
    baseUrlLabel: 'Base URL',
    baseUrlPlaceholder: 'https://api.openai.com/v1',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: 'sk-...',
    modelLabel: 'Model',
    modelPlaceholder: 'gpt-4o-mini',
    messageLabel: 'Message (optional)',
    messagePlaceholder: 'Hi',
    fetchModelsBtn: 'Fetch Models',
    sendRequestBtn: 'Send Request',
    extraBodyBtn: 'Extra Body',
    saveConfigBtn: 'Save Config',
    extraBodyTitle: 'Extra Body (JSON)',
    extraBodyDescription: '(e.g., temperature, max_tokens, stop_sequences)',
    availableModelsTitle: 'Available Models',
    modelSearchPlaceholder: 'Search models...',
    sendingRequest: 'Sending request...',
    requestSuccessful: 'Request Successful',
    requestFailed: 'Request Failed',
    networkError: 'Network Error',
    requestTimedOut: 'Request timed out',
    contentTab: 'Content',
    rawJsonTab: 'Raw JSON',
    headersTab: 'Headers',
    alertFillConfigName: 'Please fill in Configuration Name to save.',
    alertFillBaseUrl: 'Please fill in Base URL to save.',
    alertFillApiKey: 'Please fill in API Key to save.',
    alertFillBaseUrlApiKey: 'Please fill in Base URL and API Key',
    alertFillBaseUrlApiKeyModel: 'Please fill in Base URL, API Key, and Model',
    alertInvalidJson: 'Invalid JSON in Extra Body',
    alertConfirmDelete: 'Are you sure you want to delete the "{name}" configuration?',
    alertConfigSaved: 'Configuration "{name}" saved!',
    alertConfigDeleted: 'Configuration "{name}" deleted.',
    alertFailedToFetchModels: 'Failed to fetch models: ',
    alertNoConfigsToExport: 'No configurations to export.',
    alertImportSuccess: 'Configurations imported successfully!',
    alertImportFailed: 'Failed to import configurations. Please check the file format.',
  },
  zh: {
    pageTitle: 'AI API 测试工具',
    appTitle: 'AI API 测试工具',
    savedConfigsTitle: '已保存的配置',
    loadConfigLabel: '加载已保存的配置',
    deleteSelectedBtn: '删除',
    importBtn: '导入',
    exportAllBtn: '导出全部',
    configurationTitle: '配置',
    configNameLabel: '配置名称 (用于保存)',
    configNamePlaceholder: '例如：我的 OpenAI 密钥',
    apiTypeLabel: 'API 类型',
    customOption: '自定义',
    baseUrlLabel: '基础 URL',
    baseUrlPlaceholder: 'https://api.openai.com/v1',
    apiKeyLabel: 'API 密钥',
    apiKeyPlaceholder: 'sk-...',
    modelLabel: '模型',
    modelPlaceholder: 'gpt-4o-mini',
    messageLabel: '消息 (可选)',
    messagePlaceholder: '你好',
    fetchModelsBtn: '获取模型',
    sendRequestBtn: '发送请求',
    extraBodyBtn: '额外请求体',
    saveConfigBtn: '保存配置',
    extraBodyTitle: '额外请求体 (JSON)',
    extraBodyDescription: '(例如：temperature, max_tokens, stop_sequences)',
    availableModelsTitle: '可用模型',
    modelSearchPlaceholder: '搜索模型...',
    sendingRequest: '正在发送请求...',
    requestSuccessful: '请求成功',
    requestFailed: '请求失败',
    networkError: '网络错误',
    requestTimedOut: '请求超时',
    contentTab: '内容',
    rawJsonTab: '原始 JSON',
    headersTab: '头部',
    alertFillConfigName: '请填写配置名称才能保存。',
    alertFillBaseUrl: '请填写基础 URL 才能保存。',
    alertFillApiKey: '请填写 API 密钥才能保存。',
    alertFillBaseUrlApiKey: '请填写基础 URL 和 API 密钥',
    alertFillBaseUrlApiKeyModel: '请填写基础 URL、API 密钥和模型',
    alertInvalidJson: '额外请求体中的 JSON 无效',
    alertConfirmDelete: '您确定要删除配置 "{name}" 吗？',
    alertConfigSaved: '配置 "{name}" 已保存！',
    alertConfigDeleted: '配置 "{name}" 已删除。',
    alertFailedToFetchModels: '获取模型失败：',
    alertNoConfigsToExport: '没有可导出的配置。',
    alertImportSuccess: '配置导入成功！',
    alertImportFailed: '导入配置失败，请检查文件格式。',
  }
};

function getTranslation(key) {
  return translations[currentLang][key] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);

  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    // For elements with children, only replace the first text node to avoid wiping out child elements (e.g., icons).
    if (el.children.length > 0) {
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          node.textContent = getTranslation(key);
          break;
        }
      }
    } else {
      el.textContent = getTranslation(key);
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = getTranslation(el.dataset.i18nPlaceholder);
  });

  // Handle special cases that the generic loops can't
  document.title = getTranslation('pageTitle');

  const configSelect = document.getElementById('config-select');
  if (configSelect && configSelect.options[0] && configSelect.options[0].value === '') {
    configSelect.options[0].textContent = '-- ' + getTranslation('loadConfigLabel') + ' --';
  }

  // Update active state of language buttons
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.getElementById('lang-zh').classList.toggle('active', lang === 'zh');
}

document.addEventListener('DOMContentLoaded', () => {
  loadConfigs();
  setLanguage(currentLang); // Apply initial language
  const apiTypeSelect = document.getElementById('apiType');
  if (apiTypeSelect.value === 'custom') {
    updateBaseUrl();
  } else {
    apiTypeSelect.value = 'openai';
    updateBaseUrl();
  }
});

const API_DEFAULTS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-20250514',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.0-flash',
  },
  custom: {
    baseUrl: '',
    model: '',
  }
};

function updateBaseUrl() {
  const apiType = document.getElementById('apiType').value;
  const baseUrlInput = document.getElementById('baseUrl');
  const modelInput = document.getElementById('model');

  const defaults = API_DEFAULTS[apiType] || API_DEFAULTS.custom;

  if (Object.values(API_DEFAULTS).some(d => d.baseUrl === baseUrlInput.value) || baseUrlInput.value === '') {
    baseUrlInput.value = defaults.baseUrl;
  }
  if (Object.values(API_DEFAULTS).some(d => d.model === modelInput.value) || modelInput.value === '') {
    modelInput.value = defaults.model;
  }
}

function saveConfig() {
  const name = document.getElementById('configName').value.trim();
  const apiType = document.getElementById('apiType').value;
  const baseUrl = document.getElementById('baseUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();

  if (!name) { alert(getTranslation('alertFillConfigName')); return; }
  if (!baseUrl) { alert(getTranslation('alertFillBaseUrl')); return; }
  if (!apiKey) { alert(getTranslation('alertFillApiKey')); return; }

  let configs = JSON.parse(localStorage.getItem('api_configs') || '{}');
  configs[name] = { apiType, baseUrl, apiKey };
  localStorage.setItem('api_configs', JSON.stringify(configs));

  loadConfigs();
  document.getElementById('config-select').value = name;
  alert(getTranslation('alertConfigSaved').replace('{name}', name));
}

function loadConfigs() {
  let configs = JSON.parse(localStorage.getItem('api_configs') || '{}');
  const select = document.getElementById('config-select');
  const currentVal = select.value;
  select.innerHTML = `<option value="">-- ${getTranslation('loadConfigLabel')} --</option>`;
  for (const name in configs) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }
  if (currentVal && Array.from(select.options).some(opt => opt.value === currentVal)) {
    select.value = currentVal;
  } else {
    if (Object.keys(configs).length > 0) {
      select.value = Object.keys(configs)[0];
      loadSelectedConfig();
    } else {
      document.getElementById('configName').value = '';
      document.getElementById('apiType').value = 'openai';
      document.getElementById('baseUrl').value = '';
      document.getElementById('apiKey').value = '';
      updateBaseUrl();
    }
  }
}

function loadSelectedConfig() {
  const name = document.getElementById('config-select').value;
  if (!name) {
    document.getElementById('configName').value = '';
    document.getElementById('apiType').value = 'openai';
    document.getElementById('baseUrl').value = '';
    document.getElementById('apiKey').value = '';
    updateBaseUrl();
    return;
  }

  let configs = JSON.parse(localStorage.getItem('api_configs') || '{}');
  const config = configs[name];
  if (config) {
    document.getElementById('configName').value = name;
    document.getElementById('apiType').value = config.apiType || 'openai';
    document.getElementById('baseUrl').value = config.baseUrl;
    document.getElementById('apiKey').value = config.apiKey;
    updateBaseUrl();
  }
}

function deleteSelectedConfig() {
  const name = document.getElementById('config-select').value;
  if (!name) return;

  if (confirm(getTranslation('alertConfirmDelete').replace('{name}', name))) {
    let configs = JSON.parse(localStorage.getItem('api_configs') || '{}');
    delete configs[name];
    localStorage.setItem('api_configs', JSON.stringify(configs));

    document.getElementById('configName').value = '';
    document.getElementById('apiType').value = 'openai';

    loadConfigs();
    alert(getTranslation('alertConfigDeleted').replace('{name}', name));
  }
}

function exportConfigs() {
  const configs = localStorage.getItem('api_configs');
  if (!configs || configs === '{}') {
    alert(getTranslation('alertNoConfigsToExport'));
    return;
  }

  // Parse and re-stringify with 2-space indentation for readability
  let formattedConfigs = configs;
  try {
    formattedConfigs = JSON.stringify(JSON.parse(configs), null, 2);
  } catch (e) {
    console.error("Error formatting configs for export:", e);
  }

  const blob = new Blob([formattedConfigs], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'api_configs.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importConfigs() {
  document.getElementById('import-file-input').click();
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedConfigs = JSON.parse(e.target.result);
      let currentConfigs = JSON.parse(localStorage.getItem('api_configs') || '{}');

      // Merge configs, imported ones overwrite existing ones
      const newConfigs = { ...currentConfigs, ...importedConfigs };

      localStorage.setItem('api_configs', JSON.stringify(newConfigs));
      loadConfigs();
      alert(getTranslation('alertImportSuccess'));
    } catch (error) {
      alert(getTranslation('alertImportFailed'));
      console.error("Import error:", error);
    } finally {
      // Reset file input to allow importing the same file again
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}


async function sendRequest() {
  const apiType = document.getElementById('apiType').value;
  const baseUrl = document.getElementById('baseUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  const model = document.getElementById('model').value.trim();
  const message = document.getElementById('message').value.trim() || 'Hi';
  const extraBodyStr = document.getElementById('extraBody').value.trim();

  if (!baseUrl || !apiKey || !model) {
    alert(getTranslation('alertFillBaseUrlApiKeyModel'));
    return;
  }

  let extraBody = {};
  if (extraBodyStr) {
    try {
      extraBody = JSON.parse(extraBodyStr);
    } catch {
      alert(getTranslation('alertInvalidJson'));
      return;
    }
  }

  const btn = document.getElementById('sendBtn');
  const loading = document.getElementById('loading');
  const responseSection = document.getElementById('response-section');

  btn.disabled = true;
  loading.style.display = 'block';
  responseSection.style.display = 'none';

  try {
    const res = await fetch('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiType,
        baseUrl,
        apiKey,
        model,
        messages: [{ role: 'user', content: message }],
        extraBody,
      }),
    });

    currentResponse = await res.json();
    displayResponse(currentResponse);
  } catch (err) {
    currentResponse = { ok: false, status: null, statusText: getTranslation('networkError'), duration: 0, data: { error: err.message } };
    displayResponse(currentResponse);
  } finally {
    btn.disabled = false;
    loading.style.display = 'none';
  }
}

function displayResponse(resp) {
  const responseSection = document.getElementById('response-section');
  const statusBar = document.getElementById('status-bar');
  const statusText = document.getElementById('status-text');
  const duration = document.getElementById('duration');
  const httpStatus = document.getElementById('http-status');

  responseSection.style.display = 'block';
  statusBar.className = 'status-bar ' + (resp.ok ? 'success' : 'error');
  statusText.textContent = resp.ok ? getTranslation('requestSuccessful') : getTranslation('requestFailed');
  duration.textContent = `${resp.duration}ms`;
  httpStatus.textContent = resp.status ? `HTTP ${resp.status}` : resp.statusText;

  switchTab('content');
}

function switchTab(tab) {
  document.querySelectorAll('.response-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.response-tab[data-tab="${tab}"]`).classList.add('active');

  const content = document.getElementById('response-content');
  if (!currentResponse) return;

  if (tab === 'content') {
    const data = currentResponse.data;
    if (data.choices && data.choices[0]) {
      content.textContent = data.choices[0].message?.content || JSON.stringify(data.choices[0], null, 2);
    } else if (data.error) {
      content.textContent = JSON.stringify(data.error, null, 2);
    } else if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) { // Gemini
      content.textContent = data.candidates[0].content.parts.map(p => p.text).join('\n');
    } else if (data.content && data.content[0] && data.content[0].text) { // Anthropic
      content.textContent = data.content[0].text;
    }
    else {
      content.textContent = JSON.stringify(data, null, 2);
    }
  } else if (tab === 'raw') {
    content.textContent = JSON.stringify(currentResponse, null, 2);
  } else if (tab === 'headers') {
    content.textContent = JSON.stringify(currentResponse.headers, null, 2);
  }
}

function toggleExtraBody() {
  document.getElementById('extra-body-card').classList.toggle('hidden');
}

async function fetchModels() {
  const apiType = document.getElementById('apiType').value;
  const baseUrl = document.getElementById('baseUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!baseUrl || !apiKey) {
    alert(getTranslation('alertFillBaseUrlApiKey'));
    return;
  }
  const btn = document.getElementById('fetchModelsBtn');
  btn.disabled = true;
  btn.textContent = getTranslation('sendingRequest');
  try {
    const res = await fetch('/api/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiType, baseUrl, apiKey }),
    });
    const result = await res.json();
    if (result.ok && result.data.data) {
      const models = result.data.data.map(m => typeof m === 'string' ? m : m.id).sort();
      allModels = models;
      document.getElementById('models-card').classList.remove('hidden');
      document.getElementById('model-count').textContent = `(${models.length})`;
      document.getElementById('model-search').value = '';
      renderModels(models);
    } else {
      alert(getTranslation('alertFailedToFetchModels') + JSON.stringify(result.data));
    }
  } catch (err) {
    alert(getTranslation('networkError') + ': ' + err.message);
  } finally {
    // Defensive coding: re-fetch the button to be safe
    const finalBtn = document.getElementById('fetchModelsBtn');
    if (finalBtn) {
        finalBtn.disabled = false;
        finalBtn.textContent = getTranslation('fetchModelsBtn');
    }
  }
}

function renderModels(models) {
  const list = document.getElementById('model-list');
  const currentModel = document.getElementById('model').value;
  list.innerHTML = '';
  models.forEach(m => {
    const div = document.createElement('div');
    div.className = 'model-item' + (m === currentModel ? ' selected' : '');
    div.textContent = m;
    div.addEventListener('click', () => selectModel(m));
    list.appendChild(div);
  });
}

function filterModels() {
  const query = document.getElementById('model-search').value.toLowerCase();
  const filtered = allModels.filter(m => m.toLowerCase().includes(query));
  renderModels(filtered);
}

function selectModel(model) {
  document.getElementById('model').value = model;
  document.querySelectorAll('.model-item').forEach(el => {
    el.classList.toggle('selected', el.textContent === model);
  });
}

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    sendRequest();
  }
});