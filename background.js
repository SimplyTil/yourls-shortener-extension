// Set up context menu items when the extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Load translations first
    const translations = await loadTranslations();
    
    // Clear existing items to prevent duplicates on update
    await new Promise(resolve => chrome.contextMenus.removeAll(resolve));
    
    // Context menu for links
    chrome.contextMenus.create({
      id: 'shortenLink',
      title: translations.contextMenuShortenLink || 'Shorten Link',
      contexts: ['link']
    }, () => {
      // Check for creation error
      if (chrome.runtime.lastError) {
        console.error('Error creating shortenLink menu:', chrome.runtime.lastError);
      }
    });
    
    // Context menu for selected text
    chrome.contextMenus.create({
      id: 'shortenPage',
      title: translations.contextMenuShortenPage || 'Shorten Page',
      contexts: ['selection']
    }, () => {
      // Check for creation error
      if (chrome.runtime.lastError) {
        console.error('Error creating shortenPage menu:', chrome.runtime.lastError);
      }
    });
  } catch (error) {
    console.error('Failed to set up context menu:', error);
  }
});

// Function to load translations
async function loadTranslations() {
  try {
    // Get preferred language 
    const { language = 'en' } = await new Promise(resolve => {
      chrome.storage.sync.get(['language'], resolve);
    });

    // Handle potential invalid language value
    let validLanguage = language;
    
    // Load translations - with fallback to English
    try {
      const response = await fetch(chrome.runtime.getURL(`/_locales/${validLanguage}/messages.json`));
      // Check if file exists
      if (!response.ok) {
        throw new Error(`Could not load language ${validLanguage}`);
      }
      const data = await response.json();
      
      // Convert to simple key-value format
      const translations = {};
      Object.keys(data).forEach(key => {
        translations[key] = data[key].message;
      });
      
      return translations;
    } catch (e) {
      console.warn(`Error loading language ${validLanguage}, falling back to English:`, e);
      // Fallback to English
      const fallbackResponse = await fetch(chrome.runtime.getURL('/_locales/en/messages.json'));
      const fallbackData = await fallbackResponse.json();
      
      const translations = {};
      Object.keys(fallbackData).forEach(key => {
        translations[key] = fallbackData[key].message;
      });
      
      return translations;
    }
  } catch (e) {
    console.error("Critical error loading translations:", e);
    // Return minimal working translations for critical UI elements
    return {
      contextMenuShortenLink: 'Shorten Link',
      contextMenuShortenPage: 'Shorten Page'
    }; 
  }
}

// Handle context menu item clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'shortenLink') {
    // Store the link URL to be used by the popup
    chrome.storage.local.set({ 'contextMenuUrl': info.linkUrl }, () => {
      // Check for storage errors
      if (chrome.runtime.lastError) {
        console.error('Error saving contextMenuUrl:', chrome.runtime.lastError);
      }
    });
    
    // If text is selected, use it as the keyword
    if (info.selectionText) {
      chrome.storage.local.set({ 'selectedText': info.selectionText }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving selectedText:', chrome.runtime.lastError);
        }
      });
    }
    
    // Try to open the popup - fallback to opening options page if not supported
    try {
      chrome.action.openPopup();
    } catch (e) {
      console.warn('Unable to open popup programmatically:', e);
      // Fallback: some browsers don't support openPopup()
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    }
  } 
  else if (info.menuItemId === 'shortenPage') {
    // Store the selected text to be used as keyword
    chrome.storage.local.set({ 'selectedText': info.selectionText }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving selectedText:', chrome.runtime.lastError);
      }
    });
    
    // Try to open the popup
    try {
      chrome.action.openPopup();
    } catch (e) {
      console.warn('Unable to open popup programmatically:', e);
      chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
    }
  }
});

// Listen for language change to update context menu titles
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'sync' && changes.language) {
    try {
      const translations = await loadTranslations();
      
      chrome.contextMenus.update('shortenLink', {
        title: translations.contextMenuShortenLink || 'Shorten Link'
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error updating shortenLink menu:', chrome.runtime.lastError);
        }
      });
      
      chrome.contextMenus.update('shortenPage', {
        title: translations.contextMenuShortenPage || 'Shorten Page'
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error updating shortenPage menu:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.error('Failed to update context menu after language change:', error);
    }
  }
});

// Listen for messages from popup to handle API requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'makeApiRequest') {
    // Make API request from background script to help bypass CORS
    fetch(message.url, {
      method: message.method || 'POST',
      body: message.body,
      headers: message.headers || {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then(response => {
      // Handle non-200 responses properly
      if (!response.ok) {
        return Promise.reject(new Error(`HTTP error ${response.status}: ${response.statusText}`));
      }
      return response.json();
    })
    .then(data => {
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      console.error('API request error:', error);
      sendResponse({ 
        success: false, 
        error: error.message || 'Unknown error occurred'
      });
    });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});
