# 🚀 Comet Collections - Browser Extension

A powerful Microsoft Edge Collections clone for Chrome and other Chromium-based browsers. Organize, manage, and access your web pages with style.

![Comet Collections](https://img.shields.io/badge/version-1.0.0-blue)
![Chrome Extension](https://img.shields.io/badge/platform-Chrome%20Extension-green)
![Manifest](https://img.shields.io/badge/manifest-v3-orange)

## ✨ Features

### 🎯 Core Functionality
- **📁 Create Collections** - Organize pages into themed collections
- **➕ Add Current Page** - Quick save with thumbnail capture
- **🔍 Smart Search** - Find collections and pages instantly  
- **🎨 Color Coding** - Customize collections with beautiful colors
- **📱 Responsive Design** - Works seamlessly across all screen sizes

### 🔥 Advanced Features
- **🪟 Multi-Window Support** - Open collections in new windows or incognito
- **🎭 Theme Support** - Auto, Light, and Dark themes
- **🖱️ Drag & Drop** - Reorder collections and pages effortlessly
- **⚡ Real-time Sync** - Changes saved instantly to Chrome storage
- **🖼️ Page Thumbnails** - Visual previews of your saved pages

### 🎨 Premium UI/UX
- **✨ Glassmorphism Design** - Modern blur effects and transparency
- **🌊 Smooth Animations** - Spring physics and micro-interactions
- **🎪 Hover Effects** - Delightful visual feedback
- **📜 Custom Scrollbars** - Themed and elegant scrolling experience

## 🚀 Installation

### For Users
1. Download the latest release from [Releases](https://github.com/YOUR_USERNAME/comet-collections-extension/releases)
2. Extract the ZIP file
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked" and select the extracted folder
6. The Comet Collections icon will appear in your toolbar

### For Developers
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/comet-collections-extension.git
cd comet-collections-extension

# Load in Chrome for development
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked" and select this folder
```

## 🎮 Usage

### Getting Started
1. **Click the extension icon** in your toolbar to open the sidebar
2. **Create your first collection** using the "+" button
3. **Add the current page** with the "Add to Collection" button
4. **Organize and enjoy** your beautifully organized web pages!

### Keyboard Shortcuts
- **Cmd+Shift+K** (Mac) / **Ctrl+Shift+K** (Windows/Linux) - Toggle sidebar

### Pro Tips
- **Right-click collections** for advanced options (Rename, Delete, Open All)
- **Use the search box** to quickly find specific pages
- **Drag and drop** to reorder your collections and pages
- **Choose different themes** from the header dropdown

## 🛠️ Development

### Project Structure
```
comet-collections-extension/
├── manifest.json          # Extension configuration
├── background/
│   └── background.js      # Service worker for browser APIs
├── content/
│   ├── content.js         # Main sidebar functionality
│   └── sidebar.css        # Styles and animations
├── icons/                 # Extension icons
├── popup/                 # Extension popup (if needed)
└── sidepanel/            # Alternative UI implementation
```

### Key Technologies
- **Chrome Extension Manifest V3** - Latest extension platform
- **Vanilla JavaScript (ES6+)** - No external dependencies
- **CSS3 with Modern Features** - Glassmorphism, animations, custom properties
- **Chrome Storage API** - Persistent data storage
- **Chrome Tabs API** - Page capture and management

### Code Architecture
- **Object-Oriented Design** - `CometCollectionsSidebar` class
- **Event-Driven Pattern** - Responsive to user interactions
- **Modular CSS** - Organized by component and feature
- **Error Handling** - Graceful fallbacks and user feedback

## 🎨 Customization

### Themes
The extension supports three themes:
- **Auto** - Follows system preference
- **Light** - Clean and bright
- **Dark** - Easy on the eyes

### Color Palette
Collections can be customized with 10 beautiful colors:
- Red, Teal, Blue, Green, Yellow
- Purple, Mint, Gold, Lavender, Sky

## 📦 Building for Production

```bash
# Create a production build
npm run build

# Package for Chrome Web Store
npm run package
```

## 🐛 Known Issues & Solutions

### Common Issues
- **Extension not loading**: Ensure all files are present and manifest.json is valid
- **Thumbnails not capturing**: Check if the page allows screenshot capture
- **Storage issues**: Verify Chrome storage permissions

### Browser Compatibility
- ✅ **Chrome 88+** - Full support
- ✅ **Edge 88+** - Full support  
- ✅ **Brave** - Full support
- ⚠️ **Safari** - Not supported (different extension system)

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow the existing code style
- Test thoroughly before submitting
- Update documentation as needed
- Keep commits focused and descriptive

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Inspired by Microsoft Edge Collections
- Icons from various open source projects
- Community feedback and suggestions

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/comet-collections-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/YOUR_USERNAME/comet-collections-extension/discussions)
- **Email**: your.email@example.com

---

**Made with ❤️ by [Your Name]**

*Star ⭐ this repo if you found it helpful!*