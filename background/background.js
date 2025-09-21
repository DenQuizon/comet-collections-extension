// Background Service Worker for Comet Collections Extension
console.log('🚀 Comet Collections: Background service worker loaded');

// Handle keyboard shortcut
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

// Toggle sidebar function - uses content script for right-side positioning
async function toggleSidebar() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      console.log('❌ No active tab found');
      return;
    }
    
    console.log('📄 Toggling sidebar on:', tab.url);
    
    // Try to send message to existing content script first
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
      console.log('✅ Content script responded:', response);
      return;
    } catch (error) {
      console.log('⚠️ No content script response, injecting...', error.message);
    }
    
    // Inject content script if not present
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      
      // Inject CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/sidebar.css']
      });
      
      // Wait a moment for script to initialize, then toggle
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
          console.log('✅ Script injected and toggled successfully');
        } catch (toggleError) {
          console.log('❌ Failed to toggle after injection:', toggleError.message);
        }
      }, 500);
    } catch (injectError) {
      console.log('❌ Cannot inject content script:', injectError.message);
    }
    
  } catch (error) {
    console.error('❌ Error toggling sidebar:', error);
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('📨 Message received:', request);
  
  if (request.action === 'toggle') {
    // Messages from content scripts should use content script approach
    await toggleSidebar();
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === 'openTab' && request.url) {
    try {
      await chrome.tabs.create({ url: request.url, active: false });
      sendResponse({ success: true });
    } catch (error) {
      console.error('❌ Error opening tab:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  if (request.action === 'openAllPages') {
    try {
      const { urls, mode } = request;
      
      if (mode === 'window') {
        // Open all URLs in a new window
        const window = await chrome.windows.create({
          url: urls[0],
          focused: true
        });
        
        // Add remaining URLs as tabs in the new window
        for (let i = 1; i < urls.length; i++) {
          await chrome.tabs.create({
            windowId: window.id,
            url: urls[i],
            active: false
          });
        }
      } else if (mode === 'incognito') {
        // Open all URLs in an incognito window
        const window = await chrome.windows.create({
          url: urls[0],
          incognito: true,
          focused: true
        });
        
        // Add remaining URLs as tabs in the incognito window
        for (let i = 1; i < urls.length; i++) {
          await chrome.tabs.create({
            windowId: window.id,
            url: urls[i],
            active: false
          });
        }
      } else {
        // Default: open all URLs as new tabs
        for (const url of urls) {
          await chrome.tabs.create({ url });
        }
      }
      
      sendResponse({ success: true });
    } catch (error) {
      console.error('❌ Error opening pages:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
  
  if (request.action === 'getCurrentTab') {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      sendResponse({ success: true, tab });
    } catch (error) {
      console.error('❌ Error getting current tab:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
});

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('✅ Comet Collections extension installed/updated');
  
  try {
    // Initialize storage
    chrome.storage.local.set({ collections: [] });
    console.log('✅ Storage initialized');
  } catch (error) {
    console.error('❌ Error initializing storage:', error);
  }
});

console.log('✅ Comet Collections: Background service worker ready');