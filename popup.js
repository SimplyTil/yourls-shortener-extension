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
  
  const urlElement = document.getElementById('currentUrl');
  const keywordContainer = document.getElementById('keywordContainer');
  const keywordInput = document.getElementById('keyword');
  const shortenButton = document.getElementById('shortenButton');
  const resultContainer = document.getElementById('result');
  const shortUrlInput = document.getElementById('shortUrl');
  const copyButton = document.getElementById('copyButton');
  const errorContainer = document.getElementById('error');
  const errorMessage = document.getElementById('errorMessage');
  const yourlsLink = document.getElementById('yourlsLink');
  const serverSelector = document.getElementById('serverSelector');
  const serverSelect = document.getElementById('serverSelect');
  const additionalServerOption = document.getElementById('additionalServerOption');
  
  let currentUrl = '';
  let selectedText = '';
  let selectedServer = 'primary';
  
  // Load settings
  chrome.storage.sync.get([
    'yourls_url', 
    'yourls_key', 
    'ask_for_keyword', 
    'auto_copy', 
    'enable_additional_server',
    'additional_yourls_url',
    'additional_yourls_key',
    'additional_server_name'
  ], (settings) => {
    // Check if additional server is enabled
    if (settings.enable_additional_server && settings.additional_yourls_url && settings.additional_yourls_key) {
      // Setup server selector
      serverSelector.style.display = 'block';
      additionalServerOption.textContent = settings.additional_server_name || i18n.get('additionalServerOption');
      
      // Handle server selection change
      serverSelect.addEventListener('change', function() {
        selectedServer = this.value;
        updateYourlsLink(settings);
      });
    } else {
      serverSelector.style.display = 'none';
    }
    
    // Handle missing settings
    if (!settings.yourls_url || !settings.yourls_key) {
      showError(i18n.get('errorMissingSettings'));
      shortenButton.disabled = true;
      return;
    }
    
    if (settings.ask_for_keyword) {
      keywordContainer.style.display = 'block';
    }
    
    updateYourlsLink(settings);
    
    // Get the current tab URL and any selected text
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      currentUrl = tabs[0].url;
      urlElement.textContent = currentUrl;
      
      // Check if there's information from context menu
      chrome.storage.local.get(['contextMenuUrl', 'selectedText'], (data) => {
        if (data.contextMenuUrl) {
          currentUrl = data.contextMenuUrl;
          urlElement.textContent = currentUrl;
          chrome.storage.local.remove('contextMenuUrl');
        }
        
        if (data.selectedText) {
          selectedText = data.selectedText;
          keywordInput.value = selectedText;
          chrome.storage.local.remove('selectedText');
        }
      });
    });
  });
  
  // Handle shortening button click
  shortenButton.addEventListener('click', () => {
    shortenUrl(currentUrl, keywordInput.value);
  });
  
  // Handle copy button click
  copyButton.addEventListener('click', () => {
    shortUrlInput.select();
    document.execCommand('copy');
    copyButton.textContent = i18n.get('copiedButton');
    setTimeout(() => {
      copyButton.textContent = i18n.get('copyButton');
    }, 2000);
  });
  
  // Update the YOURLS admin link based on selected server
  function updateYourlsLink(settings) {
    const baseUrl = selectedServer === 'primary' ? 
      settings.yourls_url : 
      settings.additional_yourls_url;
      
    if (baseUrl) {
      // Create URL for admin page by adding /admin to the base URL
      // Remove trailing slash if it exists, then add /admin
      const adminUrl = baseUrl.endsWith('/') ? baseUrl + 'admin' : baseUrl + '/admin';
      yourlsLink.href = adminUrl;
      
      // Set the text for "to YOURLS" link
      const toYourlsSpan = yourlsLink.querySelector('span');
      if (toYourlsSpan) {
        // Only show server name in parentheses if additional server is enabled
        if (settings.enable_additional_server) {
          const serverName = selectedServer === 'additional' ? 
            (settings.additional_server_name || i18n.get('additionalServerOption')) : 
            i18n.get('primaryServerOption');
          
          toYourlsSpan.textContent = i18n.get('toYourls') + ` (${serverName})`;
        } else {
          // Just show "to YOURLS" without server name when only primary server is enabled
          toYourlsSpan.textContent = i18n.get('toYourls');
        }
      }
    } else {
      yourlsLink.style.display = 'none';
    }
  }
  
  function shortenUrl(url, keyword = '') {
    chrome.storage.sync.get([
      'yourls_url', 
      'yourls_key', 
      'additional_yourls_url', 
      'additional_yourls_key', 
      'auto_copy'
    ], (settings) => {
      // Determine which server to use based on the selection
      const baseUrl = selectedServer === 'primary' ? 
        settings.yourls_url : 
        settings.additional_yourls_url;
        
      const apiKey = selectedServer === 'primary' ? 
        settings.yourls_key : 
        settings.additional_yourls_key;
      
      if (!baseUrl || !apiKey) {
        showError(i18n.get(selectedServer === 'primary' ? 
          'errorMissingSettings' : 
          'errorMissingAdditionalSettings'));
        return;
      }
      
      const apiUrl = baseUrl + (baseUrl.endsWith('/') ? 'yourls-api.php' : '/yourls-api.php');
      
      // Create API request parameters
      const params = new URLSearchParams();
      params.append('signature', apiKey);
      params.append('action', 'shorturl');
      params.append('format', 'json');
      params.append('url', url);
      
      if (keyword) {
        params.append('keyword', keyword);
      }
      
      // Show loading state
      shortenButton.disabled = true;
      shortenButton.textContent = i18n.get('shorteningButton');
      
      // Try to use background script to bypass CORS
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
        // Reset button state
        shortenButton.disabled = false;
        shortenButton.textContent = i18n.get('shortenButton');
        
        if (response && response.success) {
          const data = response.data;
          if (data.status === 'success') {
            showResult(data.shorturl);
          } else {
            // Localize common YOURLS error messages
            let errorMessage = data.message || i18n.get('errorNetwork');
            
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
            
            showError(errorMessage);
          }
        } else {
          console.error('API error:', response ? response.error : 'No response');
          showError(i18n.get('errorCorsNetwork'));
        }
      });
    });
  }
  
  function showResult(shortUrl) {
    errorContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    shortUrlInput.value = shortUrl;
    
    // Check if auto-copy is enabled
    chrome.storage.sync.get(['auto_copy'], function(items) {
      if (items.auto_copy) {
        shortUrlInput.select();
        document.execCommand('copy');
        copyButton.textContent = i18n.get('copiedButton');
        setTimeout(() => {
          copyButton.textContent = i18n.get('copyButton');
        }, 2000);
      } else {
        shortUrlInput.select();
      }
    });
  }
  
  function showError(message) {
    resultContainer.style.display = 'none';
    errorContainer.style.display = 'block';
    errorMessage.innerHTML = message;
  }
});
