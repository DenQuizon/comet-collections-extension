# 🛠️ Development Guide - Comet Collections Extension

## 📁 Project Structure

```
comet-collections-extension/
├── 📄 manifest.json           # Extension configuration & permissions
├── 📄 README.md              # Project documentation
├── 📄 package.json           # NPM configuration & scripts
├── 📄 .gitignore             # Git ignore rules
├── 📄 build.sh               # Build script for packaging
├── 🗂️ background/
│   └── 📄 background.js      # Service worker (background tasks)
├── 🗂️ content/
│   ├── 📄 content.js         # Main sidebar functionality
│   └── 📄 sidebar.css        # All styles and animations
└── 🗂️ docs/
    ├── 📄 DEVELOPMENT.md     # This file
    ├── 📄 MONETIZATION.md    # Monetization strategy
    └── 📄 STORE_ASSETS.md    # Chrome Web Store assets
```

## 🏗️ Architecture Overview

### Core Components

#### 1. **Background Script** (`background/background.js`)
- **Role**: Service Worker for browser-level operations
- **Responsibilities**:
  - Handle extension icon clicks
  - Process keyboard shortcuts (Cmd+Shift+C)
  - Manage tab operations (create, capture thumbnails)
  - Handle "Open All Pages" functionality
  - Storage initialization

#### 2. **Content Script** (`content/content.js`)
- **Role**: Main application logic injected into web pages
- **Responsibilities**:
  - Render and manage the sidebar UI
  - Handle user interactions (create, rename, delete)
  - Manage collections and pages data
  - Theme management and animations
  - Search and filtering functionality
  - Manual URL input feature

#### 3. **Styles** (`content/sidebar.css`)
- **Role**: All visual styling and animations
- **Features**:
  - Glassmorphism design system
  - Responsive layout
  - Theme support (auto/light/dark)
  - Smooth animations and micro-interactions
  - Custom scrollbars

## 🔧 Development Setup

### Prerequisites
- **Node.js 14+** (for build scripts)
- **Chrome/Chromium 88+** (for testing)
- **Git** (for version control)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/DenQuizon/comet-collections-extension.git
cd comet-collections-extension

# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked" and select this folder
```

### Development Workflow
```bash
# Make your changes to the code

# Test the extension
# Reload the extension in chrome://extensions/

# Build for production
./build.sh

# Sync changes to GitHub
git add .
git commit -m "✨ Your change description"
git push
```

## 🎨 Code Style Guidelines

### JavaScript
- **ES6+ features**: Use modern JavaScript
- **Class-based**: Main functionality in `CometContentSidebar` class
- **Async/Await**: For all asynchronous operations
- **Error Handling**: Try-catch blocks for all async operations
- **Naming**: camelCase for variables, PascalCase for classes

### CSS
- **Component-based**: Group related styles together
- **CSS Custom Properties**: For theme values
- **BEM-like naming**: `.comet-component-element--modifier`
- **Mobile-first**: Responsive design with min-width queries
- **Performance**: Use `transform` and `opacity` for animations

### File Organization
```javascript
// Example content.js structure
class CometContentSidebar {
  constructor() { /* ... */ }
  
  // ===== INITIALIZATION =====
  init() { /* ... */ }
  loadCollections() { /* ... */ }
  
  // ===== UI MANAGEMENT =====
  createSidebar() { /* ... */ }
  renderCollections() { /* ... */ }
  
  // ===== CRUD OPERATIONS =====
  createNewCollection() { /* ... */ }
  deleteCollection() { /* ... */ }
  
  // ===== UTILITY FUNCTIONS =====
  showToast() { /* ... */ }
  hideModal() { /* ... */ }
}
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] **Extension loads** without errors
- [ ] **Create collection** works with all colors
- [ ] **Add current page** captures thumbnail
- [ ] **Add manual URL** works with clipboard detection
- [ ] **Search functionality** filters correctly
- [ ] **Theme switching** works properly
- [ ] **Drag & drop** reorders items
- [ ] **Context menus** show correct options
- [ ] **Open all pages** works in all modes
- [ ] **Responsive design** works on different screen sizes

### Browser Testing
- [ ] **Chrome** (primary target)
- [ ] **Edge** (Chromium-based)
- [ ] **Brave** (Chromium-based)

## 🐛 Debugging

### Common Issues
1. **Extension not loading**
   - Check `manifest.json` syntax
   - Verify all file paths exist
   - Look for JavaScript errors in DevTools

2. **Content script not injecting**
   - Check site permissions
   - Verify content_scripts in manifest
   - Check for CSP restrictions

3. **Storage issues**
   - Verify storage permissions
   - Check chrome.storage usage
   - Look for quota exceeded errors

### Debug Tools
```javascript
// Enable debug mode
localStorage.setItem('comet-debug', 'true');

// Console shortcuts
window.cometDebug = cometSidebar;
cometDebug.collections; // View current data
cometDebug.renderCollections(); // Force re-render
```

## 🚀 Build & Release Process

### Version Management
```bash
# Patch version (1.0.0 → 1.0.1)
npm version patch

# Minor version (1.0.1 → 1.1.0)  
npm version minor

# Major version (1.1.0 → 2.0.0)
npm version major
```

### Building for Production
```bash
# Create optimized package
./build.sh

# This creates: comet-collections-v[version].zip
```

### Chrome Web Store Preparation
1. **Update manifest.json** version
2. **Run build script** to create package
3. **Test thoroughly** on clean Chrome profile
4. **Create store assets** (screenshots, descriptions)
5. **Upload to Chrome Web Store**

## 📊 Performance Guidelines

### Loading Performance
- **Lazy load**: Non-critical functionality
- **Minimize DOM**: Efficient rendering
- **Cache data**: Avoid redundant API calls

### Memory Management
- **Event cleanup**: Remove listeners when not needed
- **Image optimization**: Compress thumbnails
- **Storage limits**: Monitor chrome.storage usage

### Animation Performance
- **Use transform/opacity**: For smooth 60fps animations
- **Avoid layout thrashing**: Minimize reflows/repaints
- **GPU acceleration**: `will-change` property when needed

## 🔮 Current Features

### ✨ **Implemented Features**
- [x] **Smart Collections**: Create, rename, delete collections
- [x] **Current Page Adding**: Add current page to collections
- [x] **Manual URL Input**: Add URLs manually with clipboard detection
- [x] **Drag & Drop**: Reorder collections and pages
- [x] **Search & Filter**: Find collections and pages quickly
- [x] **Theme Support**: Auto, Light, and Dark modes
- [x] **Glassmorphism UI**: Beautiful modern interface
- [x] **Support Integration**: Buy me a coffee button
- [x] **Keyboard Shortcuts**: Cmd+Shift+C to toggle
- [x] **Context Menus**: Right-click actions

### 🔮 **Future Enhancements**
- [ ] **Cloud sync** across devices
- [ ] **Import/Export** collections
- [ ] **Advanced search** with filters
- [ ] **Collection sharing** via URLs
- [ ] **Bulk operations** for multiple items
- [ ] **Browser sync** integration

## 📞 Support & Contributing

### Getting Help
1. **Check the README** for common solutions
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed info
4. **Join discussions** for feature requests

### Contributing
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/awesome-feature`
3. **Follow code style** guidelines
4. **Test thoroughly** before submitting
5. **Submit pull request** with clear description

---

**Happy coding! 🚀**
