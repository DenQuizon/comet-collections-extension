// Comet Collections Extension - Content Script
console.log('🚀 Comet Collections: Content script loaded');

class CometContentSidebar {
  constructor() {
    this.sidebar = null;
    this.collections = [];
    this.currentTheme = localStorage.getItem('comet-theme') || 'auto';
    this.collectionColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    this.expandedCollections = new Set();
    this.modalOverlay = null;
    this.contextMenu = null;
    this.currentTab = {
      title: document.title,
      url: window.location.href,
      favIconUrl: this.getFaviconUrl()
    };
  }

  getFaviconUrl() {
    const favicon = document.querySelector('link[rel*="icon"]');
    return favicon ? favicon.href : null;
  }

  createSidebar() {
    if (this.sidebar) return this.sidebar;
    
    const sidebar = document.createElement('div');
    sidebar.className = 'comet-collections-sidebar';
    
    sidebar.innerHTML = `
      <!-- Header -->
      <div class="comet-sidebar-header">
        <h2 class="comet-sidebar-title">
          <span class="comet-title-icon">📁</span>
          Collections
        </h2>
        <div class="comet-header-controls">
          <select class="comet-theme-selector" title="Theme">
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <button class="comet-header-btn comet-header-btn-primary" id="comet-add-collection-btn" title="Add collection">+</button>
          <button class="comet-header-btn" id="comet-refresh-btn" title="Refresh">↻</button>
          <button class="comet-header-btn" id="comet-close-btn" title="Close">✕</button>
        </div>
      </div>

      <!-- Content -->
      <div class="comet-sidebar-content">
        <!-- Current page preview -->
        <div class="comet-current-page-section">
          <div class="comet-section-header">
            <h3 class="comet-section-title">Current Page</h3>
          </div>
          <div class="comet-current-page-card">
            <div class="comet-current-page-preview">
              <img class="comet-current-favicon" src="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
              <div class="comet-current-favicon-fallback" style="display:none;">🌐</div>
              <div class="comet-current-info">
                <div class="comet-current-title">Loading...</div>
                <div class="comet-current-url">Loading...</div>
              </div>
            </div>
            <div class="comet-current-actions">
              <button class="comet-current-add-btn">+ Add Current Page</button>
              <button class="comet-add-url-btn">🔗 Add URL</button>
            </div>
          </div>
        </div>

        <!-- Collections grid -->
        <div class="comet-collections-section">
          <div class="comet-section-header">
            <h3 class="comet-section-title">Collections</h3>
          </div>
          <div class="comet-collections-list" id="collections-container">
            <!-- Collections will be populated here -->
          </div>
        </div>
      </div>

      <!-- Modal overlay -->
      <div class="comet-modal-overlay" id="modal-overlay">
        <!-- Modal content will be inserted here -->
      </div>

      <!-- Context menu -->
      <div class="comet-context-menu" id="context-menu">
        <!-- Context menu items will be inserted here -->
      </div>
    `;
    
    document.body.appendChild(sidebar);
    this.sidebar = sidebar;
    this.modalOverlay = sidebar.querySelector('#modal-overlay');
    this.contextMenu = sidebar.querySelector('#context-menu');
    
    this.initializeUI();
    return sidebar;
  }

  async initializeUI() {
    // Load collections from storage
    await this.loadCollections();
    // One-time migration: remove the word "Virtual" from saved page titles
    await this.migrateRemoveVirtualWord();
    // One-time migration: ensure titles are never empty or literal 'Untitled'
    await this.migrateEnsureTitlesV1();
    
    // Apply theme
    this.applyTheme();
    
    // Update current page info
    this.updateCurrentPageInfo();
    
    // Render collections
    this.renderCollections();

    // Theme selector
    const themeSelector = this.sidebar.querySelector('.comet-theme-selector');
    if (themeSelector) {
      themeSelector.value = this.currentTheme;
      themeSelector.addEventListener('change', (e) => {
        this.currentTheme = e.target.value;
        localStorage.setItem('comet-theme', this.currentTheme);
        this.applyTheme();
      });
    }

    // Header buttons
    const addCollectionBtn = this.sidebar.querySelector('#comet-add-collection-btn');
    const refreshBtn = this.sidebar.querySelector('#comet-refresh-btn');
    const closeBtn = this.sidebar.querySelector('#comet-close-btn');
    const currentAddBtn = this.sidebar.querySelector('.comet-current-add-btn');
    const addUrlBtn = this.sidebar.querySelector('.comet-add-url-btn');

    if (addCollectionBtn) {
      addCollectionBtn.addEventListener('click', () => this.showAddCollectionDialog());
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideSidebar());
    }

    if (currentAddBtn) {
      currentAddBtn.addEventListener('click', () => this.showAddPageDialog());
    }

    if (addUrlBtn) {
      addUrlBtn.addEventListener('click', () => this.showAddUrlDialog());
    }

