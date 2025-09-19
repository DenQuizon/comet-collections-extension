# Comet Collections (Chrome/Chromium Extension)

Organize pages into beautiful, color‑coded collections in a slick in‑page sidebar. Create, rename, delete, and open collections entirely inside the app UI.

Badges: Manifest v3 · Chrome Extension · Version 1.0.0

## Features

- Create collections in a modal with a color picker (wheel + swatches)
- Add Current Page and Add URL dialogs
- Page previews show favicon and domain (e.g., www.example.com)
- 3‑dots menu per collection: Rename, Open all, Delete — all in‑app
- Open all: choose Same window, New window, or Incognito
- Themes: Auto / Light / Dark
- Persistent storage via chrome.storage

## Install (Developer Mode)

1. Clone: `git clone https://github.com/DenQuizon/comet-collections-extension.git`
2. Open `chrome://extensions/`
3. Enable Developer mode
4. Click Load unpacked and select this folder

## Usage

- Click the extension icon or press the shortcut to toggle the sidebar
- “+” button: Create a collection (choose a color)
- Current Page card: Add Current Page or Add URL
- Expand a collection to see page previews with favicon + domain
- 3‑dots menu on a collection:
  - Rename: in‑app modal
  - Open all: choose Same window / New window / Incognito
  - Delete: in‑app confirmation

Shortcut
- macOS: Command+Shift+K
- Windows/Linux: Ctrl+Shift+K

## Permissions (Why)

- tabs, activeTab: read current tab title/url and open pages
- scripting: inject content UI where needed
- storage: save collections and pages locally
- tabCapture: capture thumbnails (when allowed by page)

## Development

Structure
- manifest.json
- background/background.js
- content/content.js
- content/sidebar.css
- build.sh

Build and Package
- Package with script: `npm run package`
- Or use build.sh: `./build.sh`

## Troubleshooting

- Sidebar not toggling on some pages: Chrome blocks injection on chrome://, edge://, and extension pages
- Incognito option: enable “Allow in incognito” for the extension
- Open All fallback: if the background service worker doesn’t respond, Same window opens tabs directly

## Privacy

All data stays in your browser’s local storage (chrome.storage.local). No external services are called, except favicon lookups by domain.

Repo: https://github.com/DenQuizon/comet-collections-extension
