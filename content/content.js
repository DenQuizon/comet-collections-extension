// Comet Collections Extension - Content Script
// Complete sidebar with collections management and advanced features

class CometCollectionsSidebar {
  constructor() {
    this.sidebar = null;
    this.collections = [];
    this.currentTheme = localStorage.getItem('comet-theme') || 'auto';
    this.expandedCollections = new Set();
    this.modalOverlay = null;
    this.contextMenu = null;
    
    // Phase 2: Enhanced features
    this.searchTerm = '';
    this.draggedElement = null;
    this.draggedType = null; // 'collection' or 'page'
    this.draggedData = null;
    this.selectionMode = false;
    this.selectedItems = new Set();
    this.thumbnailCache = new Map();
    
    // Collection color palette
    this.collectionColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    // Current page information
    this.currentTab = {
      title: document.title,
      url: window.location.href,
      favIconUrl: this.getFaviconUrl()
    };
    
    // Initialize
    this.init();
  }

  getFaviconUrl() {
    const favicon = document.querySelector('link[rel*="icon"]');
    return favicon ? favicon.href : null;
  }

  async init() {
    // Load collections from storage
    await this.loadCollections();
  }

  // =============================================
  // STORAGE MANAGEMENT
  // =============================================

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

  // =============================================
  // SIDEBAR CREATION AND MANAGEMENT
  // =============================================

  createSidebar() {
    if (this.sidebar) return this.sidebar;
    
    console.log('🏗️ Creating sidebar');
    
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

      <!-- Search and Bulk operations toolbar -->
      <div style="border-bottom: 1px solid; border-color: inherit;">
        <div style="padding: 12px 20px;">
          <div class="comet-search-container">
            <input type="text" class="comet-search-box" placeholder="Search collections..." id="comet-search-input">
            <span class="comet-search-icon">🔍</span>
            <button class="comet-search-clear" id="comet-search-clear">×</button>
          </div>
        </div>
        
        <div class="comet-bulk-toolbar" id="bulk-toolbar">
          <div class="comet-bulk-info" id="bulk-info">0 items selected</div>
          <div class="comet-bulk-actions">
            <button class="comet-bulk-btn" id="bulk-select-all">Select All</button>
            <button class="comet-bulk-btn comet-bulk-btn-primary" id="bulk-add-to-collection">Add to Collection</button>
            <button class="comet-bulk-btn" id="bulk-export">Export</button>
            <button class="comet-bulk-btn" id="bulk-cancel">Cancel</button>
          </div>
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
            <button class="comet-current-add-btn">+ Add to Collection</button>
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
    
    // Initialize UI after creation
    this.initializeUI();
    
    return sidebar;
  }

  async initializeUI() {
    if (!this.sidebar) return;
    
    console.log('🎨 Initializing UI');
    
    // Apply theme
    this.applyTheme();
    
    // Update current page info
    this.updateCurrentPageInfo();
    
    // Render collections
    this.renderCollections();

    // Setup theme selector
    const themeSelector = this.sidebar.querySelector('.comet-theme-selector');
    if (themeSelector) {
      themeSelector.value = this.currentTheme;
      themeSelector.addEventListener('change', (e) => {
        this.currentTheme = e.target.value;
        localStorage.setItem('comet-theme', this.currentTheme);
        this.applyTheme();
      });
    }

    // Setup header buttons
    this.setupHeaderButtons();
    
    // Setup global event listeners
    this.setupGlobalEventListeners();
    
    console.log('✨ UI initialized successfully');
  }