    // Click outside to close context menu
    document.addEventListener('click', () => this.hideContextMenu());

    // Hide context menu when clicking elsewhere
    this.sidebar.addEventListener('click', (e) => {
      if (!e.target.closest('.comet-context-menu')) {
        this.hideContextMenu();
      }
    });

    this.attachCollectionEvents();
  }

  applyTheme() {
    if (!this.sidebar) return;
    
    this.sidebar.classList.remove('comet-theme-light', 'comet-theme-dark');
    if (this.currentTheme === 'light') {
      this.sidebar.classList.add('comet-theme-light');
    } else if (this.currentTheme === 'dark') {
      this.sidebar.classList.add('comet-theme-dark');
    }
  }

  updateCurrentPageInfo() {
    if (!this.sidebar) return;
    
    const titleElement = this.sidebar.querySelector('.comet-current-title');
    const urlElement = this.sidebar.querySelector('.comet-current-url');
    const faviconElement = this.sidebar.querySelector('.comet-current-favicon');

    if (titleElement) titleElement.textContent = this.currentTab.title || 'Untitled';
    if (urlElement) urlElement.textContent = this.getCleanUrl(this.currentTab.url);
    
    // Set favicon
    if (faviconElement && this.currentTab.favIconUrl) {
      faviconElement.src = this.currentTab.favIconUrl;
      faviconElement.style.display = 'block';
      const fallback = this.sidebar.querySelector('.comet-current-favicon-fallback');
      if (fallback) fallback.style.display = 'none';
    }
  }

  getCleanUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  }

  // Pretty fallback from URL host (e.g., www.coursera.org -> Coursera)
  deriveTitleFallbackFromUrl(url) {
    try {
      const host = new URL(url).hostname.replace('www.', '');
      const first = host.split('.')[0];
      if (!first) return host;
      return first.charAt(0).toUpperCase() + first.slice(1);
    } catch {
      return '';
    }
  }

  // Remove the word "Virtual" from titles (case-insensitive), collapse spaces
  // If result is empty, use provided fallback (if any)
  sanitizeTitle(title, fallback = '') {
    try {
      if (!title || typeof title !== 'string') return title || '';
      let cleaned = title.replace(/\bvirtual\b/gi, '');
      cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
      return cleaned || (fallback || '');
    } catch {
      return title || fallback || '';
    }
  }

  async migrateRemoveVirtualWord() {
    try {
      const { migrationRemoveVirtualDone } = await chrome.storage.local.get(['migrationRemoveVirtualDone']);
      if (migrationRemoveVirtualDone) return;
      let changed = false;
      for (const col of this.collections || []) {
        if (!col.pages) continue;
        for (const p of col.pages) {
          if (p && typeof p.title === 'string') {
            const fallback = this.deriveTitleFallbackFromUrl(p.url);
            const newTitle = this.sanitizeTitle(p.title, fallback);
            if (newTitle !== p.title) {
              p.title = newTitle;
              changed = true;
            }
          }
        }
      }
      if (changed) {
        await this.saveCollections();
      }
      await chrome.storage.local.set({ migrationRemoveVirtualDone: true });
    } catch (e) {
      console.warn('⚠️ Migration (remove "Virtual") skipped:', e?.message || e);
    }
  }

  async migrateEnsureTitlesV1() {
    try {
      const { migrationEnsureTitlesV1Done } = await chrome.storage.local.get(['migrationEnsureTitlesV1Done']);
      if (migrationEnsureTitlesV1Done) return;
      let changed = false;
      for (const col of this.collections || []) {
        if (!col.pages) continue;
        for (const p of col.pages) {
          const fallback = this.deriveTitleFallbackFromUrl(p?.url || '');
          const raw = (p?.title || '').trim();
          let newTitle = this.sanitizeTitle(raw, fallback);
          if (!newTitle || newTitle.toLowerCase() === 'untitled') {
            newTitle = fallback || 'Untitled';
          }
          if (newTitle !== p.title) {
            p.title = newTitle;
            changed = true;
          }
        }
      }
      if (changed) await this.saveCollections();
      await chrome.storage.local.set({ migrationEnsureTitlesV1Done: true });
    } catch (e) {
      console.warn('⚠️ Migration (ensure titles v1) skipped:', e?.message || e);
    }
  }

  async loadCollections() {
    try {
      const result = await chrome.storage.local.get(['collections']);
      this.collections = result.collections || [];
    } catch (error) {
      console.error('❌ Error loading collections:', error);
      this.collections = [];
    }
  }

  async saveCollections() {
    try {
      await chrome.storage.local.set({ collections: this.collections });
    } catch (error) {
      console.error('❌ Error saving collections:', error);
    }
  }

  async refreshData() {
    await this.loadCollections();
    this.updateCurrentPageInfo();
    this.renderCollections();
  }

  renderCollections() {
    const container = this.sidebar?.querySelector('#collections-container');
    if (!container) return;

    if (this.collections.length === 0) {
      container.innerHTML = `
        <div class="comet-empty-state">
          <div>No collections yet</div>
          <small>Create your first collection to get started</small>
        </div>
      `;
      return;
    }

    container.innerHTML = this.collections.map(collection => {
      const isExpanded = this.expandedCollections.has(collection.id);
      const pageCount = collection.pages?.length || 0;
      const previewPages = collection.pages?.slice(0, 3) || [];
      
      return `
        <div class="comet-collection-card ${isExpanded ? 'expanded' : ''}" data-collection-id="${collection.id}">
          <div class="comet-collection-header">
            <div class="comet-collection-main">
              <div class="comet-expand-icon">▶</div>
              <div class="comet-collection-icon" style="background-color: ${collection.color}">
                ${collection.icon || '📁'}
              </div>
              <div class="comet-collection-info">
                <div class="comet-collection-name">${collection.name}</div>
                <div class="comet-collection-count">${pageCount} pages</div>
              </div>
            </div>
            <button class="comet-collection-more" data-collection-id="${collection.id}" title="More options">⋯</button>
          </div>
          ${isExpanded ? `
            <div class="comet-collection-preview">
              ${previewPages.length > 0 ? previewPages.map(page => {
                const domain = (() => { try { return new URL(page.url).hostname; } catch { return ''; } })();
                const favicon = page.favicon || (domain ? `https://www.google.com/s2/favicons?sz=32&domain=${domain}` : '');
                const displayTitle = (() => {
                  const raw = (page.title || '').trim();
                  if (raw && raw.toLowerCase() !== 'untitled') return raw;
                  const fb = this.deriveTitleFallbackFromUrl(page.url);
                  return fb || domain || 'Untitled';
                })();
                return `
                <div class="comet-preview-item" data-url="${page.url}">
                  <img class="comet-preview-favicon" src="${favicon}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                  <div class="comet-preview-favicon-fallback" style="display:none;">🌐</div>
                  <div style=\"flex:1;min-width:0;\">
                    <div class=\"comet-preview-title\">${displayTitle}</div>
                    <div class=\"comet-page-url\">${domain}</div>
                  </div>
                  <button class="comet-page-remove" data-page-id="${page.id}" data-collection-id="${collection.id}" title="Remove page">×</button>
                </div>`;
              }).join('') : '<div class="comet-preview-empty">No pages in this collection</div>'}
              ${pageCount > 3 ? `<div class="comet-preview-more">+${pageCount - 3} more pages</div>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    this.attachCollectionEvents();
  }

  attachCollectionEvents() {
    if (!this.sidebar) return;

    // Collection header clicks (expand/collapse)
    this.sidebar.querySelectorAll('.comet-collection-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.classList.contains('comet-collection-more')) return;
        const collectionId = header.closest('.comet-collection-card').dataset.collectionId;
        this.toggleCollection(collectionId);
      });
    });

    // Collection more buttons (three dots)
    this.sidebar.querySelectorAll('.comet-collection-more').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const collectionId = btn.dataset.collectionId;
        this.showContextMenu(e, collectionId);
      });
    });

    // Page clicks (open in new tab)
    this.sidebar.querySelectorAll('.comet-preview-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('comet-page-remove')) return;
        const url = item.dataset.url;
        if (url) window.open(url, '_blank');
      });
    });

    // Page remove buttons
    this.sidebar.querySelectorAll('.comet-page-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pageId = btn.dataset.pageId;
        const collectionId = btn.dataset.collectionId;
        this.removePage(collectionId, pageId);
      });
    });
  }

  toggleCollection(collectionId) {
    if (this.expandedCollections.has(collectionId)) {
      this.expandedCollections.delete(collectionId);
    } else {
      this.expandedCollections.add(collectionId);
    }
    this.renderCollections();
  }

  showContextMenu(event, collectionId) {
    event.preventDefault();
    event.stopPropagation();

    const menu = this.contextMenu;
    menu.innerHTML = `
      <div class="comet-context-item" data-action="rename" data-id="${collectionId}">
        <span class="comet-context-icon">✏️</span>
        <span class="comet-context-text">Rename</span>
      </div>
      <div class="comet-context-item" data-action="open-all" data-id="${collectionId}">
        <span class="comet-context-icon">🔗</span>
        <span class="comet-context-text">Open all</span>
      </div>
      <div class="comet-context-divider"></div>
      <div class="comet-context-item" data-action="delete" data-id="${collectionId}">
        <span class="comet-context-icon">🗑️</span>
        <span class="comet-context-text">Delete</span>
      </div>
    `;

    // Show and position relative to the sidebar
    menu.style.display = 'block';
    const sidebarRect = this.sidebar.getBoundingClientRect();
    let left = event.clientX - sidebarRect.left;
    let top = event.clientY - sidebarRect.top;
    // Temporarily set to compute size
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    // Clamp within sidebar bounds
    const menuRect = menu.getBoundingClientRect();
    const maxLeft = sidebarRect.width - menuRect.width - 8;
    const maxTop = sidebarRect.height - menuRect.height - 8;
    left = Math.max(8, Math.min(left, Math.max(8, maxLeft)));
    top = Math.max(8, Math.min(top, Math.max(8, maxTop)));
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;

    // Attach context menu events
    menu.querySelectorAll('.comet-context-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        const id = e.currentTarget.dataset.id;
        this.handleContextMenuAction(action, id);
        this.hideContextMenu();
      });
    });
  }

  hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.style.display = 'none';
    }
  }

  async handleContextMenuAction(action, collectionId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return;

    switch (action) {
      case 'rename':
        await this.renameCollection(collectionId);
        break;
      case 'open-all':
        this.showOpenAllDialog(collectionId);
        break;
      case 'delete':
        await this.deleteCollection(collectionId);
        break;
    }
  }

  showOpenAllDialog(collectionId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return;
    const count = collection.pages?.length || 0;
    if (count === 0) {
      this.showToast('No pages in this collection', 'warning');
      return;
    }

    const openDialogHTML = `
      <div class="comet-modal-content" style="max-width: 480px;">
        <div class="comet-modal-header">
          <h3>Open All Pages (${count})</h3>
        </div>
        <div class="comet-modal-body">
          <div class="comet-form-group">
            <label class="comet-form-label">Where to open?</label>
            <div class="comet-dialog-row">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                <input type="radio" name="open-mode" value="current" checked>
                Same window (new tabs)
              </label>
            </div>
            <div class="comet-dialog-row">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                <input type="radio" name="open-mode" value="new-window">
                New window
              </label>
            </div>
            <div class="comet-dialog-row">
              <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
                <input type="radio" name="open-mode" value="incognito">
                Incognito window
              </label>
              <div class="comet-form-hint">Requires incognito access for the extension</div>
            </div>
          </div>
        </div>
        <div class="comet-modal-footer">
          <button class="comet-btn comet-btn-secondary comet-modal-cancel">Cancel</button>
          <button class="comet-btn comet-btn-primary" id="open-all-confirm">Open</button>
        </div>
      </div>
    `;

    this.showModal(openDialogHTML);
    const confirmBtn = this.modalOverlay.querySelector('#open-all-confirm');
    confirmBtn.addEventListener('click', async () => {
      const mode = (this.modalOverlay.querySelector('input[name="open-mode"]:checked')?.value) || 'current';
      try {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Opening...';
        await this.openAllPagesViaBackground(collectionId, mode);
        this.hideModal();
      } catch (err) {
        console.error('❌ Error opening pages:', err);
        this.showToast('Failed to open pages', 'error');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Open';
      }
    });
  }

  async openAllPagesViaBackground(collectionId, mode) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) throw new Error('Collection not found');
    const urls = (collection.pages || []).map(p => p.url).filter(Boolean);
    if (urls.length === 0) {
      this.showToast('No pages in this collection', 'warning');
      return;
    }
    this.showToast(`Opening ${urls.length} pages (${mode.replace('-', ' ')})`, 'info');
    const res = await new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage({ action: 'open-all-pages', urls, mode }, (response) => {
          const err = chrome.runtime.lastError;
          if (err) {
            resolve({ success: false, error: err.message });
            return;
          }
          resolve(response || { success: false, error: 'No response' });
        });
      } catch (err) {
        resolve({ success: false, error: err.message });
      }
    });

    if (res && res.success) {
      this.showToast('Pages opening...', 'success');
      return;
    }

    // Graceful fallbacks without noisy console errors
    const errMsg = res?.error || 'Unknown error';
    if (mode === 'current') {
      urls.forEach(url => window.open(url, '_blank'));
      this.showToast('Opened in current window', 'success');
      return;
    }
    if (mode === 'incognito') {
      this.showToast('Enable incognito access for the extension to open in Incognito.', 'warning');
      return;
    }
    // new-window failure
    this.showToast(`Couldn’t open in a new window (${errMsg}). Try Same window.`, 'warning');
  }

  async createNewCollection() {
    // Simple prompt for now - can be enhanced with modal later
    const name = prompt('Collection name:');
    if (name && name.trim()) {
      await this.addCollection(name.trim());
    }
  }

  async addCollection(name, color) {
    const collection = {
      id: Date.now().toString(),
      name,
      color: color || this.collectionColors[Math.floor(Math.random() * this.collectionColors.length)],
      icon: '📁',
      pages: [],
      createdAt: Date.now()
    };
    this.collections.push(collection);
    await this.saveCollections();
    this.renderCollections();
    this.showToast(`Collection "${name}" created`, 'success');
  }

  showAddCollectionDialog() {
    const defaultColor = this.collectionColors[Math.floor(Math.random() * this.collectionColors.length)];
    const addCollectionDialogHTML = `
      <div class="comet-modal-content" style="max-width: 460px;">
        <div class="comet-modal-header">
          <h3>➕ Create New Collection</h3>
        </div>
        <div class="comet-modal-body">
          <div class="comet-form-group">
            <label class="comet-form-label">Collection Name:</label>
            <input type="text" class="comet-form-input" id="collection-name-input" placeholder="e.g., Reading List">
          </div>
          <div class="comet-form-group comet-color-picker">
            <label class="comet-form-label">Color:</label>
            <input type="color" class="comet-form-input" id="collection-color-input" value="${defaultColor}">
            <div class="comet-color-options" id="collection-color-swatches">
              ${this.collectionColors.map(c => `<div class="comet-color-option ${c === defaultColor ? 'selected' : ''}" data-color="${c}" style="background-color: ${c}"></div>`).join('')}
            </div>
            <div class="comet-form-hint">Use the color wheel or pick a swatch</div>
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 12px;">
              <button type="button" class="comet-btn comet-btn-secondary" id="confirm-color-btn">Use Selected Color</button>
              <div class="comet-form-hint" id="color-status-hint"></div>
            </div>
          </div>
        </div>
        <div class="comet-modal-footer">
          <button class="comet-btn comet-btn-secondary comet-modal-cancel">Cancel</button>
          <button class="comet-btn comet-btn-primary" id="create-collection-confirm" disabled>Create</button>
        </div>
      </div>
    `;

    this.showModal(addCollectionDialogHTML);

    const nameInput = this.modalOverlay.querySelector('#collection-name-input');
    const createBtn = this.modalOverlay.querySelector('#create-collection-confirm');
    const colorInput = this.modalOverlay.querySelector('#collection-color-input');
    const swatchContainer = this.modalOverlay.querySelector('#collection-color-swatches');
    const confirmColorBtn = this.modalOverlay.querySelector('#confirm-color-btn');
    const colorStatusHint = this.modalOverlay.querySelector('#color-status-hint');

    const validate = () => {
      const val = (nameInput.value || '').trim();
      createBtn.disabled = !val;
      createBtn.style.opacity = val ? '1' : '0.5';
    };

    nameInput.addEventListener('input', validate);
    nameInput.focus();
    validate();

    // Initialize color status
    const updateColorStatus = (confirmed = false) => {
      if (!colorInput || !colorStatusHint) return;
      const hex = (colorInput.value || '').toUpperCase();
      colorStatusHint.innerHTML = confirmed 
        ? `Color <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${hex};vertical-align:middle;margin:0 6px 0 4px;"></span><code>${hex}</code> selected ✓`
        : `Selected color: <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${hex};vertical-align:middle;margin:0 6px 0 4px;"></span><code>${hex}</code>`;
    };
    updateColorStatus(false);

    // Swatch -> color input sync
    if (swatchContainer) {
      swatchContainer.querySelectorAll('.comet-color-option').forEach(swatch => {
        swatch.addEventListener('click', () => {
          const chosen = swatch.getAttribute('data-color');
          if (chosen) {
            colorInput.value = chosen;
          }
          // Update selected class
          swatchContainer.querySelectorAll('.comet-color-option').forEach(el => el.classList.remove('selected'));
          swatch.classList.add('selected');
          // Reset confirmation status on change
          if (confirmColorBtn) {
            confirmColorBtn.disabled = false;
            confirmColorBtn.textContent = 'Use Selected Color';
          }
          updateColorStatus(false);
        });
      });
    }

    // Color input -> swatch selection sync
    if (colorInput && swatchContainer) {
      colorInput.addEventListener('input', () => {
        const current = colorInput.value.toUpperCase();
        let matched = false;
        swatchContainer.querySelectorAll('.comet-color-option').forEach(el => {
          const c = (el.getAttribute('data-color') || '').toUpperCase();
          if (c === current) {
            el.classList.add('selected');
            matched = true;
          } else {
            el.classList.remove('selected');
          }
        });
        if (!matched) {
          // If custom color, clear any selection
          swatchContainer.querySelectorAll('.comet-color-option').forEach(el => el.classList.remove('selected'));
        }
        // Reset confirmation status on change
        if (confirmColorBtn) {
          confirmColorBtn.disabled = false;
          confirmColorBtn.textContent = 'Use Selected Color';
        }
        updateColorStatus(false);
      });
    }

    // Explicit confirm button for user feedback
    if (confirmColorBtn) {
      confirmColorBtn.addEventListener('click', () => {
        confirmColorBtn.disabled = true;
        confirmColorBtn.textContent = 'Selected ✓';
        this.showToast('Color selected. It will be used for this collection.', 'success');
        updateColorStatus(true);
      });
    }

    createBtn.addEventListener('click', async () => {
      const name = (nameInput.value || '').trim();
      const color = colorInput ? colorInput.value : undefined;
      if (!name) {
        this.showToast('Please enter a collection name', 'error');
        return;
      }
      try {
        createBtn.disabled = true;
        createBtn.textContent = 'Creating...';
        await this.addCollection(name, color);
        this.hideModal();
      } catch (err) {
        console.error('❌ Error creating collection:', err);
        this.showToast('Failed to create collection', 'error');
      } finally {
        createBtn.disabled = false;
        createBtn.textContent = 'Create';
      }
    });
  }

  async renameCollection(collectionId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return;
    
    const renameDialogHTML = `
      <div class="comet-modal-content" style="max-width: 480px;">
        <div class="comet-modal-header">
          <h3>Rename Collection</h3>
        </div>
        <div class="comet-modal-body">
          <div class="comet-form-group">
            <label class="comet-form-label">New name:</label>
            <input type="text" class="comet-form-input" id="rename-input" value="${collection.name}" placeholder="Enter collection name">
            <div class="comet-form-hint">Press Enter to save</div>
          </div>
        </div>
        <div class="comet-modal-footer">
          <button class="comet-btn comet-btn-secondary comet-modal-cancel">Cancel</button>
          <button class="comet-btn comet-btn-primary" id="rename-confirm" disabled>Save</button>
        </div>
      </div>
    `;

    this.showModal(renameDialogHTML);

    const input = this.modalOverlay.querySelector('#rename-input');
    const saveBtn = this.modalOverlay.querySelector('#rename-confirm');

    const validate = () => {
      const val = (input.value || '').trim();
      const changed = val && val !== collection.name;
      saveBtn.disabled = !changed;
      saveBtn.style.opacity = changed ? '1' : '0.5';
    };
    input.addEventListener('input', validate);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !saveBtn.disabled) {
        saveBtn.click();
      }
    });
    input.focus();
    input.select();
    validate();

    saveBtn.addEventListener('click', async () => {
      const newName = (input.value || '').trim();
      if (!newName || newName === collection.name) return;
      try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        collection.name = newName;
        await this.saveCollections();
        this.renderCollections();
        this.showToast('Collection renamed', 'success');
        this.hideModal();
      } catch (err) {
        console.error('❌ Error renaming collection:', err);
        this.showToast('Failed to rename', 'error');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      }
    });
  }

  openAllPages(collectionId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection && collection.pages) {
      collection.pages.forEach(page => window.open(page.url, '_blank'));
    }
  }

  async deleteCollection(collectionId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return;

    const count = collection.pages?.length || 0;
    const deleteDialogHTML = `
      <div class="comet-modal-content" style="max-width: 480px;">
        <div class="comet-modal-header">
          <h3>Delete Collection</h3>
        </div>
        <div class="comet-modal-body">
          <p>Are you sure you want to delete "${collection.name}"${count ? ` and its ${count} page${count>1?'s':''}` : ''}?</p>
        </div>
        <div class="comet-modal-footer">
          <button class="comet-btn comet-btn-secondary comet-modal-cancel">Cancel</button>
          <button class="comet-btn comet-btn-danger" id="delete-collection-confirm">Delete</button>
        </div>
      </div>
    `;

    this.showModal(deleteDialogHTML);
    const confirmBtn = this.modalOverlay.querySelector('#delete-collection-confirm');
    confirmBtn.addEventListener('click', async () => {
      try {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Deleting...';
        this.collections = this.collections.filter(c => c.id !== collectionId);
        this.expandedCollections.delete(collectionId);
        await this.saveCollections();
        this.renderCollections();
        this.showToast('Collection deleted', 'success');
        this.hideModal();
      } catch (err) {
        console.error('❌ Error deleting collection:', err);
        this.showToast('Failed to delete', 'error');
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Delete';
      }
    });
  }

  async removePage(collectionId, pageId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (collection && collection.pages) {
      collection.pages = collection.pages.filter(p => p.id !== pageId);
      await this.saveCollections();
      this.renderCollections();
    }
  }

  async addCurrentPageToCollection(collectionId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return;

    let faviconUrl = this.currentTab.favIconUrl || '';
    try {
      const urlObj = new URL(this.currentTab.url);
      if (!faviconUrl) {
        faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${urlObj.hostname}`;
      }
    } catch {}

    const fallbackName = this.deriveTitleFallbackFromUrl(this.currentTab.url);
    const page = {
      id: Date.now().toString(),
      title: this.sanitizeTitle(this.currentTab.title, fallbackName) || fallbackName,
      url: this.currentTab.url,
      favicon: faviconUrl,
      addedAt: new Date().toISOString()
    };

    if (!collection.pages) collection.pages = [];

    const exists = collection.pages.some(p => p.url === page.url);
    if (exists) {
      this.showToast('Page already in this collection', 'warning');
      return;
    }

    collection.pages.push(page);
    await this.saveCollections();
    this.renderCollections();
    this.showToast('Page added to collection', 'success');
  }

  async showAddPageDialog() {
    if (this.collections.length === 0) {
      this.showToast('Create a collection first!', 'warning');
      return;
    }

    const addPageDialogHTML = `
      <div class="comet-modal-content" style="max-width: 500px;">
        <div class="comet-modal-header">
          <h3>+ Add Current Page to Collection</h3>
        </div>
        <div class="comet-modal-body">
          <div class="comet-form-group">
            <label class="comet-form-label">Page Title:</label>
            <input type="text" class="comet-form-input" id="page-title-input" value="${this.currentTab.title}">
          </div>
          <div class="comet-form-group">
            <label class="comet-form-label">Page URL:</label>
            <input type="text" class="comet-form-input" id="page-url-input" value="${this.currentTab.url}" readonly>
          </div>
          <div class="comet-form-group">
            <label class="comet-form-label">Add to Collection:</label>
            <select class="comet-form-select" id="collection-select">
              <option value="">Select a collection...</option>
              ${this.collections.map(collection => 
                `<option value="${collection.id}">${collection.name} (${collection.pages?.length || 0} pages)</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="comet-modal-footer">
          <button class="comet-btn comet-btn-secondary comet-modal-cancel">Cancel</button>
          <button class="comet-btn comet-btn-primary" id="add-page-confirm" disabled>Add Page</button>
        </div>
      </div>
    `;

    this.showModal(addPageDialogHTML);

    const collectionSelect = this.modalOverlay.querySelector('#collection-select');
    const addButton = this.modalOverlay.querySelector('#add-page-confirm');

    const validateForm = () => {
      const collectionId = collectionSelect.value;
      const isValid = collectionId;
      
      addButton.disabled = !isValid;
      addButton.style.opacity = isValid ? '1' : '0.5';
    };

    collectionSelect.addEventListener('change', validateForm);

    addButton.addEventListener('click', async () => {
      const collectionId = collectionSelect.value;
      const titleInput = this.modalOverlay.querySelector('#page-title-input');
      // Keep raw input; final sanitize with URL-based fallback happens on save
      this.currentTab.title = (titleInput.value || '').trim();

      if (!collectionId) {
        this.showToast('Please select a collection', 'error');
        return;
      }

      try {
        addButton.disabled = true;
        addButton.textContent = 'Adding...';
        
        await this.addCurrentPageToCollection(collectionId);
        this.hideModal();
      } catch (error) {
        console.error('❌ Error adding page:', error);
        this.showToast('Failed to add page', 'error');
      } finally {
        addButton.disabled = false;
        addButton.textContent = 'Add Page';
      }
    });

    validateForm();
  }

  showSidebar() {
    if (!this.sidebar) {
      this.createSidebar();
    }
    this.sidebar.classList.add('comet-visible');
  }

  hideSidebar() {
    if (this.sidebar) {
      this.sidebar.classList.remove('comet-visible');
    }
  }

  async showAddUrlDialog() {
    console.log('🔗 Starting showAddUrlDialog...');
    
    if (this.collections.length === 0) {
      this.showToast('Please create a collection first', 'warning');
      return;
    }

    // Try to get URL from clipboard
    let clipboardUrl = '';
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (this.isValidUrl(clipText)) {
          clipboardUrl = clipText.trim();
        }
      }
    } catch (error) {
      console.log('📋 Clipboard access not available:', error.message);
    }

    const addUrlDialogHTML = `
      <div class="comet-modal-content" style="max-width: 500px;">
        <div class="comet-modal-header">
          <h3>🔗 Add URL to Collection</h3>
        </div>
        <div class="comet-modal-body">
          <div class="comet-form-group">
            <label class="comet-form-label">URL:</label>
            <input type="url" class="comet-form-input" id="url-input" placeholder="https://example.com" value="${clipboardUrl}">
            <div class="comet-form-hint">
              ${clipboardUrl ? '📋 URL from clipboard detected!' : '💡 Copy a URL to your clipboard for auto-fill'}
            </div>
          </div>
          
          <div class="comet-form-group">
            <label class="comet-form-label">Custom Title (Optional):</label>
            <input type="text" class="comet-form-input" id="title-input" placeholder="Leave blank to use domain name">
            <div class="comet-form-hint">If empty, we'll use the domain name as title</div>
          </div>

          <div class="comet-form-group">
            <label class="comet-form-label">Add to Collection:</label>
            <select class="comet-form-select" id="collection-select">
              <option value="">Select a collection...</option>
              ${this.collections.map(collection => 
                `<option value="${collection.id}">${collection.name} (${collection.pages?.length || 0} pages)</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="comet-modal-footer">
          <button class="comet-btn comet-btn-secondary comet-modal-cancel">Cancel</button>
          <button class="comet-btn comet-btn-primary" id="add-url-confirm" disabled>Add URL</button>
        </div>
      </div>
    `;

    this.showModal(addUrlDialogHTML);

    // Get form elements
    const urlInput = this.modalOverlay.querySelector('#url-input');
    const titleInput = this.modalOverlay.querySelector('#title-input');
    const collectionSelect = this.modalOverlay.querySelector('#collection-select');
    const addButton = this.modalOverlay.querySelector('#add-url-confirm');

    // Validate form and enable/disable button
    const validateForm = () => {
      const url = urlInput.value.trim();
      const collectionId = collectionSelect.value;
      const isValid = this.isValidUrl(url) && collectionId;
      
      addButton.disabled = !isValid;
      addButton.style.opacity = isValid ? '1' : '0.5';
    };

    // Auto-validate on change
    urlInput.addEventListener('input', validateForm);
    collectionSelect.addEventListener('change', validateForm);

    // Focus on URL input
    urlInput.focus();
    if (clipboardUrl) {
      urlInput.select();
    }

    // Add URL button click
    addButton.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      const customTitle = titleInput.value.trim();
      const collectionId = collectionSelect.value;

      if (!this.isValidUrl(url)) {
        this.showToast('Please enter a valid URL', 'error');
        return;
      }

      if (!collectionId) {
        this.showToast('Please select a collection', 'error');
        return;
      }

      try {
        addButton.disabled = true;
        addButton.textContent = 'Adding...';
        
        await this.addUrlToCollection(url, customTitle, collectionId);
        this.hideModal();
      } catch (error) {
        console.error('❌ Error adding URL:', error);
        this.showToast('Failed to add URL', 'error');
      } finally {
        addButton.disabled = false;
        addButton.textContent = 'Add URL';
      }
    });

    // Initial validation
    validateForm();
  }

  async addUrlToCollection(url, customTitle, collectionId) {
    console.log('🔗 Adding URL to collection:', { url, customTitle, collectionId });
    
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) {
      throw new Error('Collection not found');
    }

    // Check if URL already exists
    const existingPage = collection.pages.find(p => p.url === url);
    if (existingPage) {
      this.showToast('URL already exists in this collection', 'warning');
      return;
    }

    // Create new page entry
    const urlObj = new URL(url);
    const baseTitle = customTitle || urlObj.hostname.replace('www.', '');
    const defaultTitle = this.sanitizeTitle(baseTitle, this.deriveTitleFallbackFromUrl(url));
    
    const newPage = {
      id: Date.now().toString(),
      title: defaultTitle,
      url: url,
      favicon: `https://www.google.com/s2/favicons?sz=32&domain=${urlObj.hostname}`,
      thumbnail: null, // No thumbnail for manually added URLs
      addedAt: new Date().toISOString(),
      isManuallyAdded: true
    };

    console.log('📝 Creating new URL page:', newPage);

    if (!collection.pages) collection.pages = [];
    collection.pages.push(newPage);
    
    await this.saveCollections();
    this.renderCollections();
    
    this.showToast(`Added "${defaultTitle}" to "${collection.name}"`, 'success');
    console.log('✅ URL added to collection successfully');
  }

  isValidUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  showModal(htmlContent) {
    if (!this.modalOverlay) {
      console.error('❌ Modal overlay not found');
      return;
    }

    this.modalOverlay.innerHTML = htmlContent;
    this.modalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Close modal when clicking overlay
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.hideModal();
      }
    });

    // Close modal when clicking cancel button
    const cancelBtn = this.modalOverlay.querySelector('.comet-modal-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.hideModal();
      });
    }

    // Handle escape key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  hideModal() {
    if (!this.modalOverlay) {
      console.error('❌ Modal overlay not found');
      return;
    }

    this.modalOverlay.style.display = 'none';
    this.modalOverlay.innerHTML = '';
    document.body.style.overflow = '';
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `comet-toast comet-toast-${type}`;
    toast.innerHTML = `
      <div class="comet-toast-content">
        <span class="comet-toast-icon">
          ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
        </span>
        <span class="comet-toast-message">${message}</span>
      </div>
    `;

    // Add to body
    document.body.appendChild(toast);

    // Show with animation
    setTimeout(() => toast.classList.add('comet-toast-show'), 100);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove('comet-toast-show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  toggleSidebar() {
    if (!this.sidebar) {
      this.createSidebar();
    }
    
    if (this.sidebar.classList.contains('comet-visible')) {
      this.hideSidebar();
    } else {
      this.showSidebar();
    }
  }
}

// Create global instance
const cometSidebar = new CometContentSidebar();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle') {
    cometSidebar.toggleSidebar();
    sendResponse({ success: true });
  }
});

console.log('✅ Comet Collections: Content script ready');
