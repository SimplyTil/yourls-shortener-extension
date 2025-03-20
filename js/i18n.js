/**
 * Internationalization helper for YOURLS Link Shortener
 */
class I18n {
  constructor() {
    this.currentLanguage = 'en';
    this.translations = {};
    this.initialized = false;
  }
  
  /**
   * Initialize the translation system
   */
  async init() {
    // Load current language setting
    const settings = await this.getStoredSettings();
    this.currentLanguage = settings.language || 'en';
    
    // Load translations for the current language
    await this.loadTranslations(this.currentLanguage);
    this.initialized = true;
    
    return this;
  }
  
  /**
   * Get stored settings from Chrome storage
   */
  getStoredSettings() {
    return new Promise(resolve => {
      chrome.storage.sync.get(['language'], (items) => {
        resolve(items);
      });
    });
  }
  
  /**
   * Load translations for a specific language
   */
  async loadTranslations(lang) {
    try {
      const response = await fetch(chrome.runtime.getURL(`/_locales/${lang}/messages.json`));
      this.translations = await response.json();
    } catch (e) {
      console.error(`Failed to load translations for ${lang}:`, e);
      // Fallback to English
      if (lang !== 'en') {
        await this.loadTranslations('en');
      }
    }
  }
  
  /**
   * Get translation for a specific key
   */
  get(key, placeholders = {}) {
    if (!this.initialized) {
      console.warn('i18n not initialized, please call init() first');
      return key;
    }
    
    const message = this.translations[key];
    if (!message) {
      return key;
    }
    
    let text = message.message;
    
    // Replace placeholders
    Object.keys(placeholders).forEach(placeholder => {
      text = text.replace(new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'), placeholders[placeholder]);
    });
    
    return text;
  }
  
  /**
   * Change the current language
   */
  async changeLanguage(lang) {
    this.currentLanguage = lang;
    await this.loadTranslations(lang);
    
    // Save language preference
    return new Promise(resolve => {
      chrome.storage.sync.set({ language: lang }, () => {
        resolve(true);
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
      { code: 'en', name: 'English' },
      { code: 'de', name: 'Deutsch' },
      { code: 'fr', name: 'Français' },
      { code: 'es', name: 'Español' },
      { code: 'ja', name: '日本語' },
      { code: 'zh_CN', name: '简体中文' },
      { code: 'ar', name: 'العربية', rtl: true }
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
}

// Create a singleton instance
const i18n = new I18n();

// Export the instance
window.i18n = i18n;
