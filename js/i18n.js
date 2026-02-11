/**
 * Internationalization helper for YOURLS Link Shortener
 */
class I18n {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = {};
    this.initialized = false;
    this.translationCache = {}; // Add caching for better performance
  }
  
  /**
   * Initialize the translation system
   */
  async init() {
    try {
      // Load current language setting
      const settings = await this.getStoredSettings();
      const requestedLanguage = settings.language || 'en';
      
      // Validate that language exists or fallback to English
      const availableLanguages = this.getAvailableLanguages();
      const isValidLanguage = availableLanguages.some(lang => lang.code === requestedLanguage);
      
      this.currentLanguage = isValidLanguage ? requestedLanguage : 'en';
      
      // Load translations for the current language
      await this.loadTranslations(this.currentLanguage);
      this.initialized = true;
      
      return this;
    } catch (error) {
      console.error('Failed to initialize i18n:', error);
      // Fallback to basic English
      this.currentLanguage = 'en';
      this.translations = { 'fallbackError': 'Translation system failed to initialize' };
      this.initialized = true;
      return this;
    }
  }
  
  /**
   * Get stored settings from Chrome storage
   */
  getStoredSettings() {
    return new Promise(resolve => {
      chrome.storage.sync.get(['language'], (items) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting language setting:', chrome.runtime.lastError);
          resolve({}); // Return empty object on error
        } else {
          resolve(items);
        }
      });
    });
  }
  
  /**
   * Load translations for a specific language
   */
  async loadTranslations(lang) {
    try {
      // Check if translations are already cached
      if (this.translationCache[lang]) {
        this.translations = this.translationCache[lang];
        return;
      }

      const response = await fetch(chrome.runtime.getURL(`/_locales/${lang}/messages.json`));
      
      // Handle missing translation files
      if (!response.ok) {
        throw new Error(`Translation file for ${lang} not found`);
      }
      
      this.translations = await response.json();
      
      // Cache the translations
      this.translationCache[lang] = this.translations;
    } catch (e) {
      console.error(`Failed to load translations for ${lang}:`, e);
      // Fallback to English
      if (lang !== 'en') {
        await this.loadTranslations('en');
      } else {
        // If even English fails, set empty translations
        this.translations = {};
        console.error('Critical translation error: Failed to load English translations');
      }
    }
  }
  
  /**
   * Get translation for a specific key
   */
  get(key, placeholders = {}) {
    // Validation
    if (!key || typeof key !== 'string') {
      console.warn('Invalid key requested from i18n:', key);
      return '[missing key]';
    }
    
    if (!this.initialized) {
      console.warn('i18n not initialized, please call init() first');
      return key;
    }
    
    const message = this.translations[key];
    if (!message) {
      // Log only the first time a missing key is encountered
      if (!this._reportedMissingKeys) this._reportedMissingKeys = {};
      if (!this._reportedMissingKeys[key]) {
        console.warn(`Translation key not found: ${key}`);
        this._reportedMissingKeys[key] = true;
      }
      return key;
    }
    
    let text = message.message;
    
    // Safety check for message format
    if (!text || typeof text !== 'string') {
      console.warn(`Invalid message format for key: ${key}`);
      return key;
    }
    
    // Replace placeholders
    if (placeholders && typeof placeholders === 'object') {
      Object.keys(placeholders).forEach(placeholder => {
        if (placeholders[placeholder] !== undefined) {
          const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
          text = text.replace(regex, String(placeholders[placeholder]));
        }
      });
    }
    
    return text;
  }
  
  /**
   * Change the current language
   */
  async changeLanguage(lang) {
    if (!lang || typeof lang !== 'string') {
      console.error('Invalid language code:', lang);
      return false;
    }
    
    // Validate language is supported
    const availableLanguages = this.getAvailableLanguages();
    const isValidLanguage = availableLanguages.some(l => l.code === lang);
    
    if (!isValidLanguage) {
      console.warn(`Unsupported language: ${lang}, falling back to English`);
      lang = 'en';
    }
    
    this.currentLanguage = lang;
    await this.loadTranslations(lang);
    
    // Save language preference
    return new Promise(resolve => {
      chrome.storage.sync.set({ language: lang }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving language preference:', chrome.runtime.lastError);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
  
  /**
   * Get the current language
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  /**
   * Get available languages
   */
  getAvailableLanguages() {
    return [
      { code: 'ar', name: 'العربية', rtl: true },
      { code: 'da', name: 'Dansk' },
      { code: 'de', name: 'Deutsch' },
      { code: 'el', name: 'Ελληνικά' },
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'it', name: 'Italiano' },
      { code: 'ja', name: '日本語' },
      { code: 'nl', name: 'Nederlands' },
      { code: 'pl', name: 'Polski' },
      { code: 'pt', name: 'Português' },
      { code: 'sv', name: 'Svenska' },
      { code: 'zh_CN', name: '简体中文' }
    ];
  }
  
  /**
   * Check if current language is RTL
   */
  isRtl() {
    if (!this.initialized) {
      return false;
    }
    
    const languages = this.getAvailableLanguages();
    const currentLang = languages.find(lang => lang.code === this.currentLanguage);
    return currentLang && currentLang.rtl === true;
  }
  
  /**
   * Clear the translation cache to force reload
   */
  clearCache() {
    this.translationCache = {};
  }
}

// Create a singleton instance
const i18n = new I18n();

// Export the instance for both page and service worker contexts
(typeof window !== 'undefined' ? window : self).i18n = i18n;
