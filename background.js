// Set up context menu items when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Load translations first
  loadTranslations().then((translations) => {
    // Context menu for links
    chrome.contextMenus.create({
      id: 'shortenLink',
      title: translations.contextMenuShortenLink || 'Shorten Link',
      contexts: ['link']
    });
    
    // Context menu for selected text
    chrome.contextMenus.create({
      id: 'shortenPage',
      title: translations.contextMenuShortenPage || 'Shorten Page',
      contexts: ['selection']
    });
  });
});

// Function to load translations
async function loadTranslations() {
  try {
    // Get preferred language 
    const { language = 'en' } = await new Promise(resolve => {
      chrome.storage.sync.get(['language'], resolve);
    });

    // Load translations
    const response = await fetch(chrome.runtime.getURL(`/_locales/${language}/messages.json`));
    const data = await response.json();
    
    // Convert to simple key-value format
    const translations = {};
    Object.keys(data).forEach(key => {
      translations[key] = data[key].message;
    });
    
    return translations;
  } catch (e) {
    console.error("Error loading translations:", e);
    return {}; // Return empty object on error
  }
}

// Handle context menu item clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'shortenLink') {
    // Store the link URL to be used by the popup
    chrome.storage.local.set({ 'contextMenuUrl': info.linkUrl });
    
    // If text is selected, use it as the keyword
    if (info.selectionText) {
      chrome.storage.local.set({ 'selectedText': info.selectionText });
    }
    
    // Open the popup
    chrome.action.openPopup();
  } 
  else if (info.menuItemId === 'shortenPage') {
    // Store the selected text to be used as keyword
    chrome.storage.local.set({ 'selectedText': info.selectionText });
    
    // Open the popup
    chrome.action.openPopup();
  }
});

// Listen for language change to update context menu titles
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.language) {
    loadTranslations().then((translations) => {
      chrome.contextMenus.update('shortenLink', {
        title: translations.contextMenuShortenLink || 'Shorten Link'
      });
      
      chrome.contextMenus.update('shortenPage', {
        title: translations.contextMenuShortenPage || 'Shorten Page'
      });
    });
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
    .then(response => response.json())
    .then(data => {
      sendResponse({ success: true, data: data });
    })
    .catch(error => {
      console.error('API request error:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
});
