document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n
  try {
    await i18n.init();
  } catch (err) {
    console.error('Failed to initialize i18n:', err);
    // Continue with minimal functionality
  }
  
  // Set RTL if needed
  if (i18n.isRtl()) {
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
  }
  
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
  
  // Use shared utils for DOM access
  const { dom, clipboard, url: urlUtils, api } = window.utils;
  const getElement = dom.getElement;
  
  const urlElement = getElement('currentUrl');
  const faviconElement = getElement('siteFavicon');
  const keywordContainer = getElement('keywordContainer');
  const keywordInput = getElement('keyword');
  const shortenButton = getElement('shortenButton');
  const resultContainer = getElement('result');
  const shortUrlInput = getElement('shortUrl');
  const copyButton = getElement('copyButton');
  const errorContainer = getElement('error');
  const errorMessage = getElement('errorMessage');
  const yourlsLink = getElement('yourlsLink');
  const serverSelector = getElement('serverSelector');
  const serverSelect = getElement('serverSelect');
  const additionalServerOption = getElement('additionalServerOption');
  
  let currentUrl = '';
  let selectedText = '';
  let selectedServer = 'primary';
  let isProcessing = false; // Flag to prevent multiple submissions
  
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
    if (chrome.runtime.lastError) {
      console.error('Error loading settings:', chrome.runtime.lastError);
      showError(i18n.get('errorLoadingSettings') || 'Error loading settings');
      if (shortenButton) shortenButton.disabled = true;
      return;
    }
    
    // Check if additional server is enabled
    if (settings.enable_additional_server && settings.additional_yourls_url && settings.additional_yourls_key) {
      // Setup server selector
      if (serverSelector) serverSelector.style.display = 'block';
      if (additionalServerOption) {
        additionalServerOption.textContent = settings.additional_server_name || i18n.get('additionalServerOption');
      }
      
      // Handle server selection change
      if (serverSelect) {
        serverSelect.addEventListener('change', function() {
          selectedServer = this.value;
          updateYourlsLink(settings);
        });
      }
    } else {
      if (serverSelector) serverSelector.style.display = 'none';
    }
    
    // Handle missing settings
    if (!settings.yourls_url || !settings.yourls_key) {
      showError(i18n.get('errorMissingSettings'));
      if (shortenButton) shortenButton.disabled = true;
      return;
    }
    
    if (settings.ask_for_keyword && keywordContainer) {
      keywordContainer.style.display = 'block';
    }
    
    updateYourlsLink(settings);
    
    // Get the current tab URL and any selected text
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('Error querying tabs:', chrome.runtime.lastError);
        return;
      }
      
      if (!tabs || tabs.length === 0) {
        console.warn('No active tab found');
        return;
      }
      
      currentUrl = tabs[0].url;
      if (urlElement) urlElement.textContent = currentUrl;
      
      // Get and display favicon
      getFaviconUrl(currentUrl, tabs[0].favIconUrl);
      
      // Check if there's information from context menu
      chrome.storage.local.get(['contextMenuUrl', 'selectedText'], (data) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading context data:', chrome.runtime.lastError);
          return;
        }
        
        if (data.contextMenuUrl) {
          currentUrl = data.contextMenuUrl;
          if (urlElement) urlElement.textContent = currentUrl;
          getFaviconUrl(currentUrl);
          
          // Clear the stored URL
          chrome.storage.local.remove('contextMenuUrl', () => {
            if (chrome.runtime.lastError) {
              console.error('Error clearing contextMenuUrl:', chrome.runtime.lastError);
            }
          });
        }
        
        if (data.selectedText && keywordInput) {
          selectedText = data.selectedText;
          keywordInput.value = selectedText;
          
          // Clear the stored text
          chrome.storage.local.remove('selectedText', () => {
            if (chrome.runtime.lastError) {
              console.error('Error clearing selectedText:', chrome.runtime.lastError);
            }
          });
        }
      });
    });
  });
  
  // Function to get and display favicon (uses tab favicon only to avoid leaking URLs to third parties)
  function getFaviconUrl(url, tabFavicon = null) {
    if (!faviconElement) return;
    
    if (tabFavicon && tabFavicon !== '') {
      faviconElement.src = tabFavicon;
      faviconElement.style.display = 'block';
    } else {
      faviconElement.style.display = 'none';
    }
  }
  
  // Handle shortening button click
  if (shortenButton) {
    shortenButton.addEventListener('click', () => {
      // Prevent double-submission
      if (isProcessing) return;
      
      // Validate URL before sending
      if (!currentUrl) {
        showError(i18n.get('errorNoUrl') || 'No URL to shorten');
        return;
      }
      
      // Use shared URL validation
      if (!urlUtils.isValid(currentUrl)) {
        showError(i18n.get('errorInvalidUrl') || 'Invalid URL format');
        return;
      }
      const keyword = keywordInput ? keywordInput.value.trim() : '';
      shortenUrl(currentUrl, keyword);
    });
  }
  
  // Handle copy button click using shared clipboard utility
  if (copyButton && shortUrlInput) {
    copyButton.addEventListener('click', () => {
      const textToCopy = shortUrlInput.value;
      
      if (!textToCopy) {
        console.warn('Nothing to copy');
        return;
      }
      
      clipboard.copyWithFeedback(
        textToCopy,
        copyButton,
        i18n.get('copiedButton'),
        i18n.get('copyButton')
      ).then(success => {
        if (!success) {
          showError(i18n.get('errorCopy') || 'Failed to copy. Please select and copy manually.');
        }
      });
    });
  }
  
  // Update the YOURLS admin link based on selected server
  function updateYourlsLink(settings) {
    if (!yourlsLink) return;
    
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
      
      yourlsLink.style.display = 'inline-flex';
    } else {
      yourlsLink.style.display = 'none';
    }
  }
  
  function shortenUrl(url, keyword = '') {
    // Set processing state
    isProcessing = true;
    if (shortenButton) {
      shortenButton.disabled = true;
      shortenButton.textContent = i18n.get('shorteningButton') || 'Shortening...';
      shortenButton.classList.add('processing');
    }
    
    // Hide previous results/errors
    if (resultContainer) resultContainer.style.display = 'none';
    if (errorContainer) errorContainer.style.display = 'none';
    
    chrome.storage.sync.get([
      'yourls_url', 
      'yourls_key', 
      'additional_yourls_url', 
      'additional_yourls_key', 
      'auto_copy'
    ], (settings) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading settings for shortening:', chrome.runtime.lastError);
        resetShortenButton();
        showError(i18n.get('errorLoadingSettings') || 'Failed to load settings');
        return;
      }
      
      // Determine which server to use based on the selection
      const baseUrl = selectedServer === 'primary' ? 
        settings.yourls_url : 
        settings.additional_yourls_url;
        
      const apiKey = selectedServer === 'primary' ? 
        settings.yourls_key : 
        settings.additional_yourls_key;
      
      if (!baseUrl || !apiKey) {
        resetShortenButton();
        showError(i18n.get(selectedServer === 'primary' ? 
          'errorMissingSettings' : 
          'errorMissingAdditionalSettings'));
        return;
      }
      
      // Sanitize base URL
      const sanitizedBaseUrl = baseUrl.trim().replace(/\/$/, '');
      const apiUrl = `${sanitizedBaseUrl}/yourls-api.php`;
      
      // Create API request parameters
      const apiParams = {
        signature: apiKey,
        action: 'shorturl',
        format: 'json',
        url: url
      };
      
      if (keyword) {
        apiParams.keyword = keyword;
      }
      
      // Use shared API utility with timeout handling
      api.request(apiUrl, apiParams)
        .then(data => {
          resetShortenButton();
          
          if (data && data.status === 'success' && data.shorturl) {
            showResult(data.shorturl);
            
            // Auto-copy if enabled using shared clipboard utility
            if (settings.auto_copy && copyButton) {
              clipboard.copyWithFeedback(
                data.shorturl,
                copyButton,
                i18n.get('copiedButton'),
                i18n.get('copyButton')
              );
            }
          } else {
            // Localize common YOURLS error messages
            let errMsg = data && data.message ? data.message : i18n.get('errorNetwork');
            
            // Check for known error messages and replace with localized versions
            if (errMsg.includes('Missing or malformed URL')) {
              errMsg = i18n.get('apiErrorMissingUrl');
            } else if (errMsg.includes('Keyword already exists')) {
              errMsg = i18n.get('apiErrorKeywordExists');
            } else if (errMsg.includes('already exists')) {
              errMsg = i18n.get('apiErrorUrlExists');
            } else if (data && data.status === 'fail') {
              errMsg = i18n.get('apiErrorUnknown', { message: errMsg });
            }
            
            showError(errMsg);
          }
        })
        .catch(error => {
          resetShortenButton();
          console.error('API error:', error);
          showError(i18n.get('errorCorsNetwork') || 'Network error connecting to YOURLS server');
        });
    });
  }
  
  // Helper to reset the shorten button state
  function resetShortenButton() {
    isProcessing = false;
    if (shortenButton) {
      shortenButton.disabled = false;
      shortenButton.textContent = i18n.get('shortenButton') || 'Shorten URL';
      shortenButton.classList.remove('processing');
    }
  }
  
  function showResult(shortUrl) {
    if (!resultContainer || !shortUrlInput) return;
    
    if (errorContainer) errorContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    shortUrlInput.value = shortUrl;
    
    // Focus and select for easier manual copying
    shortUrlInput.focus();
    shortUrlInput.select();
  }
  
  function showError(message) {
    if (!errorContainer || !errorMessage) return;
    
    if (resultContainer) resultContainer.style.display = 'none';
    errorContainer.style.display = 'block';
    errorMessage.innerHTML = message;
  }
});
