document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n
  await i18n.init();
  
  // Set RTL if needed
  if (i18n.isRtl()) {
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
  }
  
  // Function to apply all translations
  function applyTranslations() {
    // Apply translations to elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = i18n.get(key);
    });
    
    // Apply HTML translations to elements with data-i18n-html attribute
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.getAttribute('data-i18n-html');
      element.innerHTML = i18n.get(key);
    });
    
    // Apply translations to elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.setAttribute('placeholder', i18n.get(key));
    });
  }
  
  // Apply translations immediately on page load
  applyTranslations();
  
  // Get version from manifest and add to the footer
  const versionInfoElement = document.getElementById('version-info');
  if (versionInfoElement) {
    fetch(chrome.runtime.getURL('manifest.json'))
      .then(response => response.json())
      .then(manifest => {
        versionInfoElement.textContent = `v${manifest.version}`;
      })
      .catch(error => {
        console.error('Error loading manifest:', error);
      });
  }
  
  // Get form elements
  const yourlsUrlInput = document.getElementById('yourls_url');
  const yourlsKeyInput = document.getElementById('yourls_key');
  const askForKeywordCheckbox = document.getElementById('ask_for_keyword');
  const autoCopyCheckbox = document.getElementById('auto_copy');
  const languageSelect = document.getElementById('language');
  const saveButton = document.getElementById('save_button');
  const testConnectionButton = document.getElementById('test_connection');
  const statusDiv = document.getElementById('status');
  const testResultDiv = document.getElementById('test_result');
  
  // Additional server elements
  const enableAdditionalServerCheckbox = document.getElementById('enable_additional_server');
  const additionalServerSettings = document.getElementById('additional_server_settings');
  const additionalYourlsUrlInput = document.getElementById('additional_yourls_url');
  const additionalYourlsKeyInput = document.getElementById('additional_yourls_key');
  const additionalServerNameInput = document.getElementById('additional_server_name');
  const testAdditionalConnectionContainer = document.getElementById('test_additional_connection_container');
  const testAdditionalConnectionButton = document.getElementById('test_additional_connection');
  const testAdditionalResultDiv = document.getElementById('test_additional_result');
  
  // Toggle additional server settings visibility
  enableAdditionalServerCheckbox.addEventListener('change', function() {
    additionalServerSettings.style.display = this.checked ? 'block' : 'none';
    testAdditionalConnectionContainer.style.display = this.checked ? 'block' : 'none';
  });
  
  // Populate language dropdown
  const languages = i18n.getAvailableLanguages();
  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.name;
    languageSelect.appendChild(option);
  });
  
  // Set current language
  languageSelect.value = i18n.getCurrentLanguage();
  
  // Handle language change
  languageSelect.addEventListener('change', async () => {
    const newLang = languageSelect.value;
    await i18n.changeLanguage(newLang);
    
    // Set RTL direction if needed
    if (i18n.isRtl()) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
    
    // Re-apply all translations
    applyTranslations();
  });
  
  // Load saved settings
  loadSettings();
  
  // Save settings when the save button is clicked
  saveButton.addEventListener('click', saveSettings);
  
  // Test connection when the test button is clicked
  testConnectionButton.addEventListener('click', () => testConnection(false));
  
  // Test additional connection
  testAdditionalConnectionButton.addEventListener('click', () => testConnection(true));
  
  function loadSettings() {
    chrome.storage.sync.get([
      'yourls_url', 
      'yourls_key', 
      'ask_for_keyword', 
      'auto_copy', 
      'language', 
      'enable_additional_server',
      'additional_yourls_url',
      'additional_yourls_key',
      'additional_server_name'
    ], (items) => {
      if (items.yourls_url) {
        yourlsUrlInput.value = items.yourls_url;
      }
      if (items.yourls_key) {
        yourlsKeyInput.value = items.yourls_key;
      }
      if (items.ask_for_keyword !== undefined) {
        askForKeywordCheckbox.checked = items.ask_for_keyword;
      }
      if (items.auto_copy !== undefined) {
        autoCopyCheckbox.checked = items.auto_copy;
      }
      if (items.language) {
        languageSelect.value = items.language;
      }
      
      // Load additional server settings
      if (items.enable_additional_server !== undefined) {
        enableAdditionalServerCheckbox.checked = items.enable_additional_server;
        additionalServerSettings.style.display = items.enable_additional_server ? 'block' : 'none';
        testAdditionalConnectionContainer.style.display = items.enable_additional_server ? 'block' : 'none';
      }
      if (items.additional_yourls_url) {
        additionalYourlsUrlInput.value = items.additional_yourls_url;
      }
      if (items.additional_yourls_key) {
        additionalYourlsKeyInput.value = items.additional_yourls_key;
      }
      if (items.additional_server_name) {
        additionalServerNameInput.value = items.additional_server_name;
      }
    });
  }
  
  function saveSettings() {
    const yourlsUrl = yourlsUrlInput.value.trim();
    const yourlsKey = yourlsKeyInput.value.trim();
    const askForKeyword = askForKeywordCheckbox.checked;
    const autoCopy = autoCopyCheckbox.checked;
    const language = languageSelect.value;
    const enableAdditionalServer = enableAdditionalServerCheckbox.checked;
    const additionalYourlsUrl = additionalYourlsUrlInput.value.trim();
    const additionalYourlsKey = additionalYourlsKeyInput.value.trim();
    const additionalServerName = additionalServerNameInput.value.trim();
    
    // Validate primary URL
    if (!yourlsUrl) {
      showStatus(i18n.get('errorUrlRequired'), 'error');
      return;
    }
    
    // Add trailing slash if needed
    const formattedUrl = yourlsUrl.endsWith('/') ? yourlsUrl : `${yourlsUrl}/`;
    
    // Validate primary key
    if (!yourlsKey) {
      showStatus(i18n.get('errorTokenRequired'), 'error');
      return;
    }
    
    // Validate additional server settings if enabled
    let formattedAdditionalUrl = '';
    if (enableAdditionalServer) {
      if (!additionalYourlsUrl) {
        showStatus(i18n.get('errorAdditionalUrlRequired'), 'error');
        return;
      }
      
      if (!additionalYourlsKey) {
        showStatus(i18n.get('errorAdditionalTokenRequired'), 'error');
        return;
      }
      
      if (!additionalServerName) {
        showStatus(i18n.get('errorAdditionalServerNameRequired'), 'error');
        return;
      }
      
      // Add trailing slash if needed for additional URL
      formattedAdditionalUrl = additionalYourlsUrl.endsWith('/') ? additionalYourlsUrl : `${additionalYourlsUrl}/`;
    }
    
    // Save settings
    const settings = {
      'yourls_url': formattedUrl,
      'yourls_key': yourlsKey,
      'ask_for_keyword': askForKeyword,
      'auto_copy': autoCopy,
      'language': language,
      'enable_additional_server': enableAdditionalServer
    };
    
    // Only save additional server settings if enabled
    if (enableAdditionalServer) {
      settings['additional_yourls_url'] = formattedAdditionalUrl;
      settings['additional_yourls_key'] = additionalYourlsKey;
      settings['additional_server_name'] = additionalServerName;
    }
    
    chrome.storage.sync.set(settings, () => {
      showStatus(i18n.get('settingsSaved'), 'success');
    });
  }
  
  function testConnection(isAdditional = false) {
    const yourlsUrl = isAdditional ? additionalYourlsUrlInput.value.trim() : yourlsUrlInput.value.trim();
    const yourlsKey = isAdditional ? additionalYourlsKeyInput.value.trim() : yourlsKeyInput.value.trim();
    const resultDiv = isAdditional ? testAdditionalResultDiv : testResultDiv;
    
    if (!yourlsUrl || !yourlsKey) {
      showTestResult(i18n.get('errorUrlRequired'), 'error', resultDiv);
      return;
    }
    
    // Format URL correctly
    const baseUrl = yourlsUrl.endsWith('/') ? yourlsUrl : `${yourlsUrl}/`;
    const apiUrl = `${baseUrl}yourls-api.php`;
    
    // Create form data
    const params = new URLSearchParams();
    params.append('signature', yourlsKey);
    params.append('action', 'stats');
    params.append('format', 'json');
    
    showTestResult(i18n.get('testingConnection'), '', resultDiv);
    
    // Send test request using background page to avoid CORS issues
    chrome.runtime.sendMessage({
      action: 'makeApiRequest',
      url: apiUrl,
      method: 'POST',
      body: params.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    }, response => {
      if (response && response.success) {
        const data = response.data;
        if (data.status === 'fail') {
          // Localize common YOURLS error messages
          let errorMessage = data.message || 'API Error';
          
          // Check for known error messages and replace with localized versions
          if (errorMessage.includes('Missing or malformed URL')) {
            errorMessage = i18n.get('apiErrorMissingUrl');
          } else if (errorMessage.includes('Keyword already exists')) {
            errorMessage = i18n.get('apiErrorKeywordExists');
          } else if (errorMessage.includes('already exists')) {
            errorMessage = i18n.get('apiErrorUrlExists');
          } else {
            errorMessage = i18n.get('apiErrorUnknown', { message: errorMessage });
          }
          
          showTestResult(i18n.get('connectionFailed', {error: errorMessage}), 'error', resultDiv);
        } else if (data.stats || data.status === 'success') {
          showTestResult(i18n.get('connectionSuccess'), 'success', resultDiv);
        } else {
          showTestResult(i18n.get('unexpectedFormat'), 'success', resultDiv);
          console.log('YOURLS API response:', data);
        }
      } else {
        console.error('Connection test error:', response ? response.error : 'No response');
        showTestResult(i18n.get('connectionFailedGeneric'), 'error', resultDiv);
      }
    });
  }
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = type;
    
    // Clear the status after a few seconds
    setTimeout(() => {
      statusDiv.textContent = '';
      statusDiv.className = '';
    }, 3000);
  }
  
  function showTestResult(message, type, resultDiv) {
    resultDiv.innerHTML = message; // Changed from textContent to innerHTML to support line breaks
    resultDiv.className = type;
  }
});
