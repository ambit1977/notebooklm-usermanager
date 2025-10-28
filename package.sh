#!/bin/bash

# NotebookLM User Manager - Package Script

echo "NotebookLM User Manager - Creating package..."

# パッケージディレクトリを作成
PACKAGE_DIR="notebooklm-usermanager-package"
rm -rf "$PACKAGE_DIR"
mkdir "$PACKAGE_DIR"

# 必要なファイルをコピー
cp manifest.json "$PACKAGE_DIR/"
cp popup.html "$PACKAGE_DIR/"
cp popup.js "$PACKAGE_DIR/"
cp content.js "$PACKAGE_DIR/"
cp background.js "$PACKAGE_DIR/"
cp README.md "$PACKAGE_DIR/"

# アイコンディレクトリを作成（プレースホルダー）
mkdir "$PACKAGE_DIR/icons"

# プレースホルダーアイコンファイルを作成
echo "<!-- Placeholder for 16x16 icon -->" > "$PACKAGE_DIR/icons/icon16.png"
echo "<!-- Placeholder for 48x48 icon -->" > "$PACKAGE_DIR/icons/icon48.png"
echo "<!-- Placeholder for 128x128 icon -->" > "$PACKAGE_DIR/icons/icon128.png"

# ZIPファイルを作成
zip -r "notebooklm-usermanager.zip" "$PACKAGE_DIR"

echo "Package created: notebooklm-usermanager.zip"
echo "Package directory: $PACKAGE_DIR"
echo ""
echo "To install:"
echo "1. Extract the ZIP file"
echo "2. Open chrome://extensions/"
echo "3. Enable 'Developer mode'"
echo "4. Click 'Load unpacked' and select the extracted folder"
