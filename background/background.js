// Background Service Worker for Comet Collections Extension

// Handle keyboard shortcut (Cmd+Shift+K)
chrome.commands.onCommand.addListener(async (command) => {
  console.log('⌨️ Command received:', command);
  if (command === 'toggle-collections') {
    await toggleSidebar();
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  console.log('🖱️ Extension icon clicked');
  await toggleSidebar();
});

// Toggle sidebar function - injects content script if needed
async function toggleSidebar() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    
    // Check if we can inject scripts on this URL
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || 
        tab.url.startsWith('chrome-extension://')) {
      return; // Silently fail for protected pages
    }
    
    // Try to send message to existing content script first
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
      return;
    } catch (error) {
      // No content script present, need to inject
    }
    
    // Inject content script and CSS if not present
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/sidebar.css']
      });
      
      // Wait for script to initialize, then toggle
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
          console.log('✅ Script injected and toggled successfully');
        } catch (toggleError) {
          console.log('❌ Failed to toggle after injection:', toggleError.message);
        }
      }, 100);
    } catch (injectError) {
      console.log('❌ Cannot inject content script:', injectError.message);
    }
    
  } catch (error) {
    console.error('❌ Error toggling sidebar:', error);
  }
}

// Capture page thumbnail
async function capturePageThumbnail(tabId) {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 50
    });
    return dataUrl;
  } catch (error) {
    console.error('❌ Error capturing thumbnail:', error);
    return null;
  }
}

// Handle messages from content scripts and other parts of the extension
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('📨 Message received:', request);
  
  if (request.action === 'toggle-sidebar') {
    await toggleSidebar();
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'get-current-tab') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      sendResponse({ 
        success: true, 
        tab: {
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl
        }
      });
    } catch (error) {
      console.error('❌ Error getting current tab:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  if (request.action === 'capture-thumbnail') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          const thumbnail = await capturePageThumbnail(tab.id);
          sendResponse({ success: true, thumbnail });
        } else {
          console.warn('⚠️ Thumbnail capture requested, but no active tab found.');
          sendResponse({ success: false, error: 'No active tab found' });
        }
      } catch (error) {
        console.error('❌ Error capturing thumbnail:', error.message);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'open-tab' && request.url) {
    try {
      await chrome.tabs.create({ url: request.url });
      sendResponse({ success: true });
    } catch (error) {
      console.error('❌ Error opening tab:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  if (request.action === 'open-all-pages') {
    try {
      const { urls, mode } = request;
      
      if (mode === 'new-window') {
        chrome.windows.create({ url: urls, focused: true }).then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          console.error('❌ Error opening pages:', error);
          sendResponse({ success: false, error: error.message });
        });
      } else if (mode === 'incognito') {
        chrome.windows.create({ url: urls, incognito: true, focused: true }).then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          console.error('❌ Error opening pages:', error);
          sendResponse({ success: false, error: error.message });
        });
      } else {
        // Default: open all URLs in current window
        Promise.all(urls.map(url => chrome.tabs.create({ url, active: false }))).then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          console.error('❌ Error opening pages:', error);
          sendResponse({ success: false, error: error.message });
        });
      }
    } catch (error) {
      console.error('❌ Error opening pages:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
});

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('✅ Comet Collections extension installed/updated');
  
  try {
    // Initialize storage with empty collections array
    const result = await chrome.storage.local.get(['collections']);
    if (!result.collections) {
      await chrome.storage.local.set({ collections: [] });
      console.log('✅ Storage initialized with empty collections');
    }
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
  }
});

console.log('✅ Comet Collections: Background service worker ready');