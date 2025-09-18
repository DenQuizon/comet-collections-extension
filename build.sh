#!/bin/bash

# Comet Collections Extension - Release Script
# This script packages the extension for distribution

set -e

# Configuration
EXTENSION_NAME="comet-collections"
VERSION=$(grep -o '"version": *"[^"]*"' manifest.json | grep -o '"[^"]*"$' | tr -d '"')
BUILD_DIR="dist"
PACKAGE_NAME="${EXTENSION_NAME}-v${VERSION}"

echo "🚀 Building Comet Collections Extension v${VERSION}"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf ${BUILD_DIR}
rm -f *.zip
rm -f *.crx

# Create build directory
mkdir -p ${BUILD_DIR}

# Copy extension files
echo "📦 Copying extension files..."
cp manifest.json ${BUILD_DIR}/
cp -r background ${BUILD_DIR}/
cp -r content ${BUILD_DIR}/
cp *.png ${BUILD_DIR}/ 2>/dev/null || true
cp *.html ${BUILD_DIR}/ 2>/dev/null || true

# Copy optional directories if they exist
[ -d "icons" ] && cp -r icons ${BUILD_DIR}/
[ -d "popup" ] && cp -r popup ${BUILD_DIR}/
[ -d "sidepanel" ] && cp -r sidepanel ${BUILD_DIR}/

# Create package
echo "📦 Creating ZIP package..."
cd ${BUILD_DIR}
zip -r "../${PACKAGE_NAME}.zip" . -x "*.DS_Store" "*.git*"
cd ..

# Cleanup
echo "🧹 Cleaning up..."
rm -rf ${BUILD_DIR}

echo "✅ Package created: ${PACKAGE_NAME}.zip"
echo "📁 Ready for Chrome Web Store or manual installation"

# Show package info
echo ""
echo "📊 Package Information:"
echo "   Name: ${EXTENSION_NAME}"
echo "   Version: ${VERSION}"
echo "   File: ${PACKAGE_NAME}.zip"
echo "   Size: $(ls -lh ${PACKAGE_NAME}.zip | awk '{print $5}')"
echo ""
echo "🔗 Installation Instructions:"
echo "   1. Open Chrome and go to chrome://extensions/"
echo "   2. Enable Developer mode"
echo "   3. Extract the ZIP file"
echo "   4. Click 'Load unpacked' and select the extracted folder"