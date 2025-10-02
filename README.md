# Notion Folders Chrome Extension

A Chrome extension that adds a customizable folder section to Notion's sidebar, allowing you to organize your pages with drag-and-drop support.

![Notion Folders](https://img.shields.io/badge/version-1.0.0-blue)
![Chrome Extension](https://img.shields.io/badge/chrome-extension-green)

## Features

- 📁 **Custom Folders**: Create unlimited folders in your Notion sidebar
- 🎯 **Drag & Drop**: Easily drag pages into folders for organization
- 🎨 **Notion-Style Design**: Seamlessly matches Notion's native UI/UX
- 💾 **Auto-Save**: Folders and pages are automatically saved using Chrome sync storage
- 🌓 **Dark Mode**: Full support for Notion's dark mode
- 📤 **Import/Export**: Backup and restore your folder structure
- ⚡ **Lightweight**: Minimal performance impact

## Installation

### Method 1: Load Unpacked (For Development)

1. **Download or clone this repository**
   ```bash
   git clone <your-repo-url>
   cd notion-folders
   ```

2. **Generate Icon Files**
   
   You need to create PNG icons from the SVG file. You can use an online converter or ImageMagick:
   
   ```bash
   # If you have ImageMagick installed
   convert -background none icons/icon.svg -resize 16x16 icons/icon16.png
   convert -background none icons/icon.svg -resize 48x48 icons/icon48.png
   convert -background none icons/icon.svg -resize 128x128 icons/icon128.png
   ```
   
   Or use an online tool like [CloudConvert](https://cloudconvert.com/svg-to-png) to convert `icons/icon.svg` to PNG files at 16x16, 48x48, and 128x128 sizes.

3. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked"
   - Select the `notion-folders` directory
   - The extension should now be installed!

4. **Visit Notion**
   - Go to [notion.so](https://notion.so)
   - You should see a new "Folders" section in your sidebar
   - Click the + button to create your first folder

### Method 2: Chrome Web Store (Coming Soon)

This extension will be available on the Chrome Web Store soon.

## Usage

### Creating Folders

1. Look for the **Folders** section in your Notion sidebar (below Private/Shared sections)
2. Click the **+** button next to "Folders"
3. A new folder will be created - click to rename it
4. Press Enter or click away to save the name

### Adding Pages to Folders

1. Find any page in your Notion sidebar
2. Click and drag the page
3. Drop it into any folder
4. The page will now appear in that folder

### Removing Pages from Folders

1. Hover over a page in a folder
2. Click the **×** button that appears
3. The page will be removed from the folder (but not deleted from Notion)

### Deleting Folders

1. Hover over a folder name
2. Click the trash icon that appears
3. Confirm the deletion
4. All pages will be removed from the folder (but not deleted from Notion)

### Expanding/Collapsing

- Click on any folder or the Folders section header to expand/collapse
- Chevron icons indicate the current state

## Features Explained

### Drag and Drop

The extension intercepts Notion's native drag events to detect when you're dragging a page. You can drag any page from:
- Private section
- Shared section
- Workspace pages
- Nested pages

### Data Persistence

All folders and their contents are stored using Chrome's sync storage, which means:
- Your folders sync across all your Chrome browsers (where you're signed in)
- Data persists even if you close the browser
- Maximum storage: ~100KB (plenty for thousands of pages)

### Import/Export

Use the extension popup to:
- **Export**: Download your folder structure as JSON
- **Import**: Restore folders from a previously exported JSON file

To access the popup, click the extension icon in Chrome's toolbar.

## Design Philosophy

This extension is designed to **perfectly match Notion's UI**:

- Uses Notion's exact color scheme (light & dark mode)
- Matches Notion's typography and spacing
- Replicates Notion's hover states and transitions
- Follows Notion's icon style and sizing
- Maintains Notion's interaction patterns

## Troubleshooting

### Folders section not appearing

1. Refresh the Notion page
2. Check that the extension is enabled in `chrome://extensions/`
3. Make sure you're on a Notion page (notion.so)
4. Try disabling and re-enabling the extension

### Drag and drop not working

1. Make sure the page you're dragging is a valid Notion page
2. Try refreshing the page
3. Check the browser console for any errors (F12)

### Folders disappeared

1. Check if Chrome sync is enabled
2. Try importing a backup if you have one
3. Your folders might still be in storage - try clicking the extension icon to see stats

### Dark mode styling issues

The extension automatically detects Notion's theme. If you're experiencing styling issues:
1. Try toggling Notion's dark mode off and on
2. Refresh the page
3. Clear your browser cache

## Development

### Project Structure

```
notion-folders/
├── manifest.json       # Chrome extension configuration
├── content.js          # Main extension logic
├── styles.css          # Notion-matching styles
├── background.js       # Service worker
├── popup.html          # Extension popup UI
├── popup.js            # Popup functionality
├── icons/              # Extension icons
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # This file
```

### Key Components

- **NotionFolders Class**: Main class that manages folder creation, rendering, and drag-drop
- **Sidebar Observer**: Monitors Notion's sidebar for changes
- **Storage Manager**: Handles Chrome sync storage operations
- **Drag Handler**: Intercepts and processes drag events

### Building from Source

1. Clone the repository
2. Make your changes
3. Test by loading unpacked in Chrome
4. Build icons (see Installation section)
5. Submit a pull request!

## Privacy & Security

- **No Data Collection**: This extension does not collect or transmit any data
- **Local Storage Only**: All data is stored locally in Chrome's sync storage
- **No External Requests**: The extension doesn't make any network requests
- **Open Source**: All code is available for review

## Permissions Explained

- **storage**: Required to save folders and pages
- **https://www.notion.so/***: Required to run the extension on Notion pages only

## Compatibility

- **Chrome**: Version 88 and above
- **Notion**: Web version (notion.so)
- **Operating Systems**: Windows, macOS, Linux, Chrome OS

## Known Limitations

- Only works on the web version of Notion (not desktop app)
- Pages are references only (moving in Notion won't update folders)
- Maximum ~1000 pages across all folders (Chrome storage limit)
- Some Notion page types may not be draggable

## Future Features

- [ ] Nested folders (folders within folders)
- [ ] Folder icons and colors
- [ ] Right-click context menus
- [ ] Keyboard shortcuts
- [ ] Search within folders
- [ ] Folder templates
- [ ] Integration with Notion's native features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:
1. Check the Troubleshooting section above
2. Open an issue on GitHub
3. Check existing issues for solutions

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Folder creation and management
- Drag and drop support
- Import/export functionality
- Dark mode support
- Chrome sync storage

## Acknowledgments

- Inspired by Notion's beautiful design system
- Built for the Notion community
- Thanks to all contributors

---

**Note**: This is an unofficial extension and is not affiliated with Notion Labs, Inc.

