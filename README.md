# Comet Collections

A browser extension that brings the functionality of Microsoft Edge's Collections to other browsers, allowing you to organize your tabs and pages into manageable collections.

## Features

- **Create and Manage Collections:** Easily create, rename, and delete collections for your browser tabs.
- **Sidebar Interface:** Access and manage your collections through a convenient sidebar.
- **Add Pages:** Add the current page or any URL to your collections.
- **Light & Dark Themes:** Choose between light, dark, and auto themes to match your preference.
- **Keyboard Shortcut:** Toggle the sidebar with a quick keyboard command.

## Installation (Developer Mode)

1.  Clone this repository to your local machine.
2.  Open your browser and navigate to the extensions page (e.g., `chrome://extensions`).
3.  Enable "Developer mode".
4.  Click on "Load unpacked" and select the directory where you cloned the repository.

## Usage

- **Toggle Sidebar:** Use the keyboard shortcut `Command+Shift+C` (on macOS) or `Ctrl+Shift+C` (on Windows/Linux), or click the extension icon in your browser's toolbar.
- **Manage Collections:** Use the UI in the sidebar to create new collections, add pages, and manage your existing collections.

## Limitations

*   **No Cloud Sync:** All data is stored locally in your browser and is not synced across different devices.
*   **Protected Pages:** The sidebar cannot be opened on certain browser-specific pages (e.g., `chrome://` pages) or the Chrome Web Store.
*   **No Nested Collections:** The extension supports a flat list of collections; you cannot create collections inside other collections.
*   **No Automatic Page Thumbnails:** The extension does not automatically generate thumbnails for saved pages.