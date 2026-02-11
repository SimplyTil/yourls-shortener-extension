// Import shared i18n module (reuse the same I18n class used by popup/settings)
import './js/i18n.js';

// Set up context menu items when the extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  try {
    // Initialize shared i18n
    await self.i18n.init();
    
    // Clear existing items to prevent duplicates on update
    await new Promise(resolve => chrome.contextMenus.removeAll(resolve));
    
    // Context menu for links
    chrome.contextMenus.create({
      id: 'shortenLink',
      title: self.i18n.get('contextMenuShortenLink') || 'Shorten Link',
      contexts: ['link']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error creating shortenLink menu:', chrome.runtime.lastError);
      }
    });
    
    // Context menu for selected text
    chrome.contextMenus.create({
      id: 'shortenPage',
      title: self.i18n.get('contextMenuShortenPage') || 'Shorten Page',
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error creating shortenPage menu:', chrome.runtime.lastError);
      }
    });
  } catch (error) {
    console.error('Failed to set up context menu:', error);
  }
});

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
      // Re-initialize i18n with the new language
      await self.i18n.init();
      
      chrome.contextMenus.update('shortenLink', {
        title: self.i18n.get('contextMenuShortenLink') || 'Shorten Link'
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error updating shortenLink menu:', chrome.runtime.lastError);
        }
      });
      
      chrome.contextMenus.update('shortenPage', {
        title: self.i18n.get('contextMenuShortenPage') || 'Shorten Page'
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
