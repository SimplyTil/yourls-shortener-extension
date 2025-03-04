document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n
  await i18n.init();
  
  // Apply translations to elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = i18n.get(key);
  });
  
  // Apply translations to elements with data-i18n-placeholder attribute
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.setAttribute('placeholder', i18n.get(key));
  });
  
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
    
    // Re-apply translations to the page
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = i18n.get(key);
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.setAttribute('placeholder', i18n.get(key));
    });
  });
  
  // Load saved settings
  loadSettings();
  
  // Save settings when the save button is clicked
  saveButton.addEventListener('click', saveSettings);
  
  // Test connection when the test button is clicked
  testConnectionButton.addEventListener('click', testConnection);
  
  // Removed: No need to add light-mode class since there's no dark mode anymore
  
  function loadSettings() {
    chrome.storage.sync.get(['yourls_url', 'yourls_key', 'ask_for_keyword', 'auto_copy', 'language'], (items) => {
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
    });
  }
  
  function saveSettings() {
    const yourlsUrl = yourlsUrlInput.value.trim();
    const yourlsKey = yourlsKeyInput.value.trim();
    const askForKeyword = askForKeywordCheckbox.checked;
    const autoCopy = autoCopyCheckbox.checked;
    const language = languageSelect.value;
    
    // Validate URL
    if (!yourlsUrl) {
      showStatus(i18n.get('errorUrlRequired'), 'error');
      return;
    }
    
    // Add trailing slash if needed
    const formattedUrl = yourlsUrl.endsWith('/') ? yourlsUrl : `${yourlsUrl}/`;
    
    // Validate key
    if (!yourlsKey) {
      showStatus(i18n.get('errorTokenRequired'), 'error');
      return;
    }
    
    // Save settings
    chrome.storage.sync.set({
      'yourls_url': formattedUrl,
      'yourls_key': yourlsKey,
      'ask_for_keyword': askForKeyword,
      'auto_copy': autoCopy,
      'language': language
    }, () => {
      showStatus(i18n.get('settingsSaved'), 'success');
    });
  }
  
  function testConnection() {
    const yourlsUrl = yourlsUrlInput.value.trim();
    const yourlsKey = yourlsKeyInput.value.trim();
    
    if (!yourlsUrl || !yourlsKey) {
      showTestResult(i18n.get('errorUrlRequired'), 'error');
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
    
    showTestResult(i18n.get('testingConnection'), '');
    
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
          
          showTestResult(i18n.get('connectionFailed', {error: errorMessage}), 'error');
        } else if (data.stats || data.status === 'success') {
          showTestResult(i18n.get('connectionSuccess'), 'success');
        } else {
          showTestResult(i18n.get('unexpectedFormat'), 'success');
          console.log('YOURLS API response:', data);
        }
      } else {
        console.error('Connection test error:', response ? response.error : 'No response');
        showTestResult(i18n.get('connectionFailedGeneric'), 'error');
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
  
  function showTestResult(message, type) {
    testResultDiv.innerHTML = message; // Changed from textContent to innerHTML to support line breaks
    testResultDiv.className = type;
  }
});
