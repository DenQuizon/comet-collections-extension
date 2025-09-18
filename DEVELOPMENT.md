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
├── 🗂️ icons/
│   ├── 📄 icon16.svg         # Toolbar icon (16x16)
│   ├── 📄 icon48.svg         # Extension page icon (48x48)
│   ├── 📄 icon128.svg        # Chrome Web Store icon (128x128)
│   └── 📄 icon.svg           # Base icon
├── 🗂️ popup/                 # Extension popup (optional)
│   ├── 📄 popup.html
│   └── 📄 popup.js
└── 🗂️ sidepanel/             # Alternative UI implementation
    ├── 📄 sidepanel.html
    ├── 📄 sidepanel.js
    └── 📄 sidepanel.css
```

## 🏗️ Architecture Overview

### Core Components

#### 1. **Background Script** (`background/background.js`)
- **Role**: Service Worker for browser-level operations
- **Responsibilities**:
  - Handle extension icon clicks
  - Process keyboard shortcuts (Cmd+Shift+K)
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
git clone [your-repo-url]
cd comet-collections-extension

# Install dependencies (if any added later)
npm install

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

# Or use npm scripts
npm run package
```

## 🎨 Code Style Guidelines

### JavaScript
- **ES6+ features**: Use modern JavaScript
- **Class-based**: Main functionality in `CometCollectionsSidebar` class
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
class CometCollectionsSidebar {
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
npm run version-patch

# Minor version (1.0.1 → 1.1.0)
npm run version-minor

# Major version (1.1.0 → 2.0.0)
npm run version-major
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

## 🔮 Future Enhancements

### Planned Features
- [ ] **Cloud sync** across devices
- [ ] **Import/Export** collections
- [ ] **Keyboard shortcuts** for power users
- [ ] **Bulk operations** for multiple items
- [ ] **Advanced search** with filters
- [ ] **Collection sharing** via URLs

### Technical Debt
- [ ] **Add unit tests** for core functionality
- [ ] **Implement TypeScript** for better type safety
- [ ] **Add build optimization** for smaller bundle size
- [ ] **Improve accessibility** (ARIA labels, keyboard nav)

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