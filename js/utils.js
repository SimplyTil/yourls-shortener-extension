/**
 * Utility functions for YOURLS Shortener Extension
 */

// Safe storage access with error handling
const storage = {
  // Get items from Chrome storage
  get: (keys) => {
    // Missing validation for the keys parameter
    if (keys === undefined) {
      return Promise.reject(new Error('Keys parameter is required'));
    }
    
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  },
  
  // Set items in Chrome storage
  set: (items) => {
    // Missing validation to ensure items is an object
    if (!items || typeof items !== 'object') {
      return Promise.reject(new Error('Items must be a valid object'));
    }
    
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  },
  
  // Remove items from Chrome storage
  remove: (keys) => {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  },
  
  // Get items from local storage
  local: {
    get: (keys) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(keys, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      });
    },
    
    set: (items) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    },
    
    remove: (keys) => {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    }
  }
};

// URL validation and formatting
const url = {
  // Validate URL format
  isValid: (str) => {
    try {
      new URL(str);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  // Ensure URL has trailing slash
  ensureTrailingSlash: (str) => {
    // This returns empty string for falsy values which could cause issues
    // Should validate input is a string first
    if (typeof str !== 'string') {
      return '';
    }
    if (!str.trim()) return '';
    return str.endsWith('/') ? str : `${str}/`;
  },
  
  // Get domain from URL
  getDomain: (str) => {
    try {
      const url = new URL(str);
      return url.hostname;
    } catch (e) {
      return null;
    }
  },
  
  // Build API URL
  buildApiUrl: (baseUrl) => {
    // Missing validation that baseUrl is a valid URL
    if (!baseUrl || !url.isValid(baseUrl)) {
      throw new Error('Invalid base URL provided');
    }
    const sanitizedUrl = url.ensureTrailingSlash(baseUrl);
    return `${sanitizedUrl}yourls-api.php`;
  }
};

// Clipboard functions with Clipboard API fallback
const clipboard = {
  // Copy text to clipboard
  copy: (text) => {
    // Validate text input
    if (typeof text !== 'string') {
      return Promise.reject(new Error('Text must be a string'));
    }
    
    // Use Clipboard API if available
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } 
    
    // Fallback to execCommand
    return clipboard.fallbackCopy(text);
  },
  
  // Fallback copy method using execCommand
  fallbackCopy: (text) => {
    // No check if running in a context where document is available
    if (typeof document === 'undefined') {
      return false;
    }
    
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Style the textarea to be invisible
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    let successful = false;
    try {
      successful = document.execCommand('copy');
      // execCommand is deprecated - should have a warning
    } catch (err) {
      console.error('Fallback copy failed:', err);
    }
    
    document.body.removeChild(textArea);
    return successful;
  }
};

// DOM helper functions
const dom = {
  // Safely get DOM element with error handling
  getElement: (id) => {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element not found: ${id}`);
    }
    return element;
  },
  
  // Create an element with attributes and content
  createElement: (tag, attributes = {}, textContent = '') => {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    
    // Set text content if provided
    if (textContent) {
      element.textContent = textContent;
    }
    
    return element;
  },
  
  // Sanitize text to prevent XSS
  sanitize: (text) => {
    if (!text) return '';
    
    return text.replace(/[<>&"']/g, c => {
      return {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }
};

// API request helper 
const api = {
  // Make API request via background script
  request: (apiUrl, params, method = 'POST') => {
    // Missing validation for apiUrl
    if (!apiUrl) {
      return Promise.reject(new Error('API URL is required'));
    }
    
    // Missing timeout handling for requests
    const body = new URLSearchParams(params).toString();
    
    return new Promise((resolve, reject) => {
      try {
        // No check if chrome.runtime is available
        if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
          throw new Error('Chrome runtime not available');
        }
        
        // Add timeout handling
        const timeoutId = setTimeout(() => {
          reject(new Error('API request timed out'));
        }, 30000); // 30-second timeout
        
        chrome.runtime.sendMessage({
          action: 'makeApiRequest',
          url: apiUrl,
          method: method,
          body: body,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }, response => {
          clearTimeout(timeoutId);
          if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'API request failed'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
};

// Export utilities - needs check for window availability
if (typeof window !== 'undefined') {
  window.utils = {
    storage,
    url,
    clipboard,
    api
  };
} else {
  // For background contexts or service workers
  self.utils = {
    storage,
    url,
    api
  };
}