  setupHeaderButtons() {
    const addCollectionBtn = this.sidebar.querySelector('#comet-add-collection-btn');
    const refreshBtn = this.sidebar.querySelector('#comet-refresh-btn');
    const closeBtn = this.sidebar.querySelector('#comet-close-btn');
    const currentAddBtn = this.sidebar.querySelector('.comet-current-add-btn');
    const searchInput = this.sidebar.querySelector('#comet-search-input');
    const searchClear = this.sidebar.querySelector('#comet-search-clear');

    if (addCollectionBtn) {
      addCollectionBtn.addEventListener('click', () => this.createNewCollection());
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

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.applySearch();
      });
      
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.clearSearch();
        }
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => this.clearSearch());
    }

    // Setup bulk operations toolbar
    this.setupBulkOperationsToolbar();
  }

  setupBulkOperationsToolbar() {
    const bulkSelectAll = this.sidebar.querySelector('#bulk-select-all');
    const bulkAddToCollection = this.sidebar.querySelector('#bulk-add-to-collection');
    const bulkExport = this.sidebar.querySelector('#bulk-export');
    const bulkCancel = this.sidebar.querySelector('#bulk-cancel');

    if (bulkSelectAll) {
      bulkSelectAll.addEventListener('click', () => this.selectAllItems());
    }

    if (bulkAddToCollection) {
      bulkAddToCollection.addEventListener('click', () => this.bulkAddToCollection());
    }

    if (bulkExport) {
      bulkExport.addEventListener('click', () => this.exportSelectedCollections());
    }

    if (bulkCancel) {
      bulkCancel.addEventListener('click', () => this.exitSelectionMode());
    }
  }

  setupGlobalEventListeners() {
    // Click outside to close context menu and modals
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.comet-context-menu')) {
        this.hideContextMenu();
      }
      if (!e.target.closest('.comet-modal') && !e.target.closest('.comet-header-btn')) {
        this.hideModal();
      }
    });

    // Prevent modal close when clicking inside modal
    this.modalOverlay?.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.hideModal();
      }
    });
  }

  // =============================================
  // THEME MANAGEMENT
  // =============================================

  applyTheme() {
    if (!this.sidebar) return;
    
    // Remove existing theme classes
    this.sidebar.classList.remove('comet-theme-light', 'comet-theme-dark');
    
    // Apply new theme class
    if (this.currentTheme === 'light') {
      this.sidebar.classList.add('comet-theme-light');
    } else if (this.currentTheme === 'dark') {
      this.sidebar.classList.add('comet-theme-dark');
    }
    // Auto theme uses CSS media queries, so no class needed
    
    console.log('🎨 Theme applied:', this.currentTheme);
  }

  // =============================================
  // CURRENT PAGE MANAGEMENT
  // =============================================

  updateCurrentPageInfo() {
    if (!this.sidebar) return;
    
    console.log('🔄 Updating current page info...');
    
    const titleElement = this.sidebar.querySelector('.comet-current-title');
    const urlElement = this.sidebar.querySelector('.comet-current-url');
    const faviconElement = this.sidebar.querySelector('.comet-current-favicon');
    const faviconFallback = this.sidebar.querySelector('.comet-current-favicon-fallback');
    const addBtn = this.sidebar.querySelector('.comet-current-add-btn');

    // Update current tab info
    this.currentTab = {
      title: document.title || 'Untitled',
      url: window.location.href,
      favIconUrl: this.getFaviconUrl()
    };

    // Handle blank pages
    const isBlankPage = this.currentTab.url === 'about:blank';
    
    if (isBlankPage) {
      if (titleElement) titleElement.textContent = 'Blank Page';
      if (urlElement) urlElement.textContent = 'No address';
      if (addBtn) {
        addBtn.disabled = true;
        addBtn.style.opacity = '0.5';
        addBtn.style.cursor = 'not-allowed';
        addBtn.title = 'Cannot add a blank page to a collection';
      }
    } else {
      if (titleElement) titleElement.textContent = this.currentTab.title;
      if (urlElement) urlElement.textContent = this.getCleanUrl(this.currentTab.url);
      if (addBtn) {
        addBtn.disabled = false;
        addBtn.style.opacity = '1';
        addBtn.style.cursor = 'pointer';
        addBtn.title = 'Add to Collection';
      }
    }
    
    console.log('📄 Current tab updated:', this.currentTab);

    // Handle favicon
    if (faviconElement && this.currentTab.favIconUrl && !isBlankPage) {
      faviconElement.src = this.currentTab.favIconUrl;
      faviconElement.style.display = 'block';
      if (faviconFallback) faviconFallback.style.display = 'none';
    } else {
      if (faviconElement) faviconElement.style.display = 'none';
      if (faviconFallback) faviconFallback.style.display = 'flex';
    }
  }

  getCleanUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname.replace(/\/$/, '');
    } catch {
      return url;
    }
  }

  // =============================================
  // COLLECTIONS RENDERING
  // =============================================

  renderCollections() {
    const container = this.sidebar?.querySelector('#collections-container');
    if (!container) return;

    console.log('📋 Rendering collections:', this.collections.length);

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
      
      return this.renderCollectionCard(collection, isExpanded, pageCount);
    }).join('');

    // Attach event listeners
    this.attachCollectionEvents();
  }

  renderCollectionCard(collection, isExpanded, pageCount) {
    const previewPages = collection.pages?.slice(0, 5) || [];
    
    const previewHTML = isExpanded ? `
      <div class="comet-collection-preview">
        ${previewPages.length > 0 ? previewPages.map(page => `
          <div class="comet-preview-item" data-url="${page.url}" data-page-id="${page.id}">
            ${this.renderPageThumbnail(page)}
            <div class="comet-page-info">
              <div class="comet-page-title">${page.title}</div>
              <div class="comet-page-url">${this.getCleanUrl(page.url)}</div>
            </div>
            <button class="comet-page-remove" data-page-id="${page.id}" data-collection-id="${collection.id}" title="Remove page">×</button>
          </div>
        `).join('') : '<div class="comet-preview-empty">No pages in this collection</div>'}
        ${pageCount > 5 ? `<div class="comet-preview-more">+${pageCount - 5} more pages</div>` : ''}
      </div>
    ` : '';

    return `
      <div class="comet-collection-card ${isExpanded ? 'expanded' : ''}" data-collection-id="${collection.id}">
        <div class="comet-collection-header">
          <div class="comet-collection-main">
            <div class="comet-expand-icon">▶</div>
            <div class="comet-collection-icon" style="background-color: ${collection.color}">
              ${collection.name.charAt(0).toUpperCase()}
            </div>
            <div class="comet-collection-info">
              <div class="comet-collection-name">${collection.name}</div>
              <div class="comet-collection-count">${pageCount} pages</div>
            </div>
          </div>
          <button class="comet-collection-more" data-collection-id="${collection.id}" title="More options">⋯</button>
        </div>
        ${previewHTML}
      </div>
    `;
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

    // Setup drag and drop for collections
    this.sidebar.querySelectorAll('.comet-collection-card').forEach(card => {
      this.setupDragForCollection(card);
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
      if (item.classList.contains('comet-preview-empty')) return;
      
      const collectionId = item.closest('.comet-collection-card').dataset.collectionId;
      this.setupDragForPage(item, collectionId);
      
      item.addEventListener('click', (e) => {
        if (e.target.classList.contains('comet-page-remove') || 
            e.target.classList.contains('comet-drag-handle')) return;
        const url = item.dataset.url;
        if (url) {
          chrome.runtime.sendMessage({ action: 'open-tab', url });
        }
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

  // =============================================
  // COLLECTIONS CRUD OPERATIONS
  // =============================================

  async createNewCollection() {
    console.log('➕ Creating new collection');
    
    const result = await this.showCustomDialog({
      title: 'New Collection',
      content: `
        <div class="comet-dialog-row">Enter a name for your new collection:</div>
        <input type="text" id="comet-dialog-input" placeholder="Collection name" class="comet-input">
        <div class="comet-dialog-row comet-color-picker">
          <label>Choose a color:</label>
          <div class="comet-color-options">
            ${this.collectionColors.map((color, index) => 
              `<div class="comet-color-option ${index === 0 ? 'selected' : ''}" data-color="${color}" style="background-color: ${color}"></div>`
            ).join('')}
          </div>
        </div>
      `,
      buttons: [
        { id: 'cancel', text: 'Cancel', value: null, class: 'comet-btn-secondary' },
        { id: 'create', text: 'Create', value: 'confirm', class: 'comet-btn-primary' }
      ],
      customSetup: (modal) => {
        const colorOptions = modal.querySelectorAll('.comet-color-option');
        colorOptions.forEach(option => {
          option.addEventListener('click', () => {
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
          });
        });
      }
    });

    if (!result || result.button !== 'create' || !result.input?.trim()) return;

    const selectedColorEl = result.modal.querySelector('.comet-color-option.selected');
    const selectedColor = selectedColorEl ? selectedColorEl.dataset.color : this.collectionColors[0];

    const newCollection = {
      id: Date.now().toString(),
      name: result.input.trim(),
      color: selectedColor,
      pages: [],
      createdAt: new Date().toISOString()
    };

    this.collections.unshift(newCollection);
    await this.saveCollections();
    this.renderCollections();
    
    console.log('✅ Collection created:', newCollection.name);
  }

  async renameCollection(collectionId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return;

    console.log('✏️ Renaming collection:', collection.name);

    const result = await this.showCustomDialog({
      title: 'Rename Collection',
      content: `<div class="comet-dialog-row">Enter a new name for "${collection.name}":</div>`,
      input: { placeholder: 'Collection name', value: collection.name },
      buttons: [
        { id: 'cancel', text: 'Cancel', value: null, class: 'comet-btn-secondary' },
        { id: 'rename', text: 'Rename', value: 'confirm', class: 'comet-btn-primary' }
      ]
    });

    if (result && result.button === 'rename' && result.input?.trim() && result.input.trim() !== collection.name) {
      collection.name = result.input.trim();
      await this.saveCollections();
      this.renderCollections();
      console.log('✅ Collection renamed to:', collection.name);
    }
  }

  async deleteCollection(collectionId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return;

    console.log('🗑️ Deleting collection:', collection.name);

    const confirmed = await this.showCustomDialog({
      title: 'Delete Collection',
      content: `<div class="comet-dialog-row">Are you sure you want to delete "${collection.name}"? This will also delete all ${collection.pages.length} pages in it.</div>`,
      buttons: [
        { id: 'cancel', text: 'Cancel', value: false, class: 'comet-btn-secondary' },
        { id: 'delete', text: 'Delete', value: true, class: 'comet-btn-danger' }
      ]
    });

    if (confirmed) {
      this.collections = this.collections.filter(c => c.id !== collectionId);
      this.expandedCollections.delete(collectionId);
      await this.saveCollections();
      this.renderCollections();
      console.log('✅ Collection deleted');
    }
  }

  async removePage(collectionId, pageId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return;

    const page = collection.pages?.find(p => p.id === pageId);
    if (!page) return;

    console.log('🗑️ Removing page:', page.title);

    const confirmed = await this.showCustomDialog({
      title: 'Remove Page',
      content: `<div class="comet-dialog-row">Remove "${page.title}" from this collection?</div>`,
      buttons: [
        { id: 'cancel', text: 'Cancel', value: false, class: 'comet-btn-secondary' },
        { id: 'remove', text: 'Remove', value: true, class: 'comet-btn-danger' }
      ]
    });

    if (confirmed) {
      collection.pages = collection.pages.filter(p => p.id !== pageId);
      await this.saveCollections();
      this.renderCollections();
      console.log('✅ Page removed');
    }
  }

  async openAllPages(collectionId) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection || !collection.pages.length) return;

    console.log('🔗 Opening all pages from:', collection.name);

    // Show opening mode dialog
    const mode = await this.showCustomDialog({
      title: 'Open All Pages',
      content: `<div class="comet-dialog-row">How would you like to open all ${collection.pages.length} pages from "${collection.name}"?</div>`,
      buttons: [
        { id: 'cancel', text: 'Cancel', value: null, class: 'comet-btn-secondary' },
        { id: 'same', text: 'Same Window', value: 'same', class: 'comet-btn-primary' },
        { id: 'new', text: 'New Window', value: 'new-window', class: 'comet-btn-primary' },
        { id: 'incognito', text: 'Incognito', value: 'incognito', class: 'comet-btn-primary' }
      ]
    });

    if (!mode) return;

    // Extract the actual mode value from the dialog result
    const modeValue = typeof mode === 'object' ? mode.value : mode;

    const urls = collection.pages.map(page => page.url);
    
    try {
      await chrome.runtime.sendMessage({
        action: 'open-all-pages',
        urls: urls,
        mode: modeValue
      });
      console.log('✅ All pages opened in mode:', modeValue);
    } catch (error) {
      console.error('❌ Error opening pages:', error);
      this.showToast('Error opening pages', 'error');
    }
  }

  // =============================================
  // ADD CURRENT PAGE FUNCTIONALITY
  // =============================================

  async showAddPageDialog() {
    console.log('📄 Starting showAddPageDialog...');
    await this.updateCurrentPageInfo();
    console.log('📄 Current tab after update:', this.currentTab);
    
    if (this.collections.length === 0) {
      const shouldCreate = await this.showCustomDialog({
        title: 'No Collections',
        content: 'You need to create a collection first. Would you like to create one now?',
        buttons: [
          { id: 'cancel', text: 'Cancel', value: false, class: 'comet-btn-secondary' },
          { id: 'create', text: 'Create Collection', value: true, class: 'comet-btn-primary' }
        ]
      });

      if (shouldCreate) {
        await this.createNewCollection();
      }
      return;
    }

    console.log('📄 Adding current page to collection');

    // Show collection picker with event delegation approach
    const collectionsHTML = this.collections.map(collection => `
      <div class="comet-collection-picker-item" 
           data-collection-id="${collection.id}" 
           data-action="add-to-collection"
           style="display: flex; align-items: center; gap: 12px; padding: 16px; 
                  background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); 
                  border: 2px solid rgba(255, 255, 255, 0.2); border-radius: 12px; 
                  cursor: pointer; margin-bottom: 12px; transition: all 0.3s ease;
                  color: #ffffff; font-weight: 500;"
           onmouseover="this.style.background='rgba(255,255,255,0.2)'; this.style.borderColor='rgba(255,255,255,0.4)'; this.style.transform='translateY(-2px)'"
           onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(255,255,255,0.2)'; this.style.transform='translateY(0)'">
        <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, ${collection.color}, ${collection.color}88); display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          ${collection.name.charAt(0).toUpperCase()}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #ffffff; font-size: 16px; margin-bottom: 2px;">${collection.name}</div>
          <div style="font-size: 13px; color: rgba(255,255,255,0.7);">${collection.pages?.length || 0} pages</div>
        </div>
      </div>
    `).join('');

    // Create a self-contained cleanup function
    const cleanup = () => {
      console.log('🧹 Cleaning up add dialog...');
      if (modal.parentNode) {
        modal.remove();
      }
    };

    // Show the modal with glassmorphism styling
    const modal = document.createElement('div');
    modal.className = 'comet-modal-overlay';
    
    // Set proper styles using style properties for better browser support
    Object.assign(modal.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)', // Safari support
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '2147483648',
      animation: 'fadeIn 0.3s ease'
    });
    
    // Add fallback for browsers without backdrop-filter support
    if (!CSS.supports('backdrop-filter', 'blur(1px)') && !CSS.supports('-webkit-backdrop-filter', 'blur(1px)')) {
      modal.style.background = 'rgba(0, 0, 0, 0.9)';
    }

    modal.innerHTML = `
      <div class="comet-modal comet-glass-modal" style="
        background: rgba(0, 0, 0, 0.7); 
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px;
        padding: 0; min-width: 420px; max-width: 500px; width: 90%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      ">
        <div style="padding: 24px 28px 20px; border-bottom: 1px solid rgba(255,255,255,0.1);">
          <h3 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">Add Page to Collection</h3>
        </div>
        <div style="padding: 24px 28px;">
          <div style="margin-bottom: 20px; color: rgba(255,255,255,0.9); font-size: 15px;">
            Add "<span id="current-page-title">${this.currentTab?.title || 'Current Page'}</span>" to:
          </div>
          <div style="max-height: 320px; overflow-y: auto; padding: 4px;">
            ${collectionsHTML}
          </div>
        </div>
        <div style="padding: 20px 28px 24px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: flex-end;">
          <button data-action="cancel"
                  style="padding: 12px 24px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); 
                         border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; 
                         font-weight: 600; transition: all 0.2s ease;"
                  onmouseover="this.style.background='rgba(255,255,255,0.2)'"
                  onmouseout="this.style.background='rgba(255,255,255,0.1)'">
            Cancel
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event delegation for all modal interactions
    modal.addEventListener('click', async (e) => {
      // Background click
      if (e.target === modal) {
        cleanup();
        return;
      }

      // Cancel button click
      const cancelButton = e.target.closest('button[data-action="cancel"]');
      if (cancelButton) {
        cleanup();
        return;
      }

      // Collection item click
      const collectionItem = e.target.closest('.comet-collection-picker-item');
      if (collectionItem) {
        const collectionId = collectionItem.dataset.collectionId;
        try {
          await this.addCurrentPageToCollection(collectionId);
          cleanup();
        } catch (error) {
          console.error('❌ Error adding page to collection:', error);
          this.showToast('Failed to add page to collection', 'error');
        }
        return;
      }
    });
  }

  async addCurrentPageToCollection(collectionId) {
    console.log('🚀 Adding current page to collection:', collectionId);
    console.log('Current tab info:', this.currentTab);
    
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) {
      console.error('❌ Collection not found:', collectionId);
      this.showToast('Collection not found', 'error');
      return;
    }

    console.log('✅ Found collection:', collection.name);

    // Check if page already exists
    const existingPage = collection.pages.find(p => p.url === this.currentTab.url);
    if (existingPage) {
      console.log('⚠️ Page already exists in collection');
      this.showToast('Page already exists in this collection', 'warning');
      return;
    }

    console.log('📸 Capturing thumbnail...');
    // Capture thumbnail for current page
    const thumbnail = await this.captureCurrentPageThumbnail();
    console.log('Thumbnail captured:', thumbnail ? 'Success' : 'Failed');

    const newPage = {
      id: Date.now().toString(),
      title: this.currentTab.title,
      url: this.currentTab.url,
      favicon: this.currentTab.favIconUrl || '',
      thumbnail: thumbnail,
      addedAt: new Date().toISOString()
    };

    console.log('📝 Creating new page:', newPage);

    if (!collection.pages) collection.pages = [];
    collection.pages.push(newPage);
    
    console.log('💾 Saving collections...');
    await this.saveCollections();
    
    console.log('🎨 Rendering collections...');
    this.renderCollections();
    
    this.showToast(`Added to "${collection.name}"`, 'success');
    
    console.log('✅ Page added to collection successfully:', collection.name);
    console.log('Collection now has', collection.pages.length, 'pages');
  }

  // =============================================
  // CONTEXT MENU
  // =============================================

  showContextMenu(event, collectionId) {
    event.preventDefault();
    event.stopPropagation();

    console.log('📋 Showing context menu for collection:', collectionId);

    const menu = this.contextMenu;
    menu.innerHTML = `
      <div class="comet-context-item" data-action="rename" data-id="${collectionId}" style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; cursor: pointer; color: #ffffff; background: transparent; border-radius: 6px; transition: background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
        <span class="comet-context-icon" style="font-size: 14px;">✏️</span>
        <span class="comet-context-text" style="font-size: 14px; font-weight: 500;">Rename</span>
      </div>
      <div class="comet-context-item" data-action="open-all" data-id="${collectionId}" style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; cursor: pointer; color: #ffffff; background: transparent; border-radius: 6px; transition: background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
        <span class="comet-context-icon" style="font-size: 14px;">🔗</span>
        <span class="comet-context-text" style="font-size: 14px; font-weight: 500;">Open all</span>
      </div>
      <div class="comet-context-divider" style="height: 1px; background: rgba(255,255,255,0.2); margin: 4px 0;"></div>
      <div class="comet-context-item" data-action="delete" data-id="${collectionId}" style="display: flex; align-items: center; gap: 8px; padding: 12px 16px; cursor: pointer; color: #ff4757; background: transparent; border-radius: 6px; transition: background 0.2s ease;" onmouseover="this.style.background='rgba(255,71,87,0.1)'" onmouseout="this.style.background='transparent'">
        <span class="comet-context-icon" style="font-size: 14px;">🗑️</span>
        <span class="comet-context-text" style="font-size: 14px; font-weight: 500;">Delete</span>
      </div>
    `;

    // Enhanced context menu styling with proper backdrop-filter support
    Object.assign(menu.style, {
      display: 'block',
      position: 'absolute',
      left: Math.min(event.clientX - this.sidebar.offsetLeft, this.sidebar.offsetWidth - 150) + 'px',
      top: event.clientY + 'px',
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', // Safari support
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '8px',
      minWidth: '140px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      zIndex: '2147483649',
      animation: 'contextMenuSlideIn 0.2s ease'
    });
    
    // Add fallback for browsers without backdrop-filter support
    if (!CSS.supports('backdrop-filter', 'blur(1px)') && !CSS.supports('-webkit-backdrop-filter', 'blur(1px)')) {
      menu.style.background = 'rgba(0, 0, 0, 0.95)';
      menu.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.6)';
    }

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
    console.log('🎬 Handling context menu action:', action, collectionId);
    
    switch (action) {
      case 'rename':
        await this.renameCollection(collectionId);
        break;
      case 'open-all':
        await this.openAllPages(collectionId);
        break;
      case 'delete':
        await this.deleteCollection(collectionId);
        break;
    }
  }

  // =============================================
  // PHASE 2: ADVANCED FEATURES
  // =============================================

  // ========== SEARCH FUNCTIONALITY ==========

  applySearch() {
    const container = this.sidebar?.querySelector('#collections-container');
    if (!container || !this.searchTerm) {
      this.showSearchResults();
      return;
    }

    let visibleCollections = 0;
    let visiblePages = 0;

    this.sidebar.querySelectorAll('.comet-collection-card').forEach(card => {
      const collectionId = card.dataset.collectionId;
      const collection = this.collections.find(c => c.id === collectionId);
      
      const collectionMatches = collection.name.toLowerCase().includes(this.searchTerm);
      const pageMatches = collection.pages.some(page => 
        page.title.toLowerCase().includes(this.searchTerm) || 
        page.url.toLowerCase().includes(this.searchTerm)
      );

      if (collectionMatches || pageMatches) {
        card.classList.remove('filtered-out');
        visibleCollections++;
        
        // Expand collection if pages match
        if (pageMatches && !collectionMatches) {
          this.expandedCollections.add(collectionId);
        }
        
        // Filter pages within collection
        card.querySelectorAll('.comet-preview-item').forEach(item => {
          const url = item.dataset.url;
          const page = collection.pages.find(p => p.url === url);
          if (page && (page.title.toLowerCase().includes(this.searchTerm) || 
                      page.url.toLowerCase().includes(this.searchTerm))) {
            item.classList.remove('filtered-out');
            visiblePages++;
          } else {
            item.classList.add('filtered-out');
          }
        });
      } else {
        card.classList.add('filtered-out');
      }
    });

    this.showSearchResults(visibleCollections, visiblePages);
    this.renderCollections(); // Re-render to apply expansion
  }

  showSearchResults(collections = 0, pages = 0) {
    let resultsHTML = '';
    if (this.searchTerm) {
      resultsHTML = `
        <div class="comet-search-results">
          Found ${collections} collections and ${pages} pages matching "${this.searchTerm}"
        </div>
      `;
    }

    const contentEl = this.sidebar?.querySelector('.comet-sidebar-content');
    let resultsEl = contentEl?.querySelector('.comet-search-results');
    
    if (resultsHTML) {
      if (!resultsEl) {
        contentEl.insertAdjacentHTML('afterbegin', resultsHTML);
      } else {
        resultsEl.outerHTML = resultsHTML;
      }
    } else if (resultsEl) {
      resultsEl.remove();
    }
  }

  clearSearch() {
    this.searchTerm = '';
    const searchInput = this.sidebar?.querySelector('#comet-search-input');
    if (searchInput) searchInput.value = '';
    
    this.sidebar?.querySelectorAll('.filtered-out').forEach(el => {
      el.classList.remove('filtered-out');
    });
    
    this.showSearchResults();
  }

  // ========== DRAG & DROP FUNCTIONALITY ==========

  setupDragForCollection(card) {
    card.draggable = true;
    
    card.addEventListener('dragstart', (e) => {
      this.draggedElement = card;
      this.draggedType = 'collection';
      this.draggedData = { id: card.dataset.collectionId };
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', (e) => {
      card.classList.remove('dragging');
      this.draggedElement = null;
      this.draggedType = null;
      this.draggedData = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedType === 'collection' && this.draggedElement !== card) {
        card.classList.add('drag-over');
      }
    });

    card.addEventListener('dragleave', (e) => {
      card.classList.remove('drag-over');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      
      if (this.draggedType === 'collection' && this.draggedElement !== card) {
        this.reorderCollection(this.draggedData.id, card.dataset.collectionId);
      }
    });
  }

  setupDragForPage(item, collectionId) {
    item.draggable = true;
    
    // Add drag handle
    const dragHandle = document.createElement('span');
    dragHandle.className = 'comet-drag-handle';
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.title = 'Drag to reorder';
    item.insertBefore(dragHandle, item.firstChild);

    item.addEventListener('dragstart', (e) => {
      this.draggedElement = item;
      this.draggedType = 'page';
      this.draggedData = { 
        pageId: item.dataset.url, 
        collectionId: collectionId 
      };
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', (e) => {
      item.classList.remove('dragging');
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedType === 'page' && this.draggedElement !== item) {
        item.classList.add('drag-over');
      }
    });

    item.addEventListener('dragleave', (e) => {
      item.classList.remove('drag-over');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      
      if (this.draggedType === 'page' && this.draggedElement !== item) {
        this.reorderPage(
          this.draggedData.collectionId,
          this.draggedData.pageId,
          item.dataset.url
        );
      }
    });
  }

  async reorderCollection(draggedId, targetId) {
    const draggedIndex = this.collections.findIndex(c => c.id === draggedId);
    const targetIndex = this.collections.findIndex(c => c.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Move collection
    const [draggedCollection] = this.collections.splice(draggedIndex, 1);
    this.collections.splice(targetIndex, 0, draggedCollection);
    
    await this.saveCollections();
    this.renderCollections();
    console.log('✅ Collection reordered');
  }

  async reorderPage(collectionId, draggedPageUrl, targetPageUrl) {
    const collection = this.collections.find(c => c.id === collectionId);
    if (!collection) return;
    
    const draggedIndex = collection.pages.findIndex(p => p.url === draggedPageUrl);
    const targetIndex = collection.pages.findIndex(p => p.url === targetPageUrl);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Move page
    const [draggedPage] = collection.pages.splice(draggedIndex, 1);
    collection.pages.splice(targetIndex, 0, draggedPage);
    
    await this.saveCollections();
    this.renderCollections();
    console.log('✅ Page reordered');
  }

  // ========== THUMBNAIL FUNCTIONALITY ==========

  async captureCurrentPageThumbnail() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'capture-thumbnail' });
      console.log('📸 Thumbnail capture response:', response);
      
      if (response && response.success && response.thumbnail) {
        this.thumbnailCache.set(this.currentTab.url, response.thumbnail);
        return response.thumbnail;
      } else {
        console.warn('⚠️ Thumbnail capture failed or returned invalid response:', response);
      }
    } catch (error) {
      console.error('❌ Error capturing thumbnail:', error);
    }
    return null;
  }

  renderPageThumbnail(page) {
    const cached = this.thumbnailCache.get(page.url);
    
    if (cached) {
      return `
        <div class="comet-page-thumbnail">
          <img src="${cached}" alt="Page thumbnail">
        </div>
      `;
    }
    
    if (page.favicon) {
      return `
        <div class="comet-page-thumbnail">
          <img src="${page.favicon}" alt="Favicon" style="width: 20px; height: 20px; object-fit: contain;">
        </div>
      `;
    }
    
    return `
      <div class="comet-page-thumbnail">
        <div class="comet-page-thumbnail-placeholder">📄</div>
      </div>
    `;
  }

  setupModalTabs() {
    const tabs = this.modalOverlay.querySelectorAll('.comet-modal-tab');
    const contents = this.modalOverlay.querySelectorAll('.comet-modal-tab-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Update tab styling
        tabs.forEach(t => {
          t.style.background = 'var(--comet-bg-secondary)';
          t.style.color = 'var(--comet-text-primary)';
        });
        tab.style.background = 'var(--comet-accent)';
        tab.style.color = 'white';
        
        // Show/hide content
        contents.forEach(c => c.style.display = 'none');
        const targetContent = this.modalOverlay.querySelector(`.comet-modal-tab-content[data-tab="${targetTab}"]`);
        if (targetContent) {
          targetContent.style.display = 'block';
        }
      });
    });
  }

  setupBulkOperationHandlers() {
    const addAllTabsBtn = this.modalOverlay.querySelector('#add-all-tabs');
    const exportAllBtn = this.modalOverlay.querySelector('#export-all');
    const importFileInput = this.modalOverlay.querySelector('#import-file');

    if (addAllTabsBtn) {
      addAllTabsBtn.addEventListener('click', () => this.addAllTabsToCollection());
    }

    if (exportAllBtn) {
      exportAllBtn.addEventListener('click', () => this.exportAllCollections());
    }

    if (importFileInput) {
      importFileInput.addEventListener('change', (e) => this.importCollections(e));
    }
  }

  async addAllTabsToCollection() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'get-all-tabs' });
      if (!response.success) {
        this.showToast('Failed to get tabs', 'error');
        return;
      }

      this.hideModal();

      // Filter out special URLs
      const validTabs = response.tabs.filter(tab => 
        !tab.url.startsWith('chrome://') && 
        !tab.url.startsWith('edge://') &&
        !tab.url.startsWith('chrome-extension://')
      );

      if (validTabs.length === 0) {
        this.showToast('No valid tabs to add', 'warning');
        return;
      }

      if (this.collections.length === 0) {
        // Create new collection for all tabs
        const name = await this.showCustomDialog({
          title: 'New Collection',
          content: 'Name for the new collection:',
          input: { placeholder: 'Collection name', value: 'All Current Tabs' },
          buttons: [
            { id: 'cancel', text: 'Cancel', value: null, class: 'comet-btn-secondary' },
            { id: 'create', text: 'Create', value: true, class: 'comet-btn-primary' }
          ]
        });

        if (!name?.trim()) return;

        const newCollection = {
          id: Date.now().toString(),
          name: name.trim(),
          color: this.collectionColors[Math.floor(Math.random() * this.collectionColors.length)],
          pages: validTabs.map(tab => ({
            id: Date.now().toString() + Math.random(),
            title: tab.title,
            url: tab.url,
            favicon: tab.favIconUrl || '',
            addedAt: new Date().toISOString()
          })),
          createdAt: new Date().toISOString()
        };

        this.collections.unshift(newCollection);
        await this.saveCollections();
        this.renderCollections();
        this.showToast(`Created "${newCollection.name}" with ${newCollection.pages.length} tabs`, 'success');
        return;
      }

      // Show collection picker for existing collections
      const collectionsHTML = this.collections.map(collection => `
        <div class="comet-collection-picker-item" data-collection-id="${collection.id}" style="display: flex; align-items: center; gap: 12px; padding: 12px; border: 1px solid #e1e5e9; border-radius: 6px; cursor: pointer; margin-bottom: 8px;">
          <div style="width: 24px; height: 24px; border-radius: 4px; background-color: ${collection.color}; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 12px;">
            ${collection.name.charAt(0).toUpperCase()}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 500;">${collection.name}</div>
            <div style="font-size: 12px; opacity: 0.7;">${collection.pages.length} pages</div>
          </div>
        </div>
      `).join('');

      this.showCustomDialog({
        title: 'Add All Tabs',
        content: `
          <div style="margin-bottom: 16px;">Add ${validTabs.length} tabs to:</div>
          <div style="max-height: 300px; overflow-y: auto;">
            ${collectionsHTML}
          </div>
        `,
        buttons: [
          { id: 'cancel', text: 'Cancel', value: null, class: 'comet-btn-secondary' }
        ],
        customHandler: true
      });

      // Handle collection selection
      setTimeout(() => {
        const pickerItems = this.modalOverlay.querySelectorAll('.comet-collection-picker-item');
        pickerItems.forEach(item => {
          item.addEventListener('click', async () => {
            const collectionId = item.dataset.collectionId;
            const collection = this.collections.find(c => c.id === collectionId);
            
            let addedCount = 0;
            validTabs.forEach(tab => {
              // Check if page already exists
              const exists = collection.pages.some(p => p.url === tab.url);
              if (!exists) {
                collection.pages.push({
                  id: Date.now().toString() + Math.random(),
                  title: tab.title,
                  url: tab.url,
                  favicon: tab.favIconUrl || '',
                  addedAt: new Date().toISOString()
                });
                addedCount++;
              }
            });

            await this.saveCollections();
            this.renderCollections();
            this.hideModal();
            this.showToast(`Added ${addedCount} tabs to "${collection.name}"`, 'success');
          });
        });
      }, 100);

    } catch (error) {
      console.error('❌ Error adding all tabs:', error);
      this.showToast('Error adding tabs', 'error');
    }
  }

  // ========== IMPORT/EXPORT ==========

  async exportAllCollections() {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      collections: this.collections
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comet-collections-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.hideModal();
    this.showToast('Collections exported successfully', 'success');
    console.log('✅ Collections exported');
  }

  async importCollections(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.collections || !Array.isArray(importData.collections)) {
        throw new Error('Invalid file format');
      }

      const mergeOption = await this.showCustomDialog({
        title: 'Import Collections',
        content: `
          <p>Found ${importData.collections.length} collections in the file.</p>
          <p>How would you like to import them?</p>
        `,
        buttons: [
          { id: 'cancel', text: 'Cancel', value: null, class: 'comet-btn-secondary' },
          { id: 'merge', text: 'Merge', value: 'merge', class: 'comet-btn-primary' },
          { id: 'replace', text: 'Replace All', value: 'replace', class: 'comet-btn-danger' }
        ]
      });

      if (!mergeOption) return;

      if (mergeOption === 'replace') {
        this.collections = importData.collections;
      } else {
        // Merge - add imported collections with new IDs
        importData.collections.forEach(importedCollection => {
          const newCollection = {
            ...importedCollection,
            id: Date.now().toString() + Math.random(),
            name: `${importedCollection.name} (Imported)`
          };
          this.collections.push(newCollection);
        });
      }

      await this.saveCollections();
      this.renderCollections();
      this.hideModal();
      this.showToast(`Successfully imported ${importData.collections.length} collections`, 'success');
      console.log('✅ Collections imported');

    } catch (error) {
      console.error('❌ Error importing collections:', error);
      this.showToast('Error importing file', 'error');
    }
  }

  // ========== SELECTION MODE ==========

  selectAllItems() {
    this.collections.forEach(collection => {
      this.selectedItems.add(collection.id);
    });
    this.updateBulkSelectionUI();
    this.renderCollections();
  }

  exitSelectionMode() {
    this.selectionMode = false;
    this.selectedItems.clear();
    
    const toolbar = this.sidebar.querySelector('#bulk-toolbar');
    const collectionsList = this.sidebar.querySelector('.comet-collections-list');
    
    if (toolbar) toolbar.classList.remove('active');
    if (collectionsList) collectionsList.classList.remove('selection-mode');
    
    this.renderCollections();
  }

  updateBulkSelectionUI() {
    const bulkInfo = this.sidebar.querySelector('#bulk-info');
    if (bulkInfo) {
      bulkInfo.textContent = `${this.selectedItems.size} items selected`;
    }
  }

  async bulkAddToCollection() {
    this.showToast('Bulk operations coming in next update', 'info');
  }

  async exportSelectedCollections() {
    const selectedCollections = this.collections.filter(c => 
      this.selectedItems.has(c.id)
    );

    if (selectedCollections.length === 0) {
      this.showToast('No collections selected', 'warning');
      return;
    }

    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      collections: selectedCollections
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comet-collections-selected-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast(`Exported ${selectedCollections.length} collections`, 'success');
    console.log('✅ Selected collections exported');
  }

  // =============================================
  // MODAL SYSTEM
  // =============================================

  showCustomDialog({ title, content, buttons, input = null, customSetup = null }) {
    return new Promise((resolve) => {
      console.log('💬 Showing dialog:', title);
      
      // Create modal with glassmorphism effect
      const modalOverlay = document.createElement('div');
      modalOverlay.className = 'comet-modal-overlay';
      
      Object.assign(modalOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '2147483648',
        animation: 'fadeIn 0.3s ease'
      });

      if (!CSS.supports('backdrop-filter', 'blur(1px)')) {
        modalOverlay.style.background = 'rgba(0, 0, 0, 0.9)';
      }

      const modal = document.createElement('div');
      modal.className = 'comet-modal comet-glass-modal';

      let inputHTML = '';
      if (input) {
        inputHTML = `<input type="text" id="comet-dialog-input" placeholder="${input.placeholder || ''}" value="${input.value || ''}" class="comet-input">`;
      }

      const buttonHTML = buttons.map(btn => 
        `<button id="${btn.id}" data-value="${btn.value}" class="${btn.class || 'comet-btn'}">${btn.text}</button>`
      ).join('');

      modal.innerHTML = `
        <h3 class="comet-modal-title">${title}</h3>
        <div class="comet-modal-content">
          ${content}
          ${inputHTML}
        </div>
        <div class="comet-modal-buttons">${buttonHTML}</div>
      `;

      modalOverlay.appendChild(modal);
      document.body.appendChild(modalOverlay);

      // Run custom setup logic if provided
      if (customSetup) {
        customSetup(modal);
      }

      const cleanup = (value) => {
        modalOverlay.remove();
        resolve(value);
      };

      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          cleanup(null); // Click on background
        }
      });

      modal.querySelectorAll('button').forEach(buttonElement => {
        buttonElement.addEventListener('click', () => {
          const inputElement = modal.querySelector('#comet-dialog-input');
          const returnValue = {
            button: buttonElement.id,
            value: buttonElement.dataset.value,
            input: inputElement ? inputElement.value : null,
            modal: modal
          };
          cleanup(returnValue.value === 'true' ? true : returnValue.value === 'false' ? false : returnValue);
        });
      });
      
      const inputElement = modal.querySelector('#comet-dialog-input');
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
        inputElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const confirmButton = modal.querySelector('.comet-btn-primary');
            if (confirmButton) confirmButton.click();
          } else if (e.key === 'Escape') {
            const cancelButton = modal.querySelector('.comet-btn-secondary');
            if (cancelButton) cancelButton.click();
          }
        });
      }
    });
  }

  hideModal() {
    if (this.modalOverlay) {
      this.modalOverlay.style.display = 'none';
    }
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  async refreshData() {
    console.log('🔄 Refreshing data');
    await this.loadCollections();
    this.updateCurrentPageInfo();
    this.renderCollections();
  }

  showToast(message, type = 'info') {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 6px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 2147483650;
      animation: slideIn 0.3s ease;
    `;
    
    switch (type) {
      case 'success':
        toast.style.background = '#28a745';
        break;
      case 'error':
        toast.style.background = '#dc3545';
        break;
      case 'warning':
        toast.style.background = '#ffc107';
        toast.style.color = '#000';
        break;
      default:
        toast.style.background = '#007bff';
    }
    
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // =============================================
  // SIDEBAR VISIBILITY MANAGEMENT
  // =============================================

  showSidebar() {
    console.log('👁️ Showing sidebar');
    
    if (!this.sidebar) {
      this.createSidebar();
    }
    
    this.sidebar.classList.add('comet-visible');
    document.body.classList.add('comet-sidebar-active');
    
    // Refresh data when showing
    this.refreshData();
  }

  hideSidebar() {
    console.log('🙈 Hiding sidebar');
    
    if (this.sidebar) {
      this.sidebar.classList.remove('comet-visible');
    }
    
    document.body.classList.remove('comet-sidebar-active');
    
    // Hide any open menus/modals
    this.hideContextMenu();
    this.hideModal();
  }

  toggleSidebar() {
    console.log('🔄 Toggling sidebar');
    
    if (!this.sidebar || !this.sidebar.classList.contains('comet-visible')) {
      this.showSidebar();
    } else {
      this.hideSidebar();
    }
  }
}

// Create global instance
const cometSidebar = new CometCollectionsSidebar();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Content script received message:', request);
  
  if (request.action === 'toggle') {
    cometSidebar.toggleSidebar();
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open
});

console.log('✅ Comet Collections: Content script ready');