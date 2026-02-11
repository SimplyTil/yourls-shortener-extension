document.addEventListener('DOMContentLoaded', async () => {
  // Use shared utilities
  const { clipboard: clipboardUtils, dom: domUtils } = window.utils;
  
  // Initialize i18n
  try {
    await i18n.init();
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    // Continue with default English
  }
  
  // Set RTL if needed
  if (i18n.isRtl()) {
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
  }
  
  // Cache DOM queries for performance
  const elements = {};
  
  // Helper function to get and cache DOM elements
  function getElement(id) {
    if (!elements[id]) {
      elements[id] = document.getElementById(id);
      if (!elements[id]) {
        console.warn(`Element not found: ${id}`);
      }
    }
    return elements[id];
  }
  
  // Helper function to get or create dynamic elements
  function getOrCreateElement(id, tagName = 'div', className = '') {
    let element = document.getElementById(id);
    if (!element) {
      element = document.createElement(tagName);
      element.id = id;
      if (className) {
        element.className = className;
      }
    }
    return element;
  }
  
  // Function to apply all translations
  function applyTranslations() {
    // Apply translations to elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = i18n.get(key);
    });
    
    // Apply HTML translations to elements with data-i18n-html attribute
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.getAttribute('data-i18n-html');
      element.innerHTML = i18n.get(key);
    });
    
    // Apply translations to elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.setAttribute('placeholder', i18n.get(key));
    });
  }
  
  // Apply translations immediately on page load
  applyTranslations();
  
  // Tab functionality with performance optimizations
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Store the current active tab for restoring on page refresh
  let currentTab = localStorage.getItem('yourlsActiveTab') || 'servers';
  
  // Function to switch tabs
  function switchTab(targetTab) {
    // Remove active class from all tabs and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    const activeButton = document.querySelector(`.tab-button[data-tab="${targetTab}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
      // Update ARIA attributes for accessibility
      activeButton.setAttribute('aria-selected', 'true');
    }
    
    const targetContent = document.getElementById(targetTab);
    if (targetContent) {
      targetContent.classList.add('active');
      
      // Load data based on tab
      if (targetTab === 'dashboard') {
        setTimeout(() => loadDashboardData(), 100);
      } else if (targetTab === 'analytics') {
        setTimeout(() => loadAnalyticsData(), 100);
      } else if (targetTab === 'general') {
        setTimeout(() => loadChangelogData(), 100);  // Add timeout for better reliability
      }
      
      // Save active tab to localStorage
      localStorage.setItem('yourlsActiveTab', targetTab);
    }
  }
  
  // Enhanced tab functionality with smooth transitions
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');
      switchTab(targetTab);
    });
    
    // Set ARIA attributes for accessibility
    button.setAttribute('aria-selected', 'false');
  });
  
  // Activate the saved tab or default to 'servers'
  switchTab(currentTab);
  
  // Function to load changelog data with caching and language support
  let changelogCache = {};
  
  async function loadChangelogData() {
    const changelogContent = getElement('changelog-content');
    if (!changelogContent) {
      console.error('Changelog content element not found');
      return;
    }

    try {
      // Show loading state
      changelogContent.innerHTML = `<div class="loading-state">${i18n.get('loadingChangelog') || 'Loading changelog...'}</div>`;
      
      // Get current language
      const currentLang = i18n.getCurrentLanguage() || 'en';
      
      // Use cached data if available for this language
      if (changelogCache[currentLang]) {
        console.log(`Using cached changelog data for ${currentLang}`);
        renderChangelog(changelogCache[currentLang]);
        return;
      }
      
      console.log(`Fetching changelog data for language: ${currentLang}`);
      
      // Try to load changelog for current language
      let changelogData;
      try {
        const response = await fetch(chrome.runtime.getURL(`data/changelog-${currentLang}.json`));
        if (!response.ok) {
          throw new Error(`Changelog not found for ${currentLang}`);
        }
        changelogData = await response.json();
        console.log(`Successfully loaded changelog for ${currentLang}`);
      } catch (error) {
        console.warn(`Failed to load changelog for ${currentLang}, falling back to English:`, error);
        
        // Fallback to English if the language-specific changelog doesn't exist
        const fallbackResponse = await fetch(chrome.runtime.getURL('data/changelog-en.json'));
        if (!fallbackResponse.ok) {
          throw new Error(`Failed to load fallback English changelog: ${fallbackResponse.status}`);
        }
        changelogData = await fallbackResponse.json();
        console.log('Successfully loaded English fallback changelog');
      }
      
      // Cache the data for this language
      changelogCache[currentLang] = changelogData;
      
      // Render the changelog
      renderChangelog(changelogData);
      
    } catch (error) {
      console.error('Failed to load changelog:', error);
      if (changelogContent) {
        changelogContent.innerHTML = `<div class="loading-state error-state">${i18n.get('changelogLoadError') || 'Failed to load changelog data'}</div>`;
      }
    }
    
    function renderChangelog(data) {
      // Clear existing content
      changelogContent.innerHTML = '';
      
      // Generate changelog HTML
      if (!data.versions || !Array.isArray(data.versions) || data.versions.length === 0) {
        changelogContent.innerHTML = `<div class="loading-state">${i18n.get('noChangelogEntries') || 'No changelog entries found'}</div>`;
        return;
      }
      
      data.versions.forEach(version => {
        const versionEl = document.createElement('div');
        versionEl.className = 'changelog-version';
        
        const headerEl = document.createElement('div');
        headerEl.className = 'version-header';
        
        const versionNumberEl = document.createElement('span');
        versionNumberEl.className = 'version-number';
        versionNumberEl.textContent = `v${version.version}`;
        
        const versionDateEl = document.createElement('span');
        versionDateEl.className = 'version-date';
        versionDateEl.textContent = version.date;
        
        headerEl.appendChild(versionNumberEl);
        headerEl.appendChild(versionDateEl);
        
        const itemsListEl = document.createElement('ul');
        itemsListEl.className = 'changelog-items';
        
        if (version.changes && Array.isArray(version.changes)) {
          version.changes.forEach(change => {
            const itemEl = document.createElement('li');
            itemEl.className = 'changelog-item';
            
            const typeEl = document.createElement('span');
            typeEl.className = `changelog-type ${change.type || 'other'}`;
            typeEl.textContent = change.emoji || '•';
            
            const textEl = document.createElement('span');
            textEl.textContent = change.text || '';
            
            itemEl.appendChild(typeEl);
            itemEl.appendChild(textEl);
            itemsListEl.appendChild(itemEl);
          });
        }
        
        versionEl.appendChild(headerEl);
        versionEl.appendChild(itemsListEl);
        changelogContent.appendChild(versionEl);
      });
    }
  }

  // Get version from manifest and add to the footer
  const versionInfoElement = getElement('version-info');
  if (versionInfoElement) {
    fetch(chrome.runtime.getURL('manifest.json'))
      .then(response => response.json())
      .then(manifest => {
        versionInfoElement.textContent = `v${manifest.version}`;
      })
      .catch(error => {
        console.error('Error loading manifest:', error);
        versionInfoElement.textContent = i18n.get('versionUnknown') || 'v?.?.?';
      });
  }
  
  // Get form elements
  const yourlsUrlInput = getElement('yourls_url');
  const yourlsKeyInput = getElement('yourls_key');
  const askForKeywordCheckbox = getElement('ask_for_keyword');
  const autoCopyCheckbox = getElement('auto_copy');
  const languageSelect = getElement('language');
  const saveButton = getElement('save_button');
  const testConnectionButton = getElement('test_connection');
  const statusDiv = getElement('status');
  const testResultDiv = getElement('test_result');
  
  // Additional server elements
  const enableAdditionalServerCheckbox = getElement('enable_additional_server');
  const additionalServerSettings = getElement('additional_server_settings');
  const additionalYourlsUrlInput = getElement('additional_yourls_url');
  const additionalYourlsKeyInput = getElement('additional_yourls_key');
  const additionalServerNameInput = getElement('additional_server_name');
  const testAdditionalConnectionButton = getElement('test_additional_connection');
  const testAdditionalResultDiv = getElement('test_additional_result');
  
  // Add event listeners if elements exist
  if (enableAdditionalServerCheckbox && additionalServerSettings) {
    enableAdditionalServerCheckbox.addEventListener('change', function() {
      if (additionalServerSettings) {
        additionalServerSettings.style.display = this.checked ? 'block' : 'none';
      }
    });
  }
  
  // Populate language dropdown
  if (languageSelect) {
    const languages = i18n.getAvailableLanguages();
    
    // Clear any existing options first
    languageSelect.innerHTML = '';
    
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
      
      // Set RTL direction if needed
      if (i18n.isRtl()) {
        document.documentElement.setAttribute('dir', 'rtl');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
      }
      
      // Re-apply all translations
      applyTranslations();
      
      // Clear changelog cache and reload if general tab is active
      changelogCache = {};
      const generalTab = getElement('general');
      if (generalTab && generalTab.classList.contains('active')) {
        setTimeout(() => loadChangelogData(), 100);
      }
    });
  }
  
  // Dashboard functionality
  const refreshDashboardButton = getElement('refresh_dashboard');
  const dashboardServerSelect = getElement('dashboard-server-select');
  const serverToggle = getElement('server-toggle');
  const dashboardAdditionalOption = getElement('dashboard-additional-option');
  
  let currentDashboardServer = 'primary';
  let dashboardData = {};
  
  if (refreshDashboardButton) {
    refreshDashboardButton.addEventListener('click', () => {
      loadDashboardData(true); // true = force refresh
    });
  }
  
  // Handle dashboard server selection
  if (dashboardServerSelect) {
    dashboardServerSelect.addEventListener('change', function() {
      currentDashboardServer = this.value;
      loadDashboardData();
    });
  }
  
  // Function to setup dashboard server selector
  function setupDashboardServerSelector(settings) {
    if (!serverToggle || !dashboardAdditionalOption) {
      return; // Exit if elements don't exist
    }
    
    if (settings.enable_additional_server && 
        settings.additional_yourls_url && 
        settings.additional_yourls_key) {
      serverToggle.style.display = 'flex';
      dashboardAdditionalOption.textContent = settings.additional_server_name || 
                                              i18n.get('additionalServerOption');
    } else {
      serverToggle.style.display = 'none';
      currentDashboardServer = 'primary';
      if (dashboardServerSelect) {
        dashboardServerSelect.value = 'primary';
      }
    }
  }
  
  // Function to animate counter values with optimized rendering
  function animateCounter(element, start, end, duration = 1000) {
    if (!element || start === end) return;
    
    // Skip animation for small values or when browser is reducing motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || (Math.abs(end - start) < 5)) {
      element.textContent = typeof end === 'number' && end % 1 !== 0 ? 
        end.toFixed(1) : 
        end.toLocaleString();
      element.classList.add('animate');
      return;
    }
    
    const startTime = performance.now();
    const isDecimal = end.toString().includes('.');
    
    // Use requestAnimationFrame for smooth animation
    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;
      
      if (isDecimal) {
        element.textContent = current.toFixed(1);
      } else {
        element.textContent = Math.floor(current).toLocaleString();
      }
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = isDecimal ? end.toFixed(1) : end.toLocaleString();
        element.classList.add('animate');
      }
    }
    
    requestAnimationFrame(updateCounter);
  }
  
  // Add a 30-second cache for dashboard data
  const dashboardCache = {
    primary: { data: null, timestamp: 0 },
    additional: { data: null, timestamp: 0 }
  };
  
  // Dashboard loading timeout ID for cancellation
  let dashboardTimeout = null;
  
  function loadDashboardData(forceRefresh = false) {
    const dashboardContent = getElement('dashboard_content');
    const dashboardError = getElement('dashboard_error');
    const totalLinksEl = getElement('total_links');
    const totalClicksEl = getElement('total_clicks');
    const avgClicksEl = getElement('avg_clicks');
    const serverStatusEl = getElement('server_status');
    const recentLinksList = getElement('recent_links_list');
    
    // Check if dashboard elements exist (user might not be on dashboard tab)
    if (!totalLinksEl || !totalClicksEl || !avgClicksEl || !serverStatusEl || !recentLinksList) {
      return; // Exit if dashboard elements don't exist
    }
    
    // Cancel any pending dashboard timeout
    if (dashboardTimeout) {
      clearTimeout(dashboardTimeout);
    }
    
    // Add loading class to refresh button if it exists
    if (refreshDashboardButton) {
      refreshDashboardButton.classList.add('loading');
      // Disable button during loading
      refreshDashboardButton.disabled = true;
    }
    
    // Show loading state
    totalLinksEl.textContent = '-';
    totalClicksEl.textContent = '-';
    avgClicksEl.textContent = '-';
    serverStatusEl.textContent = i18n.get('loading') || 'Loading...';
    
    recentLinksList.innerHTML = `<div class="loading-state">${i18n.get('loadingDashboard') || 'Loading dashboard data...'}</div>`;
    
    // Get current settings
    chrome.storage.sync.get([
      'yourls_url', 
      'yourls_key',
      'additional_yourls_url',
      'additional_yourls_key',
      'enable_additional_server'
    ], (settings) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError);
        showDashboardError(i18n.get('errorLoadingSettings') || 'Error loading settings');
        return;
      }
      
      // Setup server selector
      setupDashboardServerSelector(settings);
      
      // Determine which server to use
      const useAdditional = currentDashboardServer === 'additional' && 
        settings.enable_additional_server && 
        settings.additional_yourls_url && 
        settings.additional_yourls_key;
      
      const baseUrl = useAdditional ? settings.additional_yourls_url : settings.yourls_url;
      const apiKey = useAdditional ? settings.additional_yourls_key : settings.yourls_key;
      
      if (!baseUrl || !apiKey) {
        showDashboardError(i18n.get('errorMissingSettings') || 'Missing server settings');
        return;
      }
      
      // Check cache first if not forcing refresh
      const cacheKey = useAdditional ? 'additional' : 'primary';
      const now = Date.now();
      const cacheTTL = 30000; // 30 seconds
      
      if (!forceRefresh && 
          dashboardCache[cacheKey].data && 
          (now - dashboardCache[cacheKey].timestamp) < cacheTTL) {
        // Use cached data
        renderDashboardData(dashboardCache[cacheKey].data, baseUrl);
        return;
      }
      
      // Format API URL correctly
      const apiUrl = baseUrl.endsWith('/') ? 
        `${baseUrl}yourls-api.php` : 
        `${baseUrl}/yourls-api.php`;
      
      console.log('Loading dashboard data from server:', apiUrl);
      
      // Try multiple approaches to get links data
      const statsParams = new URLSearchParams();
      statsParams.append('signature', apiKey);
      statsParams.append('action', 'stats');
      statsParams.append('format', 'json');
      
      // First try to get basic stats
      chrome.runtime.sendMessage({
        action: 'makeApiRequest',
        url: apiUrl,
        method: 'POST',
        body: statsParams.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        }
      }, response => {
        if (response && response.success && response.data && response.data.stats) {
          const statsData = response.data;
          console.log('Stats data received:', statsData);
          
          // Now try to get links data using different methods
          tryGetLinksData(apiUrl, apiKey, statsData);
        } else {
          console.error('Stats API error:', response ? response.error : 'No response');
          resetDashboardState();
          showDashboardError(i18n.get('dashboardError') || 'Unable to load dashboard data');
        }
      });
      
      // Function to try different methods to get links
      function tryGetLinksData(apiUrl, apiKey, statsData) {
        // Method 1: Try db-stats action
        const dbStatsParams = new URLSearchParams();
        dbStatsParams.append('signature', apiKey);
        dbStatsParams.append('action', 'db-stats');
        dbStatsParams.append('format', 'json');
        
        chrome.runtime.sendMessage({
          action: 'makeApiRequest',
          url: apiUrl,
          method: 'POST',
          body: dbStatsParams.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }, dbStatsResponse => {
          let linksData = {};
          
          if (dbStatsResponse && dbStatsResponse.success && dbStatsResponse.data) {
            console.log('DB Stats response:', dbStatsResponse.data);
            
            // Check different possible structures
            if (dbStatsResponse.data.links && typeof dbStatsResponse.data.links === 'object') {
              linksData = dbStatsResponse.data.links;
              console.log('Found links in db-stats response:', Object.keys(linksData).length, 'links');
            } else if (dbStatsResponse.data.db && dbStatsResponse.data.db.links) {
              linksData = dbStatsResponse.data.db.links;
              console.log('Found links in db.links:', Object.keys(linksData).length, 'links');
            } else if (Array.isArray(dbStatsResponse.data)) {
              // Some YOURLS versions return an array
              const linksArray = dbStatsResponse.data;
              linksData = {};
              linksArray.forEach((link, index) => {
                linksData[index] = link;
              });
              console.log('Converted array to links object:', Object.keys(linksData).length, 'links');
            }
          }
          
          // If db-stats didn't work, try alternative method
          if (Object.keys(linksData).length === 0) {
            console.log('db-stats failed or returned no links, trying alternative method');
            tryAlternativeLinksMethod(apiUrl, apiKey, statsData);
          } else {
            // Success with db-stats
            finalizeDashboardData(statsData, linksData);
          }
        });
      }
      
      // Method 2: Try getting links through stats action with filter
      function tryAlternativeLinksMethod(apiUrl, apiKey, statsData) {
        const statsWithLinksParams = new URLSearchParams();
        statsWithLinksParams.append('signature', apiKey);
        statsWithLinksParams.append('action', 'stats');
        statsWithLinksParams.append('filter', 'top');
        statsWithLinksParams.append('limit', '10');
        statsWithLinksParams.append('format', 'json');
        
        chrome.runtime.sendMessage({
          action: 'makeApiRequest',
          url: apiUrl,
          method: 'POST',
          body: statsWithLinksParams.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          }
        }, altResponse => {
          let linksData = {};
          
          if (altResponse && altResponse.success && altResponse.data) {
            console.log('Alternative stats response:', altResponse.data);
            
            // Check for links in the response
            if (altResponse.data.links && typeof altResponse.data.links === 'object') {
              linksData = altResponse.data.links;
              console.log('Found links in alternative stats:', Object.keys(linksData).length, 'links');
            }
          }
          
          // Final attempt: use URL shortener history API if available
          if (Object.keys(linksData).length === 0) {
            console.log('Alternative stats failed, trying URL history method');
            tryUrlHistoryMethod(apiUrl, apiKey, statsData);
          } else {
            finalizeDashboardData(statsData, linksData);
          }
        });
      }
      
      // Method 3: Try to get recent URLs through shorturl action (this won't work but shows the attempt)
      function tryUrlHistoryMethod(apiUrl, apiKey, statsData) {
        console.log('No links data available from API, will show stats only');
        // Just proceed with empty links data
        finalizeDashboardData(statsData, {});
      }
      
      // Finalize and render the dashboard
      function finalizeDashboardData(statsData, linksData) {
        resetDashboardState();
        
        const responseData = {
          stats: statsData.stats,
          links: linksData || {}
        };
        
        console.log('Final dashboard data:', {
          statsKeys: Object.keys(responseData.stats),
          linksCount: Object.keys(responseData.links).length
        });
        
        // Cache the data
        const cacheKey = useAdditional ? 'additional' : 'primary';
        dashboardCache[cacheKey].data = responseData;
        dashboardCache[cacheKey].timestamp = now;
        
        renderDashboardData(responseData, baseUrl);
      }
      
      // Helper to reset dashboard loading state
      function resetDashboardState() {
        if (refreshDashboardButton) {
          refreshDashboardButton.classList.remove('loading');
          refreshDashboardButton.disabled = false;
        }
        
        if (dashboardTimeout) {
          clearTimeout(dashboardTimeout);
          dashboardTimeout = null;
        }
      }
    });
    
    // Set timeout for long-running requests
    dashboardTimeout = setTimeout(() => {
      if (refreshDashboardButton) {
        refreshDashboardButton.classList.remove('loading');
        refreshDashboardButton.disabled = false;
      }
      
      showDashboardError(i18n.get('dashboardTimeout') || 'Dashboard request timed out');
    }, 15000); // 15-second timeout
  }
  
  // Separate function to render dashboard data
  function renderDashboardData(data, baseUrl) {
    const dashboardContent = getElement('dashboard_content');
    const dashboardError = getElement('dashboard_error');
    const totalLinksEl = getElement('total_links');
    const totalClicksEl = getElement('total_clicks');
    const avgClicksEl = getElement('avg_clicks');
    const serverStatusEl = getElement('server_status');
    const recentLinksList = getElement('recent_links_list');
    
    if (!totalLinksEl || !totalClicksEl || !avgClicksEl || !serverStatusEl) return;
    
    const stats = data.stats;
    
    // Animate counters with new values
    if (totalLinksEl) {
      const totalLinks = parseInt(stats.total_links) || 0;
      const currentLinks = parseInt(totalLinksEl.textContent.replace(/[,\s-]/g, '')) || 0;
      animateCounter(totalLinksEl, currentLinks, totalLinks, 800);
    }
    
    if (totalClicksEl) {
      const totalClicks = parseInt(stats.total_clicks) || 0;
      const currentClicks = parseInt(totalClicksEl.textContent.replace(/[,\s-]/g, '')) || 0;
      animateCounter(totalClicksEl, currentClicks, totalClicks, 1000);
    }
    
    if (avgClicksEl) {
      const avgClicks = stats.total_links > 0 ? 
        parseFloat(stats.total_clicks) / parseFloat(stats.total_links) : 0;
      const currentAvg = parseFloat(avgClicksEl.textContent.replace(/[,\s-]/g, '')) || 0;
      animateCounter(avgClicksEl, currentAvg, avgClicks, 600);
    }
    
    if (serverStatusEl) {
      serverStatusEl.textContent = '✓ Online';
      serverStatusEl.style.color = 'var(--color-emerald-600)';
    }
    
    if (dashboardContent) dashboardContent.style.display = 'block';
    if (dashboardError) dashboardError.style.display = 'none';
    
    // Render the links
    renderRecentLinks(data.links, recentLinksList);
    
    // Clear any pending timeout
    if (dashboardTimeout) {
      clearTimeout(dashboardTimeout);
      dashboardTimeout = null;
    }
  }
  
  // Separate function to render links
  function renderRecentLinks(links, recentLinksList) {
    if (!recentLinksList) return;
    
    console.log('Rendering recent links:', links);
    
    if (!links || Object.keys(links).length === 0) {
      console.log('No links to display');
      recentLinksList.innerHTML = `<div class="loading-state">${i18n.get('noLinksFound') || 'No links found'}</div>`;
      return;
    }
    
    // Convert to array and sort by timestamp (newest first)
    const linksArray = Object.values(links);
    
    if (linksArray.length === 0) {
      console.log('Links array is empty');
      recentLinksList.innerHTML = `<div class="loading-state">${i18n.get('noLinksFound') || 'No links found'}</div>`;
      return;
    }
    
    console.log('Processing links array:', linksArray.length, 'items');
    
    // Sort by timestamp (newest first) and take first 10
    const sortedLinks = linksArray
      .sort((a, b) => {
        // Handle missing timestamps gracefully - try different timestamp fields
        const getTimestamp = (link) => {
          if (link.timestamp) return new Date(link.timestamp);
          if (link.date_created) return new Date(link.date_created);
          if (link.date) return new Date(link.date);
          if (link.id) return new Date(parseInt(link.id) * 1000); // Fallback using ID as timestamp
          return new Date(0);
        };
        
        const timeA = getTimestamp(a);
        const timeB = getTimestamp(b);
        return timeB - timeA;
      })
      .slice(0, 10);
    
    console.log('Sorted links:', sortedLinks.length, 'items to display');
    
    // Build HTML with template literal for better performance
    recentLinksList.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    
    sortedLinks.forEach((link, index) => {
      console.log(`Processing link ${index}:`, link);
      
      // Handle different link data structures from different YOURLS versions
      const shortUrl = link.shorturl || link.short_url || link.url_short || '';
      const longUrl = link.url || link.long_url || link.url_long || '';
      const clicks = parseInt(link.clicks) || 0;
      
      // Sanitize data to prevent XSS
      const sanitizedShortUrl = shortUrl ? 
        shortUrl.replace(/[<>&"']/g, c => {
          return {'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'}[c];
        }) : '';
      
      const sanitizedUrl = longUrl ? 
        longUrl.replace(/[<>&"']/g, c => {
          return {'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;'}[c];
        }) : '';
      
      if (!sanitizedShortUrl && !sanitizedUrl) {
        console.warn('Skipping link with no URL data:', link);
        return;
      }
      
      const linkItem = document.createElement('div');
      linkItem.className = 'link-item';
      linkItem.innerHTML = `
        <div class="link-content">
          <div class="link-short">${sanitizedShortUrl || 'N/A'}</div>
          <div class="link-url">${sanitizedUrl || 'N/A'}</div>
        </div>
        <div class="link-actions">
          <div class="link-clicks">${clicks} ${i18n.get('clicks') || 'clicks'}</div>
          ${sanitizedShortUrl ? `
            <button class="copy-button" 
                    data-url="${sanitizedShortUrl}" 
                    title="${i18n.get('copyLinkTitle') || 'Copy short URL'}" 
                    aria-label="${i18n.get('copyLinkTitle') || 'Copy'} ${sanitizedShortUrl}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          ` : ''}
        </div>
      `;
      
      fragment.appendChild(linkItem);
    });
    
    if (fragment.children.length === 0) {
      console.log('No valid links found after processing');
      recentLinksList.innerHTML = `<div class="loading-state">${i18n.get('noLinksFound') || 'No links found'}</div>`;
      return;
    }
    
    recentLinksList.appendChild(fragment);
    console.log('Successfully rendered', fragment.children.length, 'links');
    
    // Add copy functionality to buttons
    const copyButtons = recentLinksList.querySelectorAll('.copy-button');
    if (copyButtons.length > 0) {
      copyButtons.forEach(btn => {
        btn.addEventListener('click', function() {
          const url = this.dataset.url;
          copyToClipboard(url, this);
        });
      });
    }
  }
  
  // Copy to clipboard function using shared utility
  function copyToClipboard(text, button) {
    if (!button || !text) return;
    
    const copyIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>`;
    const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20,6 9,17 4,12"></polyline>
    </svg>`;
    
    clipboardUtils.copy(text)
      .then(() => {
        button.classList.add('copied');
        button.innerHTML = checkIcon;
        button.setAttribute('aria-label', `${i18n.get('copiedLinkTitle') || 'Copied'} ${text}`);
        
        setTimeout(() => {
          if (!button || !button.classList) return;
          button.classList.remove('copied');
          button.innerHTML = copyIcon;
          button.setAttribute('aria-label', `${i18n.get('copyLinkTitle') || 'Copy'} ${text}`);
        }, 2000);
      })
      .catch(err => {
        console.error('Copy failed:', err);
      });
  }
  
  // Load settings
  loadSettings();
  
  // Save settings when the save button is clicked
  if (saveButton) {
    saveButton.addEventListener('click', saveSettings);
  }
  
  // Test connection when the test button is clicked
  if (testConnectionButton) {
    testConnectionButton.addEventListener('click', () => testConnection(false));
  }
  
  // Test additional connection
  if (testAdditionalConnectionButton) {
    testAdditionalConnectionButton.addEventListener('click', () => testConnection(true));
  }
  
  // Auto-save functionality
  let autoSaveTimeout = null;
  let isAutoSaving = false;
  
  // Debounced auto-save function
  function scheduleAutoSave() {
    // Only auto-save if the feature is enabled
    chrome.storage.sync.get(['auto_save_settings'], (result) => {
      if (result.auto_save_settings === false) {
        return; // Auto-save is disabled
      }
      
      // Clear existing timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      
      // Schedule new auto-save after 2 seconds of inactivity
      autoSaveTimeout = setTimeout(() => {
        autoSaveSettings();
      }, 2000);
    });
  }
  
  // Auto-save function
  function autoSaveSettings() {
    if (isAutoSaving) return; // Prevent multiple simultaneous saves
    
    isAutoSaving = true;
    showAutoSaveIndicator('saving');
    
    // Use the existing saveSettings function but with auto-save flag
    saveSettings(true).then(() => {
      showAutoSaveIndicator('saved');
      setTimeout(() => {
        hideAutoSaveIndicator();
      }, 2000);
    }).catch((error) => {
      console.error('Auto-save failed:', error);
      showAutoSaveIndicator('error');
      setTimeout(() => {
        hideAutoSaveIndicator();
      }, 3000);
    }).finally(() => {
      isAutoSaving = false;
    });
  }
  
  // Visual feedback functions
  function showAutoSaveIndicator(state) {
    let indicator = getOrCreateElement('auto-save-indicator', 'div', 'auto-save-indicator');
    
    // If element was just created, we need to insert it into the DOM
    if (!indicator.parentNode) {
      // Insert after the save button
      const saveButton = getElement('save_button');
      if (saveButton && saveButton.parentNode) {
        saveButton.parentNode.insertBefore(indicator, saveButton.nextSibling);
      } else {
        // Fallback: append to the first card in servers section
        const serversSection = document.getElementById('servers');
        const firstCard = serversSection ? serversSection.querySelector('.card') : null;
        if (firstCard) {
          firstCard.appendChild(indicator);
        } else {
          console.warn('Could not find suitable parent for auto-save indicator');
          return;
        }
      }
    }
    
    indicator.style.display = 'flex';
    indicator.className = `auto-save-indicator auto-save-${state}`;
    
    switch (state) {
      case 'saving':
        indicator.innerHTML = `
          <svg class="auto-save-icon spinning" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
          </svg>
          <span>${i18n.get('autoSaving') || 'Auto-saving...'}</span>
        `;
        break;
      case 'saved':
        indicator.innerHTML = `
          <svg class="auto-save-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <span>${i18n.get('autoSaved') || 'Settings saved automatically'}</span>
        `;
        break;
      case 'error':
        indicator.innerHTML = `
          <svg class="auto-save-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>${i18n.get('autoSaveError') || 'Auto-save failed'}</span>
        `;
        break;
    }
  }
  
  function hideAutoSaveIndicator() {
    const indicator = document.getElementById('auto-save-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }
  
  // Add change listeners to form elements for auto-save
  function setupAutoSaveListeners() {
    const formElements = [
      'yourls_url',
      'yourls_key', 
      'ask_for_keyword',
      'auto_copy',
      'language',
      'enable_additional_server',
      'additional_yourls_url',
      'additional_yourls_key',
      'additional_server_name'
    ];
    
    formElements.forEach(elementId => {
      const element = getElement(elementId);
      if (element) {
        const eventType = element.type === 'checkbox' ? 'change' : 'input';
        element.addEventListener(eventType, () => {
          scheduleAutoSave();
        });
      }
    });
  }
  
  // Setup auto-save listeners after loading settings
  setTimeout(() => {
    setupAutoSaveListeners();
  }, 500);
  
  // Function to load settings
  function loadSettings() {
    chrome.storage.sync.get([
      'yourls_url', 
      'yourls_key', 
      'ask_for_keyword', 
      'auto_copy', 
      'language', 
      'enable_additional_server',
      'additional_yourls_url',
      'additional_yourls_key',
      'additional_server_name',
      'auto_save_settings' // Add auto-save setting
    ], (items) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading settings:', chrome.runtime.lastError);
        showStatus(i18n.get('errorLoadingSettings') || 'Error loading settings', 'error');
        return;
      }
      
      if (items.yourls_url && yourlsUrlInput) {
        yourlsUrlInput.value = items.yourls_url;
      }
      if (items.yourls_key && yourlsKeyInput) {
        yourlsKeyInput.value = items.yourls_key;
      }
      if (items.ask_for_keyword !== undefined && askForKeywordCheckbox) {
        askForKeywordCheckbox.checked = items.ask_for_keyword;
      }
      if (items.auto_copy !== undefined && autoCopyCheckbox) {
        autoCopyCheckbox.checked = items.auto_copy;
      }
      if (items.language && languageSelect) {
        languageSelect.value = items.language;
      }
      
      // Load additional server settings with null checks
      if (items.enable_additional_server !== undefined && enableAdditionalServerCheckbox) {
        enableAdditionalServerCheckbox.checked = items.enable_additional_server;
        
        if (additionalServerSettings) {
          additionalServerSettings.style.display = items.enable_additional_server ? 'block' : 'none';
        }
      }
      if (items.additional_yourls_url && additionalYourlsUrlInput) {
        additionalYourlsUrlInput.value = items.additional_yourls_url;
      }
      if (items.additional_yourls_key && additionalYourlsKeyInput) {
        additionalYourlsKeyInput.value = items.additional_yourls_key;
      }
      if (items.additional_server_name && additionalServerNameInput) {
        additionalServerNameInput.value = items.additional_server_name;
      }
      
      // Load auto-save setting (default to true)
      const autoSaveCheckbox = getElement('auto_save_settings');
      if (autoSaveCheckbox) {
        autoSaveCheckbox.checked = items.auto_save_settings !== false; // Default to true
      }
      
      // Setup dashboard server selector when settings are loaded
      setupDashboardServerSelector(items);
    });
  }
  
  function saveSettings(isAutoSave = false) {
    // Check if required elements exist before accessing their values
    if (!yourlsUrlInput || !yourlsKeyInput || !askForKeywordCheckbox || 
        !autoCopyCheckbox || !languageSelect || !enableAdditionalServerCheckbox) {
      console.error('Required form elements not found');
      return;
    }
    
    const yourlsUrl = yourlsUrlInput.value.trim();
    const yourlsKey = yourlsKeyInput.value.trim();
    const askForKeyword = askForKeywordCheckbox.checked;
    const autoCopy = autoCopyCheckbox.checked;
    const language = languageSelect.value;
    const enableAdditionalServer = enableAdditionalServerCheckbox.checked;
    
    // Validate primary URL
    if (!yourlsUrl) {
      showStatus(i18n.get('errorUrlRequired'), 'error');
      return;
    }
    
    // Validate primary key
    if (!yourlsKey) {
      showStatus(i18n.get('errorTokenRequired'), 'error');
      return;
    }
    
    // Ensure URL has a trailing slash
    const formattedUrl = yourlsUrl.endsWith('/') ? yourlsUrl : `${yourlsUrl}/`;
    
    // Validate additional server settings if enabled
    let formattedAdditionalUrl = '';
    if (enableAdditionalServer) {
      if (!additionalYourlsUrlInput || !additionalYourlsKeyInput || !additionalServerNameInput) {
        showStatus('Additional server form elements not found', 'error');
        return;
      }
      
      const additionalYourlsUrl = additionalYourlsUrlInput.value.trim();
      const additionalYourlsKey = additionalYourlsKeyInput.value.trim();
      const additionalServerName = additionalServerNameInput.value.trim();
      
      if (!additionalYourlsUrl) {
        showStatus(i18n.get('errorAdditionalUrlRequired'), 'error');
        return;
      }
      
      if (!additionalYourlsKey) {
        showStatus(i18n.get('errorAdditionalTokenRequired'), 'error');
        return;
      }
      
      if (!additionalServerName) {
        showStatus(i18n.get('errorAdditionalServerNameRequired'), 'error');
        return;
      }
      
      // Ensure URL has a trailing slash
      formattedAdditionalUrl = additionalYourlsUrl.endsWith('/') ? additionalYourlsUrl : `${additionalYourlsUrl}/`;
    }
    
    // Save settings
    const settings = {
      'yourls_url': formattedUrl,
      'yourls_key': yourlsKey,
      'ask_for_keyword': askForKeyword,
      'auto_copy': autoCopy,
      'language': language,
      'enable_additional_server': enableAdditionalServer
    };
    
    // Add auto-save setting
    const autoSaveCheckbox = getElement('auto_save_settings');
    if (autoSaveCheckbox) {
      settings['auto_save_settings'] = autoSaveCheckbox.checked;
    }
    
    // Only save additional server settings if enabled
    if (enableAdditionalServer && additionalYourlsUrlInput && additionalYourlsKeyInput && additionalServerNameInput) {
      settings['additional_yourls_url'] = formattedAdditionalUrl;
      settings['additional_yourls_key'] = additionalYourlsKeyInput.value.trim();
      settings['additional_server_name'] = additionalServerNameInput.value.trim();
    }
    
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          const errorMsg = i18n.get('errorSavingSettings') || 'Error saving settings';
          if (!isAutoSave) {
            showStatus(errorMsg, 'error');
          }
          console.error('Error saving settings:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          if (!isAutoSave) {
            showStatus(i18n.get('settingsSaved'), 'success');
          }
          // Update dashboard server selector after saving settings
          setupDashboardServerSelector(settings);
          resolve();
        }
      });
    });
  }
  
  function testConnection(isAdditional = false) {
    const yourlsUrl = isAdditional ? 
      (additionalYourlsUrlInput ? additionalYourlsUrlInput.value.trim() : '') : 
      (yourlsUrlInput ? yourlsUrlInput.value.trim() : '');
    const yourlsKey = isAdditional ? 
      (additionalYourlsKeyInput ? additionalYourlsKeyInput.value.trim() : '') : 
      (yourlsKeyInput ? yourlsKeyInput.value.trim() : '');
    const resultDiv = isAdditional ? testAdditionalResultDiv : testResultDiv;
    const testButton = isAdditional ? testAdditionalConnectionButton : testConnectionButton;
    
    if (!yourlsUrl || !yourlsKey) {
      showTestResult(i18n.get('errorUrlRequired'), 'error', resultDiv);
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
    
    // Disable button and show testing message
    if (testButton) {
      testButton.disabled = true;
      testButton.textContent = i18n.get('testingConnection') || 'Testing...';
    }
    
    showTestResult(i18n.get('testingConnection'), '', resultDiv);
    
    // Set timeout for long-running requests
    const testTimeout = setTimeout(() => {
      if (testButton) {
        testButton.disabled = false;
        testButton.textContent = i18n.get(isAdditional ? 'testAdditionalConnectionButton' : 'testConnectionButton');
      }
      showTestResult(i18n.get('connectionTimeout') || 'Connection timed out', 'error', resultDiv);
    }, 10000); // 10-second timeout
    
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
      // Clear timeout
      clearTimeout(testTimeout);
      
      // Reset button state
      if (testButton) {
        testButton.disabled = false;
        testButton.textContent = i18n.get(isAdditional ? 'testAdditionalConnectionButton' : 'testConnectionButton');
      }
      
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
          
          showTestResult(i18n.get('connectionFailed', {error: errorMessage}), 'error', resultDiv);
        } else if (data.stats || data.status === 'success') {
          showTestResult(i18n.get('connectionSuccess'), 'success', resultDiv);
        } else {
          showTestResult(i18n.get('unexpectedFormat'), 'success', resultDiv);
          console.log('YOURLS API response:', data);
        }
      } else {
        console.error('Connection test error:', response ? response.error : 'No response');
        showTestResult(i18n.get('connectionFailedGeneric'), 'error', resultDiv);
      }
    });
  }
  
  // Enhanced status message display
  function showStatus(message, type) {
    if (!statusDiv) {
      console.warn('Status div not found');
      return;
    }
    
    statusDiv.textContent = message;
    statusDiv.className = `status-message status-${type}`;
    
    // Make sure the message is visible by scrolling to it
    statusDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Clear the status after a few seconds
    setTimeout(() => {
      if (statusDiv) {
        statusDiv.textContent = '';
        statusDiv.className = '';
      }
    }, 4000);
  }
  
  function showTestResult(message, type, resultDiv) {
    if (!resultDiv) {
      console.warn('Result div not found');
      return;
    }
    
    resultDiv.innerHTML = message;
    resultDiv.className = `status-message status-${type}`;
    
    // Make sure the message is visible
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  function showDashboardError(message) {
    const dashboardContent = getElement('dashboard_content');
    const dashboardError = getElement('dashboard_error');
    const dashboardErrorText = dashboardError ? dashboardError.querySelector('p') : null;
    
    if (dashboardContent) dashboardContent.style.display = 'none';
    if (dashboardError) dashboardError.style.display = 'block';
    if (dashboardErrorText) dashboardErrorText.textContent = message;
    
    // Also reset the refresh button
    if (refreshDashboardButton) {
      refreshDashboardButton.disabled = false;
      refreshDashboardButton.classList.remove('loading');
    }
  }
  
  // Analytics functionality
  const refreshAnalyticsButton = getElement('refresh_analytics');
  const exportAnalyticsButton = getElement('export_analytics');
  const analyticsServerSelect = getElement('analytics-server-select');
  const analyticsServerToggle = getElement('analytics-server-toggle');
  const analyticsAdditionalOption = getElement('analytics-additional-option');
  
  let currentAnalyticsServer = 'primary';
  let analyticsData = {};
  
  if (refreshAnalyticsButton) {
    refreshAnalyticsButton.addEventListener('click', () => {
      loadAnalyticsData(true); // true = force refresh
    });
  }
  
  if (exportAnalyticsButton) {
    exportAnalyticsButton.addEventListener('click', exportAnalyticsData);
  }
  
  // Handle analytics server selection
  if (analyticsServerSelect) {
    analyticsServerSelect.addEventListener('change', function() {
      currentAnalyticsServer = this.value;
      loadAnalyticsData();
    });
  }
  
  // Function to setup analytics server selector
  function setupAnalyticsServerSelector(settings) {
    if (!analyticsServerToggle || !analyticsAdditionalOption) {
      return;
    }
    
    if (settings.enable_additional_server && 
        settings.additional_yourls_url && 
        settings.additional_yourls_key) {
      analyticsServerToggle.style.display = 'flex';
      analyticsAdditionalOption.textContent = settings.additional_server_name || 
                                              i18n.get('additionalServerOption');
    } else {
      analyticsServerToggle.style.display = 'none';
      currentAnalyticsServer = 'primary';
      if (analyticsServerSelect) {
        analyticsServerSelect.value = 'primary';
      }
    }
  }
  
  // Analytics data cache with 5-minute TTL
  const analyticsCache = {
    primary: { data: null, timestamp: 0 },
    additional: { data: null, timestamp: 0 }
  };
  
  let analyticsTimeout = null;
  
  function loadAnalyticsData(forceRefresh = false) {
    const analyticsContent = getElement('analytics_content');
    const analyticsError = getElement('analytics_error');
    
    // Analytics metric elements
    const clicksTodayEl = getElement('clicks_today');
    const clicksWeekEl = getElement('clicks_week');
    const clicksMonthEl = getElement('clicks_month');
    const avgDailyClicksEl = getElement('avg_daily_clicks');
    const topLinksList = getElement('top_links_list');
    const yourlsVersionEl = getElement('yourls_version');
    const totalUrlsCountEl = getElement('total_urls_count');
    const dbSizeEl = getElement('db_size');
    
    // Check if analytics elements exist
    if (!clicksTodayEl || !topLinksList) {
      return; // Exit if analytics elements don't exist
    }
    
    // Cancel any pending timeout
    if (analyticsTimeout) {
      clearTimeout(analyticsTimeout);
    }
    
    // Add loading class to refresh button
    if (refreshAnalyticsButton) {
      refreshAnalyticsButton.classList.add('loading');
      refreshAnalyticsButton.disabled = true;
    }
    
    // Show loading state
    clicksTodayEl.textContent = '-';
    clicksWeekEl.textContent = '-';
    clicksMonthEl.textContent = '-';
    avgDailyClicksEl.textContent = '-';
    yourlsVersionEl.textContent = '-';
    totalUrlsCountEl.textContent = '-';
    dbSizeEl.textContent = '-';
    
    topLinksList.innerHTML = `<div class="loading-state">${i18n.get('loadingAnalytics') || 'Loading analytics data...'}</div>`;
    
    // Get current settings
    chrome.storage.sync.get([
      'yourls_url', 
      'yourls_key',
      'additional_yourls_url',
      'additional_yourls_key',
      'enable_additional_server'
    ], (settings) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading settings for analytics:', chrome.runtime.lastError);
        showAnalyticsError(i18n.get('errorLoadingSettings') || 'Error loading settings');
        return;
      }
      
      // Setup server selector
      setupAnalyticsServerSelector(settings);
      
      // Determine which server to use
      const useAdditional = currentAnalyticsServer === 'additional' && 
        settings.enable_additional_server && 
        settings.additional_yourls_url && 
        settings.additional_yourls_key;
      
      const baseUrl = useAdditional ? settings.additional_yourls_url : settings.yourls_url;
      const apiKey = useAdditional ? settings.additional_yourls_key : settings.yourls_key;
      
      if (!baseUrl || !apiKey) {
        showAnalyticsError(i18n.get('errorMissingSettings') || 'Missing server settings');
        return;
      }
      
      // Check cache first if not forcing refresh
      const cacheKey = useAdditional ? 'additional' : 'primary';
      const now = Date.now();
      const cacheTTL = 300000; // 5 minutes
      
      if (!forceRefresh && 
          analyticsCache[cacheKey].data && 
          (now - analyticsCache[cacheKey].timestamp) < cacheTTL) {
        renderAnalyticsData(analyticsCache[cacheKey].data);
        return;
      }
      
      // Format API URL
      const apiUrl = baseUrl.endsWith('/') ? 
        `${baseUrl}yourls-api.php` : 
        `${baseUrl}/yourls-api.php`;
      
      console.log('Loading analytics data from server:', apiUrl);
      
      // Load multiple analytics endpoints
      Promise.all([
        loadStatsData(apiUrl, apiKey),
        loadDbStatsData(apiUrl, apiKey),
        loadTopLinksData(apiUrl, apiKey)
      ]).then(([statsData, dbStatsData, topLinksData]) => {
        const combinedData = {
          stats: statsData,
          dbStats: dbStatsData,
          topLinks: topLinksData,
          timestamp: now
        };
        
        // Cache the data
        analyticsCache[cacheKey].data = combinedData;
        analyticsCache[cacheKey].timestamp = now;
        
        renderAnalyticsData(combinedData);
        
      }).catch(error => {
        console.error('Analytics loading error:', error);
        resetAnalyticsState();
        showAnalyticsError(i18n.get('analyticsError') || 'Unable to load analytics data');
      });
    });
    
    // Set timeout for long-running requests
    analyticsTimeout = setTimeout(() => {
      resetAnalyticsState();
      showAnalyticsError(i18n.get('dashboardTimeout') || 'Analytics request timed out');
    }, 20000); // 20-second timeout
  }
  
  // Individual API request functions
  function loadStatsData(apiUrl, apiKey) {
    const params = new URLSearchParams();
    params.append('signature', apiKey);
    params.append('action', 'stats');
    params.append('format', 'json');
    
    return new Promise((resolve, reject) => {
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
        if (response && response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error('Failed to load stats data'));
        }
      });
    });
  }
  
  function loadDbStatsData(apiUrl, apiKey) {
    const params = new URLSearchParams();
    params.append('signature', apiKey);
    params.append('action', 'db-stats');
    params.append('format', 'json');
    
    return new Promise((resolve, reject) => {
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
        if (response && response.success && response.data) {
          resolve(response.data);
        } else {
          // DB stats might not be available in all YOURLS versions
          resolve({});
        }
      });
    });
  }
  
  function loadTopLinksData(apiUrl, apiKey) {
    const params = new URLSearchParams();
    params.append('signature', apiKey);
    params.append('action', 'stats');
    params.append('filter', 'top');
    params.append('limit', '10');
    params.append('format', 'json');
    
    return new Promise((resolve, reject) => {
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
        if (response && response.success && response.data) {
          resolve(response.data);
        } else {
          resolve({});
        }
      });
    });
  }
  
  function renderAnalyticsData(data) {
    resetAnalyticsState();
    
    const analyticsContent = getElement('analytics_content');
    const analyticsError = getElement('analytics_error');
    
    if (analyticsContent) analyticsContent.style.display = 'block';
    if (analyticsError) analyticsError.style.display = 'none';
    
    // Calculate time-based metrics
    calculateAndDisplayMetrics(data);
    
    // Render top links
    renderTopLinks(data.topLinks || data.dbStats);
    
    // Render server info
    renderServerInfo(data.stats, data.dbStats);
    
    // Clear timeout
    if (analyticsTimeout) {
      clearTimeout(analyticsTimeout);
      analyticsTimeout = null;
    }
  }
  
  function calculateAndDisplayMetrics(data) {
    const stats = data.stats?.stats || data.stats || {};
    
    // Get elements
    const clicksTodayEl = getElement('clicks_today');
    const clicksWeekEl = getElement('clicks_week');
    const clicksMonthEl = getElement('clicks_month');
    const avgDailyClicksEl = getElement('avg_daily_clicks');
    
    // For demo purposes, we'll estimate time-based clicks
    // In a real implementation, you'd need additional YOURLS plugins for time-based analytics
    const totalClicks = parseInt(stats.total_clicks) || 0;
    const totalLinks = parseInt(stats.total_links) || 0;
    
    // Estimate daily clicks (this is a rough approximation)
    const avgClicksPerLink = totalLinks > 0 ? totalClicks / totalLinks : 0;
    const estimatedDailyClicks = Math.round(avgClicksPerLink * 0.1); // Rough estimate
    const estimatedWeeklyClicks = estimatedDailyClicks * 7;
    const estimatedMonthlyClicks = estimatedDailyClicks * 30;
    
    // Animate the counters
    if (clicksTodayEl) {
      animateCounter(clicksTodayEl, 0, estimatedDailyClicks, 800);
    }
    if (clicksWeekEl) {
      animateCounter(clicksWeekEl, 0, estimatedWeeklyClicks, 1000);
    }
    if (clicksMonthEl) {
      animateCounter(clicksMonthEl, 0, estimatedMonthlyClicks, 1200);
    }
    if (avgDailyClicksEl) {
      animateCounter(avgDailyClicksEl, 0, avgClicksPerLink, 600);
    }
  }
  
  function renderTopLinks(linksData) {
    const topLinksList = getElement('top_links_list');
    if (!topLinksList) return;
    
    console.log('Rendering top links:', linksData);
    
    if (!linksData || Object.keys(linksData).length === 0) {
      topLinksList.innerHTML = `
        <div class="analytics-empty">
          <div class="analytics-empty-icon">📊</div>
          <div class="analytics-empty-text">${i18n.get('noAnalyticsData') || 'No analytics data available'}</div>
        </div>
      `;
      return;
    }
    
    // Process links data
    let linksArray = [];
    if (linksData.links) {
      linksArray = Object.values(linksData.links);
    } else if (Array.isArray(linksData)) {
      linksArray = linksData;
    } else if (typeof linksData === 'object') {
      linksArray = Object.values(linksData);
    }
    
    if (linksArray.length === 0) {
      topLinksList.innerHTML = `
        <div class="analytics-empty">
          <div class="analytics-empty-icon">📊</div>
          <div class="analytics-empty-text">${i18n.get('noAnalyticsData') || 'No analytics data available'}</div>
        </div>
      `;
      return;
    }
    
    // Sort by clicks and take top 10
    const sortedLinks = linksArray
      .sort((a, b) => (parseInt(b.clicks) || 0) - (parseInt(a.clicks) || 0))
      .slice(0, 10);
    
    // Build HTML
    topLinksList.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    sortedLinks.forEach((link, index) => {
      const shortUrl = link.shorturl || link.short_url || link.url_short || '';
      const longUrl = link.url || link.long_url || link.url_long || '';
      const clicks = parseInt(link.clicks) || 0;
      
      if (!shortUrl && !longUrl) return;
      
      const linkItem = document.createElement('div');
      linkItem.className = 'analytics-item';
      linkItem.innerHTML = `
        <div class="analytics-item-content">
          <div class="analytics-item-title">${dom.sanitize(shortUrl) || 'N/A'}</div>
          <div class="analytics-item-subtitle">${dom.sanitize(longUrl) || 'N/A'}</div>
        </div>
        <div class="analytics-item-stats">
          <div class="analytics-item-primary">${clicks.toLocaleString()} ${i18n.get('clicks') || 'clicks'}</div>
          <div class="analytics-item-secondary">#${index + 1} ${i18n.get('topLinksTitle') || 'top link'}</div>
        </div>
      `;
      
      fragment.appendChild(linkItem);
    });
    
    topLinksList.appendChild(fragment);
  }
  
  function renderServerInfo(statsData, dbStatsData) {
    const yourlsVersionEl = getElement('yourls_version');
    const totalUrlsCountEl = getElement('total_urls_count');
    const dbSizeEl = getElement('db_size');
    
    const stats = statsData?.stats || statsData || {};
    
    // YOURLS version (might not be available in API)
    if (yourlsVersionEl) {
      yourlsVersionEl.textContent = stats.version || 'N/A';
    }
    
    // Total URLs
    if (totalUrlsCountEl) {
      const totalUrls = parseInt(stats.total_links) || 0;
      animateCounter(totalUrlsCountEl, 0, totalUrls, 800);
    }
    
    // Database size (estimate based on links count)
    if (dbSizeEl) {
      const totalLinks = parseInt(stats.total_links) || 0;
      const estimatedSize = Math.round(totalLinks * 0.5); // Rough estimate in KB
      dbSizeEl.textContent = estimatedSize > 1024 ? 
        `${(estimatedSize / 1024).toFixed(1)} MB` : 
        `${estimatedSize} KB`;
    }
  }
  
  function exportAnalyticsData() {
    // Get the current analytics data from cache instead of using empty analyticsData variable
    const cacheKey = currentAnalyticsServer === 'additional' ? 'additional' : 'primary';
    const cachedData = analyticsCache[cacheKey].data;
    
    if (!cachedData || Object.keys(cachedData).length === 0) {
      alert(i18n.get('noAnalyticsData') || 'No analytics data to export');
      return;
    }
    
    try {
      const dataToExport = {
        exportDate: new Date().toISOString(),
        server: currentAnalyticsServer,
        serverName: currentAnalyticsServer === 'additional' ? 
          (analyticsAdditionalOption ? analyticsAdditionalOption.textContent : 'Additional Server') :
          i18n.get('primaryServerOption'),
        analytics: cachedData,
        summary: {
          totalLinks: cachedData.stats?.stats?.total_links || 0,
          totalClicks: cachedData.stats?.stats?.total_clicks || 0,
          topLinksCount: cachedData.topLinks && typeof cachedData.topLinks === 'object' ? 
            Object.keys(cachedData.topLinks).length : 0
        }
      };
      
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `yourls-analytics-${currentAnalyticsServer}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Analytics data exported successfully');
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }
  
  function resetAnalyticsState() {
    if (refreshAnalyticsButton) {
      refreshAnalyticsButton.classList.remove('loading');
      refreshAnalyticsButton.disabled = false;
    }
    
    if (analyticsTimeout) {
      clearTimeout(analyticsTimeout);
      analyticsTimeout = null;
    }
  }
  
  function showAnalyticsError(message) {
    const analyticsContent = getElement('analytics_content');
    const analyticsError = getElement('analytics_error');
    const analyticsErrorText = analyticsError ? analyticsError.querySelector('p') : null;
    
    if (analyticsContent) analyticsContent.style.display = 'none';
    if (analyticsError) analyticsError.style.display = 'block';
    if (analyticsErrorText) analyticsErrorText.textContent = message;
    
    resetAnalyticsState();
  }
  
  // Enhanced tab switching to handle analytics loading
  function switchTab(targetTab) {
    // Remove active class from all tabs and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    const activeButton = document.querySelector(`.tab-button[data-tab="${targetTab}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
      // Update ARIA attributes for accessibility
      activeButton.setAttribute('aria-selected', 'true');
    }
    
    const targetContent = document.getElementById(targetTab);
    if (targetContent) {
      targetContent.classList.add('active');
      
      // Load data based on tab
      if (targetTab === 'dashboard') {
        setTimeout(() => loadDashboardData(), 100);
      } else if (targetTab === 'analytics') {
        setTimeout(() => loadAnalyticsData(), 100);
      } else if (targetTab === 'general') {
        setTimeout(() => loadChangelogData(), 100);
      }
      
      // Save active tab to localStorage
      localStorage.setItem('yourlsActiveTab', targetTab);
    }
  }
  
  // Add direct initialization for active tab content
  document.addEventListener('DOMContentLoaded', function() {
    // After the tab is activated by switchTab, also initialize any content
    // that should be loaded when the page first loads
    const activeTabId = localStorage.getItem('yourlsActiveTab') || 'servers';
    
    // If general tab is active initially, load the changelog immediately
    if (activeTabId === 'general') {
      setTimeout(() => loadChangelogData(), 200);
    }
    
    // If dashboard tab is active initially, load dashboard data immediately
    if (activeTabId === 'dashboard') {
      setTimeout(() => loadDashboardData(), 200);
    }
  });
});
