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
  
  // Safely get DOM elements with error handling
  const getElement = (id) => {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element not found: ${id}`);
    }
    return element;
  };
  
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
  
  // Function to get and display favicon
  function getFaviconUrl(url, tabFavicon = null) {
    if (!faviconElement) return;
    
    // Try to use the tab's favicon first
    if (tabFavicon && tabFavicon !== '') {
      faviconElement.src = tabFavicon;
      faviconElement.style.display = 'block';
      return;
    }
    
    // Otherwise, construct favicon URL from domain
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      
      // Use Google's favicon service directly - more reliable
      const googleFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
      faviconElement.src = googleFavicon;
      faviconElement.style.display = 'block';
    } catch (e) {
      console.warn('Invalid URL for favicon:', e);
      // Hide favicon if URL is invalid
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
      
      try {
        // Basic URL validation
        new URL(currentUrl);
        const keyword = keywordInput ? keywordInput.value.trim() : '';
        shortenUrl(currentUrl, keyword);
      } catch (e) {
        showError(i18n.get('errorInvalidUrl') || 'Invalid URL format');
      }
    });
  }
  
  // Handle copy button click with modern Clipboard API
  if (copyButton && shortUrlInput) {
    copyButton.addEventListener('click', () => {
      const textToCopy = shortUrlInput.value;
      
      if (!textToCopy) {
        console.warn('Nothing to copy');
        return;
      }
      
      // Use Clipboard API with fallbacks
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            copyButton.textContent = i18n.get('copiedButton');
            copyButton.classList.add('copied');
            setTimeout(() => {
              copyButton.textContent = i18n.get('copyButton');
              copyButton.classList.remove('copied');
            }, 2000);
          })
          .catch(err => {
            console.error('Clipboard API error:', err);
            fallbackCopy();
          });
      } else {
        fallbackCopy();
      }
      
      // Fallback copy method
      function fallbackCopy() {
        shortUrlInput.select();
        try {
          const success = document.execCommand('copy');
          if (success) {
            copyButton.textContent = i18n.get('copiedButton');
            copyButton.classList.add('copied');
            setTimeout(() => {
              copyButton.textContent = i18n.get('copyButton');
              copyButton.classList.remove('copied');
            }, 2000);
          } else {
            console.error('execCommand failed to copy');
            showError(i18n.get('errorCopy') || 'Failed to copy. Please select and copy manually.');
          }
        } catch (err) {
          console.error('execCommand error:', err);
          showError(i18n.get('errorCopy') || 'Failed to copy. Please select and copy manually.');
        }
      }
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
      const params = new URLSearchParams();
      params.append('signature', apiKey);
      params.append('action', 'shorturl');
      params.append('format', 'json');
      params.append('url', url);
      
      if (keyword) {
        params.append('keyword', keyword);
      }
      
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
        resetShortenButton();
        
        if (response && response.success) {
          const data = response.data;
          if (data && data.status === 'success' && data.shorturl) {
            showResult(data.shorturl);
            
            // Auto-copy if enabled
            if (settings.auto_copy && shortUrlInput) {
              const textToCopy = data.shorturl;
              
              // Modern clipboard API
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy)
                  .then(() => {
                    if (copyButton) {
                      copyButton.textContent = i18n.get('copiedButton');
                      copyButton.classList.add('copied');
                      setTimeout(() => {
                        copyButton.textContent = i18n.get('copyButton');
                        copyButton.classList.remove('copied');
                      }, 2000);
                    }
                  })
                  .catch(err => {
                    console.error('Auto-copy failed:', err);
                    // Fallback to old method
                    if (shortUrlInput) {
                      shortUrlInput.select();
                      document.execCommand('copy');
                    }
                  });
              } else {
                // Fallback for browsers without Clipboard API
                if (shortUrlInput) {
                  shortUrlInput.select();
                  document.execCommand('copy');
                }
              }
            }
          } else {
            // Localize common YOURLS error messages
            let errorMessage = data && data.message ? data.message : i18n.get('errorNetwork');
            
            // Check for known error messages and replace with localized versions
            if (errorMessage.includes('Missing or malformed URL')) {
              errorMessage = i18n.get('apiErrorMissingUrl');
            } else if (errorMessage.includes('Keyword already exists')) {
              errorMessage = i18n.get('apiErrorKeywordExists');
            } else if (errorMessage.includes('already exists')) {
              errorMessage = i18n.get('apiErrorUrlExists');
            } else if (data && data.status === 'fail') {
              errorMessage = i18n.get('apiErrorUnknown', { message: errorMessage });
            }
            
            showError(errorMessage);
          }
        } else {
          console.error('API error:', response ? response.error : 'No response');
          showError(i18n.get('errorCorsNetwork') || 'Network error connecting to YOURLS server');
        }
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
