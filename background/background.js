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

const CWS_LICENSE_API_URL = "https://www.googleapis.com/chromewebstore/v1.1/userlicenses/";

async function isUserPremium() {
  // In development, we can simulate different user types.
  // Set this to false to test free user limitations
  const isDevelopment = !('update_url' in chrome.runtime.getManifest());
  if (isDevelopment) {
    // Change this to false to test free user limits during development
    const simulatePremium = false; // Set to true to test premium features
    console.log(`DEV MODE: Simulating ${simulatePremium ? 'premium' : 'free'} user.`);
    return simulatePremium;
  }

  const cachedLicense = await chrome.storage.local.get("license");
  if (cachedLicense.license && cachedLicense.license.timestamp > Date.now()) {
    console.log("Using cached license:", cachedLicense.license.isPremium);
    return cachedLicense.license.isPremium;
  }

  try {
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });

    const response = await fetch(CWS_LICENSE_API_URL + chrome.runtime.id, {
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    const isPremium = data.accessLevel === "FULL";

    // Cache the license for 1 hour.
    const license = {
      isPremium: isPremium,
      timestamp: Date.now() + 3600000
    };
    await chrome.storage.local.set({ 
      license: license,
      lastKnownLicense: isPremium // Backup cache for fallback
    });

    console.log("License check successful. Premium status:", isPremium);
    return isPremium;

  } catch (error) {
    console.error("Error checking license:", error);
    // If we can't verify license, check if we have a cached license
    try {
      const cachedResult = await chrome.storage.local.get("lastKnownLicense");
      if (cachedResult.lastKnownLicense) {
        console.log("Using fallback cached license:", cachedResult.lastKnownLicense);
        return cachedResult.lastKnownLicense;
      }
    } catch (cacheError) {
      console.error("Error accessing cached license:", cacheError);
    }
    // In case of error and no cache, we assume the user is not premium.
    return false;
  }
}

// Handle messages from content scripts
// Use a non-async listener and return true synchronously to keep the port open.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request);

  (async () => {
    try {
      if (request.action === "checkPremiumStatus") {
        const isPremium = await isUserPremium();
        sendResponse({ isPremium });
        return;
      }

      if (request.action === "initiatePurchase") {
        try {
          chrome.webstore.install(
            () => {
              // After successful purchase, clear the license cache to force a re-check.
              chrome.storage.local.remove("license", () => {
                sendResponse({ success: true });
              });
            },
            (error) => {
              console.error("Error initiating purchase:", error);
              sendResponse({ success: false, error });
            }
          );
        } catch (error) {
          console.error("Error initiating purchase:", error?.message || error);
          sendResponse({ success: false, error: error?.message || String(error) });
        }
        return;
      }

      if (request.action === 'toggle') {
        // Messages from content scripts should use content script approach
        await toggleSidebar();
        sendResponse({ success: true });
        return;
      }

      if (request.action === 'openTab' && request.url) {
        try {
          await chrome.tabs.create({ url: request.url, active: false });
          sendResponse({ success: true });
        } catch (error) {
          console.error('❌ Error opening tab:', error);
          sendResponse({ success: false, error: error?.message || String(error) });
        }
        return;
      }

      if (request.action === 'open-all-pages') {
        try {
          const { urls, mode } = request;

          if (mode === 'new-window') {
            // Open all URLs in a new window
            const newWindow = await chrome.windows.create({
              url: urls[0],
              focused: true,
              type: 'normal'
            });

            // Add remaining URLs as tabs in the new window
            for (let i = 1; i < urls.length; i++) {
              await chrome.tabs.create({
                windowId: newWindow.id,
                url: urls[i],
                active: false
              });
            }
          } else if (mode === 'incognito') {
            // Open all URLs in an incognito window
            const incogWindow = await chrome.windows.create({
              url: urls[0],
              incognito: true,
              focused: true,
              type: 'normal'
            });

            // Add remaining URLs as tabs in the incognito window
            for (let i = 1; i < urls.length; i++) {
              await chrome.tabs.create({
                windowId: incogWindow.id,
                url: urls[i],
                active: false
              });
            }
          } else {
            // Default: open all URLs as new tabs in current window
            for (const url of urls) {
              await chrome.tabs.create({ url });
            }
          }

          sendResponse({ success: true });
        } catch (error) {
          console.error('❌ Error opening pages:', error);
          sendResponse({ success: false, error: error?.message || String(error) });
        }
        return;
      }

      if (request.action === 'getCurrentTab') {
        try {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          sendResponse({ success: true, tab });
        } catch (error) {
          console.error('❌ Error getting current tab:', error);
          sendResponse({ success: false, error: error?.message || String(error) });
        }
        return;
      }

      // Unknown action
      sendResponse({ success: false, error: 'Unknown action' });
    } catch (err) {
      console.error('❌ Unhandled error in message handler:', err);
      sendResponse({ success: false, error: err?.message || String(err) });
    }
  })();

  // Keep the message channel open for async response
  return true;
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
