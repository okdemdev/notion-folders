// Notion Folders - Content Script
// Adds a folder section to Notion's sidebar

class NotionFolders {
    constructor() {
        this.folders = {};
        this.sidebarObserver = null;
        this.init();
    }

    async init() {
        await this.loadFolders();
        this.waitForSidebar();
    }

    async loadFolders() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['notionFolders'], (result) => {
                this.folders = result.notionFolders || {};
                console.log('📥 Loaded folders from storage:', Object.keys(this.folders).length, 'folders');
                resolve();
            });
        });
    }

    async saveFolders() {
        return new Promise((resolve) => {
            console.log('💾 Saving folders to storage:', Object.keys(this.folders).length, 'folders');
            chrome.storage.sync.set({ notionFolders: this.folders }, () => {
                console.log('✅ Folders saved successfully');
                resolve();
            });
        });
    }

    waitForSidebar() {
        const checkSidebar = setInterval(() => {
            // Look for Notion's sidebar container
            const sidebar = document.querySelector('[data-sidebar-root="true"]') ||
                document.querySelector('.notion-sidebar') ||
                document.querySelector('[class*="sidebar"]');

            if (sidebar) {
                clearInterval(checkSidebar);
                this.injectFolderSection(sidebar);
                this.observeSidebarChanges(sidebar);
            }
        }, 500);

        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkSidebar), 30000);
    }

    observeSidebarChanges(sidebar) {
        // Observe sidebar for changes to re-inject if needed
        this.sidebarObserver = new MutationObserver((mutations) => {
            const folderSection = document.getElementById('notion-folders-section');
            if (!folderSection) {
                console.log('🔄 Folders section removed, re-injecting...');
                this.injectFolderSection(sidebar);
            }
        });

        this.sidebarObserver.observe(sidebar, {
            childList: true,
            subtree: true
        });

        // Also observe for URL changes (Notion uses SPA navigation)
        this.observeUrlChanges();
    }

    observeUrlChanges() {
        let lastUrl = window.location.href;

        // Check for URL changes every 500ms
        setInterval(() => {
            const currentUrl = window.location.href;
            if (currentUrl !== lastUrl) {
                console.log('🔄 Page navigation detected, reloading folders...');
                lastUrl = currentUrl;

                // Reload folders from storage in case they changed
                this.loadFolders().then(() => {
                    // Re-render to show updated data
                    this.renderFolders();
                });
            }
        }, 500);
    }

    injectFolderSection(sidebar) {
        // Check if already injected
        if (document.getElementById('notion-folders-section')) {
            console.log('ℹ️ Folders section already exists, re-rendering...');
            this.renderFolders();
            return;
        }

        console.log('📌 Injecting folders section into sidebar');

        // Find the "Shared" section to insert our Folders section BEFORE it
        // This will place Folders at the top, above both Shared and Private
        let insertBefore = null;

        // Look for elements that might be the Shared section
        const allElements = Array.from(sidebar.querySelectorAll('*'));

        for (let element of allElements) {
            const text = element.textContent?.trim().toLowerCase();
            // Look for "Shared" header specifically
            if (text === 'shared' && element.tagName === 'DIV') {
                // This is the Shared header
                insertBefore = element.closest('[class*="section"]') || element.parentElement;
                console.log('✅ Found Shared section, will insert before it');
                break;
            }
        }

        // If we can't find Shared, look for Private
        if (!insertBefore) {
            for (let element of allElements) {
                const text = element.textContent?.trim().toLowerCase();
                if (text === 'private' && element.tagName === 'DIV') {
                    insertBefore = element.closest('[class*="section"]') || element.parentElement;
                    console.log('✅ Found Private section, will insert before it');
                    break;
                }
            }
        }

        // Create folder section
        const folderSection = this.createFolderSection();

        if (insertBefore) {
            insertBefore.parentNode.insertBefore(folderSection, insertBefore);
        } else {
            // Fallback: prepend to sidebar
            const scroller = sidebar.querySelector('[class*="scroller"]') || sidebar;
            scroller.insertBefore(folderSection, scroller.firstChild);
        }

        // Render folders AFTER the section is in the DOM
        setTimeout(() => {
            console.log('🎨 Initial render of folders');
            this.renderFolders();
        }, 100);

        this.setupDragAndDrop();
    }

    createFolderSection() {
        const section = document.createElement('div');
        section.id = 'notion-folders-section';
        section.className = 'notion-folders-container';

        const header = document.createElement('div');
        header.className = 'notion-folders-header';

        const headerContent = document.createElement('div');
        headerContent.className = 'notion-folders-header-content';

        const title = document.createElement('div');
        title.className = 'notion-folders-title';
        title.textContent = 'Folders';

        const addButton = document.createElement('div');
        addButton.className = 'notion-folders-add-btn';
        addButton.innerHTML = `
      <svg viewBox="0 0 16 16" style="width: 14px; height: 14px; display: block; fill: rgba(55, 53, 47, 0.45);">
        <path d="M7.977 14.963c.407 0 .747-.324.747-.723V8.72h5.362c.399 0 .74-.34.74-.747a.746.746 0 00-.74-.738H8.724V1.706c0-.398-.34-.722-.747-.722a.732.732 0 00-.739.722v5.529h-5.37a.746.746 0 00-.74.738c0 .407.341.747.74.747h5.37v5.52c0 .399.332.723.739.723z"></path>
      </svg>
    `;
        addButton.title = 'Add folder';
        addButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.createNewFolder();
        });

        headerContent.appendChild(title);
        header.appendChild(headerContent);
        header.appendChild(addButton);

        const folderList = document.createElement('div');
        folderList.className = 'notion-folders-list';
        folderList.id = 'notion-folders-list';

        section.appendChild(header);
        section.appendChild(folderList);

        // No collapse/expand functionality - always visible like Shared/Private

        // DON'T render here - will be done after section is added to DOM

        return section;
    }

    renderFolders() {
        const folderList = document.getElementById('notion-folders-list');
        if (!folderList) {
            console.warn('⚠️ Folder list element not found, cannot render');
            return;
        }

        folderList.innerHTML = '';

        const folderKeys = Object.keys(this.folders);
        console.log('📂 Rendering', folderKeys.length, 'folders');

        folderKeys.forEach(folderId => {
            const folder = this.folders[folderId];
            const folderElement = this.createFolderElement(folderId, folder);
            folderList.appendChild(folderElement);
        });
    }

    createFolderElement(folderId, folder) {
        const folderDiv = document.createElement('div');
        folderDiv.className = 'notion-folder-item';
        folderDiv.dataset.folderId = folderId;

        const folderHeader = document.createElement('div');
        folderHeader.className = 'notion-folder-header';

        const icon = document.createElement('div');
        icon.className = 'notion-folder-icon';
        icon.innerHTML = `
      <svg viewBox="0 0 14 14" style="width: 20px; height: 20px; display: block; fill: rgba(55, 53, 47, 0.65);">
        <path d="M6.762 0c.213 0 .397.102.52.265l.813 1.123h4.609C13.423 1.388 14 1.952 14 2.647v9.059c0 .695-.577 1.294-1.296 1.294H1.296C.578 13 0 12.401 0 11.706V1.294C0 .599.578 0 1.296 0zm0 0"/>
      </svg>
    `;

        const nameInput = document.createElement('input');
        nameInput.className = 'notion-folder-name';
        nameInput.type = 'text';
        nameInput.value = folder.name || 'Untitled';
        nameInput.addEventListener('blur', () => {
            folder.name = nameInput.value;
            this.saveFolders();
        });
        nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                nameInput.blur();
            }
        });

        const actions = document.createElement('div');
        actions.className = 'notion-folder-actions';

        const deleteBtn = document.createElement('div');
        deleteBtn.className = 'notion-folder-delete';
        deleteBtn.innerHTML = `
      <svg viewBox="0 0 16 16" style="width: 14px; height: 14px; display: block; fill: rgba(55, 53, 47, 0.45);">
        <path d="M11.8711 4.12891C12.1133 4.37109 12.1133 4.75781 11.8711 5L10 6.87109L11.8711 8.74219C12.1133 8.98438 12.1133 9.37109 11.8711 9.61328C11.6289 9.85547 11.2422 9.85547 11 9.61328L9.12891 7.74219L7.25781 9.61328C7.01562 9.85547 6.62891 9.85547 6.38672 9.61328C6.14453 9.37109 6.14453 8.98438 6.38672 8.74219L8.25781 6.87109L6.38672 5C6.14453 4.75781 6.14453 4.37109 6.38672 4.12891C6.62891 3.88672 7.01562 3.88672 7.25781 4.12891L9.12891 6L11 4.12891C11.2422 3.88672 11.6289 3.88672 11.8711 4.12891Z"/>
      </svg>
    `;
        deleteBtn.title = 'Delete folder';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Delete folder "${folder.name}"?`)) {
                delete this.folders[folderId];
                this.saveFolders();
                this.renderFolders();
            }
        });

        actions.appendChild(deleteBtn);

        folderHeader.appendChild(icon);
        folderHeader.appendChild(nameInput);
        folderHeader.appendChild(actions);

        const pagesList = document.createElement('div');
        pagesList.className = 'notion-folder-pages';
        pagesList.dataset.folderId = folderId;

        // Render pages in folder - always visible, no collapse
        if (folder.pages && folder.pages.length > 0) {
            folder.pages.forEach(page => {
                const pageElement = this.createPageElement(page);
                pagesList.appendChild(pageElement);
            });
        }

        folderDiv.appendChild(folderHeader);
        folderDiv.appendChild(pagesList);

        return folderDiv;
    }

    createPageElement(page) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'notion-folder-page';
        pageDiv.dataset.pageId = page.id;
        pageDiv.dataset.pageUrl = page.url;

        const icon = document.createElement('div');
        icon.className = 'notion-page-icon';
        icon.innerHTML = page.icon || `
      <svg viewBox="0 0 14 14" style="width: 20px; height: 20px; display: block; fill: rgba(55, 53, 47, 0.45);">
        <path d="M3.5 0C2.67188 0 2 0.671875 2 1.5V12.5C2 13.3281 2.67188 14 3.5 14H10.5C11.3281 14 12 13.3281 12 12.5V4.5L8.5 0H3.5ZM3.5 1H8V4.5C8 4.77344 8.22656 5 8.5 5H11V12.5C11 12.7734 10.7734 13 10.5 13H3.5C3.22656 13 3 12.7734 3 12.5V1.5C3 1.22656 3.22656 1 3.5 1Z"/>
      </svg>
    `;

        const name = document.createElement('div');
        name.className = 'notion-page-name';
        name.textContent = page.name;

        const removeBtn = document.createElement('div');
        removeBtn.className = 'notion-page-remove';
        removeBtn.innerHTML = `
      <svg viewBox="0 0 16 16" style="width: 12px; height: 12px; display: block; fill: rgba(55, 53, 47, 0.35);">
        <path d="M11.8711 4.12891C12.1133 4.37109 12.1133 4.75781 11.8711 5L10 6.87109L11.8711 8.74219C12.1133 8.98438 12.1133 9.37109 11.8711 9.61328C11.6289 9.85547 11.2422 9.85547 11 9.61328L9.12891 7.74219L7.25781 9.61328C7.01562 9.85547 6.62891 9.85547 6.38672 9.61328C6.14453 9.37109 6.14453 8.98438 6.38672 8.74219L8.25781 6.87109L6.38672 5C6.14453 4.75781 6.14453 4.37109 6.38672 4.12891C6.62891 3.88672 7.01562 3.88672 7.25781 4.12891L9.12891 6L11 4.12891C11.2422 3.88672 11.6289 3.88672 11.8711 4.12891Z"/>
      </svg>
    `;
        removeBtn.title = 'Remove from folder';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removePageFromFolder(page.id);
        });

        pageDiv.appendChild(icon);
        pageDiv.appendChild(name);
        pageDiv.appendChild(removeBtn);

        // Make page clickable
        pageDiv.addEventListener('click', () => {
            if (page.url) {
                window.location.href = page.url;
            }
        });

        return pageDiv;
    }

    createNewFolder() {
        const folderId = 'folder_' + Date.now();
        this.folders[folderId] = {
            name: 'New Folder',
            pages: [],
            createdAt: Date.now()
        };

        console.log('➕ Creating new folder:', folderId);

        this.saveFolders().then(() => {
            this.renderFolders();

            // Focus on the new folder's name input
            setTimeout(() => {
                const newFolderInput = document.querySelector(`[data-folder-id="${folderId}"] .notion-folder-name`);
                if (newFolderInput) {
                    newFolderInput.select();
                }
            }, 100);
        });
    }

    removePageFromFolder(pageId) {
        console.log('➖ Removing page from folders:', pageId);
        Object.keys(this.folders).forEach(folderId => {
            const folder = this.folders[folderId];
            const beforeCount = folder.pages.length;
            folder.pages = folder.pages.filter(page => page.id !== pageId);
            if (folder.pages.length < beforeCount) {
                console.log('   Removed from:', folder.name);
            }
        });

        this.saveFolders().then(() => {
            this.renderFolders();
        });
    }

    setupDragAndDrop() {
        // Instead of complex drag-drop, use a context menu approach
        this.setupContextMenu();
    }

    setupContextMenu() {
        let currentPageElement = null;

        // Observe for Notion's context menus appearing
        const menuObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Look for Notion's menu/dropdown
                        if (
                            node.getAttribute?.('role') === 'dialog' ||
                            node.getAttribute?.('role') === 'menu' ||
                            node.className?.includes?.('notion-overlay') ||
                            node.className?.includes?.('notion-menu') ||
                            node.querySelector?.('[role="menu"]') ||
                            node.querySelector?.('[role="dialog"]')
                        ) {
                            console.log('🔍 Potential Notion menu detected:', node.className);

                            // Wait a bit for Notion to fully render the menu
                            setTimeout(() => {
                                this.injectIntoNotionMenu(node);
                            }, 100);
                        }
                    }
                });
            });
        });

        menuObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also listen for right-clicks to track which page was clicked
        document.addEventListener('contextmenu', (e) => {
            let target = e.target;
            let pageElement = null;

            for (let i = 0; i < 15 && target; i++) {
                const classes = target.className || '';
                const classStr = typeof classes === 'string' ? classes : '';

                if (
                    classStr.includes('notion-selectable') ||
                    classStr.includes('notion-collection_view_page-block') ||
                    classStr.includes('notion-page-block') ||
                    target.getAttribute('role') === 'link'
                ) {
                    pageElement = target;
                    currentPageElement = pageElement;
                    console.log('📌 Saved page element for context menu');
                    break;
                }
                target = target.parentElement;
            }
        }, true);

        // Store reference for use in menu injection
        this.currentPageElement = () => currentPageElement;
    }

    injectIntoNotionMenu(menuContainer) {
        // Check if we already injected
        if (menuContainer.querySelector('.notion-folders-menu-item')) {
            return;
        }

        // Find the actual menu list
        const menuList = menuContainer.querySelector('[role="menu"]') ||
            menuContainer.querySelector('div[class*="menu"]') ||
            menuContainer;

        if (!menuList) {
            console.log('⚠️ Could not find menu list');
            return;
        }

        console.log('✅ Found Notion menu, injecting folder option');

        // Create separator
        const separator = document.createElement('div');
        separator.className = 'notion-folders-menu-separator';
        separator.style.cssText = `
      height: 1px;
      background: rgba(55, 53, 47, 0.09);
      margin: 4px 0;
    `;

        // Create our menu item
        const menuItem = document.createElement('div');
        menuItem.className = 'notion-folders-menu-item';
        menuItem.setAttribute('role', 'button');
        menuItem.style.cssText = `
      display: flex;
      align-items: center;
      padding: 6px 10px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 14px;
      color: rgb(55, 53, 47);
      transition: background-color 20ms ease-in 0s;
      user-select: none;
    `;

        menuItem.innerHTML = `
      <svg viewBox="0 0 14 14" style="width: 16px; height: 16px; margin-right: 8px; fill: rgba(55, 53, 47, 0.45); flex-shrink: 0;">
        <path d="M6.762 0c.213 0 .397.102.52.265l.813 1.123h4.609C13.423 1.388 14 1.952 14 2.647v9.059c0 .695-.577 1.294-1.296 1.294H1.296C.578 13 0 12.401 0 11.706V1.294C0 .599.578 0 1.296 0zm0 0"/>
      </svg>
      <span>Move to Folder</span>
      <svg viewBox="0 0 16 16" style="width: 14px; height: 14px; margin-left: auto; fill: rgba(55, 53, 47, 0.35); flex-shrink: 0;">
        <path d="M5.75781 3.25781C5.91406 3.10156 6.17188 3.10156 6.32812 3.25781L10.3281 7.25781C10.4844 7.41406 10.4844 7.67188 10.3281 7.82812L6.32812 11.8281C6.17188 11.9844 5.91406 11.9844 5.75781 11.8281C5.60156 11.6719 5.60156 11.4141 5.75781 11.2578L9.44531 7.54688L5.75781 3.83594C5.60156 3.67969 5.60156 3.42188 5.75781 3.25781Z"/>
      </svg>
    `;

        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.background = 'rgba(55, 53, 47, 0.08)';
        });

        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.background = 'transparent';
        });

        menuItem.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showFolderSubmenu(menuItem);
        });

        // Append to menu
        menuList.appendChild(separator);
        menuList.appendChild(menuItem);
    }

    showFolderSubmenu(menuItem) {
        // Remove any existing submenu
        const existingSubmenu = document.querySelector('.notion-folders-submenu');
        if (existingSubmenu) {
            existingSubmenu.remove();
        }

        // Create submenu
        const submenu = document.createElement('div');
        submenu.className = 'notion-folders-submenu';

        const rect = menuItem.getBoundingClientRect();
        submenu.style.cssText = `
      position: fixed;
      left: ${rect.right + 4}px;
      top: ${rect.top}px;
      background: white;
      border-radius: 6px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.176), 0 0 0 1px rgba(0, 0, 0, 0.05);
      min-width: 200px;
      max-width: 300px;
      padding: 6px;
      z-index: 10001;
      animation: contextMenuFadeIn 150ms ease-out;
    `;

        const folders = Object.keys(this.folders);
        if (folders.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.style.cssText = `
        padding: 12px 10px;
        font-size: 13px;
        color: rgba(55, 53, 47, 0.4);
        font-style: italic;
        text-align: center;
      `;
            emptyState.textContent = 'No folders yet';
            submenu.appendChild(emptyState);
        } else {
            folders.forEach(folderId => {
                const folder = this.folders[folderId];
                const folderItem = document.createElement('div');
                folderItem.style.cssText = `
          display: flex;
          align-items: center;
          padding: 6px 10px;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
          color: rgb(55, 53, 47);
          transition: background-color 20ms ease-in 0s;
        `;
                folderItem.innerHTML = `
          <svg viewBox="0 0 14 14" style="width: 16px; height: 16px; margin-right: 8px; fill: rgba(55, 53, 47, 0.45);">
            <path d="M6.762 0c.213 0 .397.102.52.265l.813 1.123h4.609C13.423 1.388 14 1.952 14 2.647v9.059c0 .695-.577 1.294-1.296 1.294H1.296C.578 13 0 12.401 0 11.706V1.294C0 .599.578 0 1.296 0zm0 0"/>
          </svg>
          ${folder.name}
        `;

                folderItem.addEventListener('mouseenter', () => {
                    folderItem.style.background = 'rgba(55, 53, 47, 0.08)';
                });

                folderItem.addEventListener('mouseleave', () => {
                    folderItem.style.background = 'transparent';
                });

                folderItem.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const pageElement = this.currentPageElement();
                    if (pageElement) {
                        this.addPageToFolderFromContext(folderId, pageElement);
                    }
                    submenu.remove();
                    // Close Notion's menu
                    document.querySelector('[role="dialog"]')?.remove();
                });

                submenu.appendChild(folderItem);
            });
        }

        document.body.appendChild(submenu);

        // Close on click outside
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!submenu.contains(e.target) && !menuItem.contains(e.target)) {
                    submenu.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 10);
    }


    addPageToFolderFromContext(folderId, pageElement) {
        const pageData = {
            id: this.generatePageId(pageElement),
            name: this.extractPageName(pageElement),
            url: pageElement.href || this.extractPageUrl(pageElement) || window.location.href,
            icon: this.extractPageIcon(pageElement)
        };

        console.log('📁 Adding page to folder via context menu:', pageData.name, '→', this.folders[folderId].name);

        this.addPageToFolder(folderId, pageData);

        // Show toast notification
        this.showToast(`Added "${pageData.name}" to "${this.folders[folderId].name}"`);
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'notion-folders-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    setupNotionPageDragIntercept() {
        // Use capture phase to intercept Notion's drag events BEFORE they process them
        let draggedPageData = null;
        let isDraggingToFolder = false;

        // Intercept ALL dragstart events at the document level (capture phase + immediate propagation stop)
        document.addEventListener('dragstart', (e) => {
            // Find if we're dragging a Notion item
            let target = e.target;
            let pageElement = null;

            // Walk up the DOM to find a draggable Notion element
            for (let i = 0; i < 15 && target; i++) {
                // Check for various Notion element types
                const classes = target.className || '';
                const classStr = typeof classes === 'string' ? classes : '';

                if (
                    // Database/collection items (like your tasks)
                    classStr.includes('notion-selectable') ||
                    classStr.includes('notion-collection_view_page-block') ||
                    classStr.includes('notion-page-block') ||
                    // Sidebar page links
                    target.tagName === 'A' ||
                    target.getAttribute('role') === 'link' ||
                    classStr.includes('notion-sidebar') ||
                    // Any draggable element
                    target.hasAttribute('draggable')
                ) {
                    pageElement = target;
                    console.log('🔍 Found draggable element:', {
                        tag: target.tagName,
                        classes: classStr.substring(0, 100),
                        draggable: target.hasAttribute('draggable')
                    });
                    break;
                }
                target = target.parentElement;
            }

            if (pageElement) {
                draggedPageData = {
                    id: this.generatePageId(pageElement),
                    name: this.extractPageName(pageElement),
                    url: pageElement.href || this.extractPageUrl(pageElement) || window.location.href,
                    icon: this.extractPageIcon(pageElement),
                    element: pageElement
                };

                console.log('🎯 Notion Folders: Detected drag of:', draggedPageData.name, draggedPageData);

                // Also set it in dataTransfer for compatibility
                try {
                    e.dataTransfer.setData('application/notion-folder-page', JSON.stringify({
                        id: draggedPageData.id,
                        name: draggedPageData.name,
                        url: draggedPageData.url,
                        icon: draggedPageData.icon
                    }));
                    e.dataTransfer.effectAllowed = 'copyMove';
                } catch (err) {
                    // Some browsers restrict this
                    console.log('DataTransfer restricted, using fallback');
                }
            } else {
                console.log('⚠️ No draggable element found for:', e.target);
            }
        }, true); // Use capture phase!

        // Clear on drag end
        document.addEventListener('dragend', () => {
            draggedPageData = null;
            isDraggingToFolder = false;
            console.log('🏁 Drag ended');
        }, true);

        // Make our drop handler use the cached data
        this.draggedPageData = draggedPageData;
        this.getDraggedPageData = () => draggedPageData;
    }

    extractPageDataFromDrag(e) {
        try {
            const data = e.dataTransfer.getData('application/notion-folder-page');
            if (data) {
                return JSON.parse(data);
            }
        } catch (err) {
            console.log('DataTransfer not available, using cached data');
        }

        // Fallback: use the cached drag data
        const cachedData = this.getDraggedPageData ? this.getDraggedPageData() : null;
        if (cachedData) {
            console.log('✅ Using cached page data:', cachedData.name);
            return cachedData;
        }

        console.warn('⚠️ No page data available from drag');
        return null;
    }

    extractPageName(element) {
        // Try multiple strategies to get the page name

        // Strategy 1: Look for the dir="ltr" div which contains the title in sidebar items
        const dirLtrDiv = element.querySelector('div[dir="ltr"]') ||
            element.querySelector('[dir="ltr"]');

        if (dirLtrDiv && dirLtrDiv.textContent.trim()) {
            let text = dirLtrDiv.textContent.trim();
            // Take first line only
            text = text.split('\n')[0];
            console.log('📝 Extracted name from dir="ltr":', text);
            return text.substring(0, 100);
        }

        // Strategy 2: For database items, look for the title property
        const titleElement = element.querySelector('[data-content-editable-leaf="true"]') ||
            element.querySelector('[placeholder="Untitled"]') ||
            element.querySelector('[spellcheck="true"]');

        if (titleElement && titleElement.textContent.trim()) {
            let text = titleElement.textContent.trim();
            text = text.split('\n')[0];
            return text.substring(0, 100);
        }

        // Strategy 3: Look for an anchor tag with role="treeitem"
        const treeItem = element.querySelector('a[role="treeitem"]');
        if (treeItem && treeItem.textContent.trim()) {
            let text = treeItem.textContent.trim();
            text = text.split('\n')[0];
            return text.substring(0, 100);
        }

        // Strategy 4: Fallback to general text content
        let text = element.textContent || '';
        text = text.trim();

        // Clean up the text - take only first meaningful part
        text = text.split('\n')[0];
        text = text.substring(0, 100);

        return text || 'Untitled';
    }

    extractPageUrl(element) {
        // Try to find URL for database items and sidebar pages

        // Strategy 1: Look for anchor tag with role="treeitem" (sidebar structure)
        const treeItem = element.querySelector('a[role="treeitem"]');
        if (treeItem && treeItem.href) {
            console.log('🔗 Extracted URL from treeitem:', treeItem.href);
            return treeItem.href;
        }

        // Strategy 2: Look for any link element within
        const link = element.querySelector('a[href*="notion.so"]') ||
            element.querySelector('a[href*="/"]');

        if (link && link.href) {
            console.log('🔗 Extracted URL from link:', link.href);
            return link.href;
        }

        // Strategy 3: Try to find data-block-id and construct URL
        const blockId = element.dataset?.blockId ||
            element.getAttribute('data-block-id');

        if (blockId) {
            // Construct Notion URL from block ID
            const baseUrl = window.location.origin;
            const url = `${baseUrl}/${blockId.replace(/-/g, '')}`;
            console.log('🔗 Constructed URL from block-id:', url);
            return url;
        }

        return null;
    }

    extractPageIcon(element) {
        // Try to find the page icon
        const iconElement = element.querySelector('[data-icon]') ||
            element.querySelector('svg') ||
            element.querySelector('[class*="icon"]');

        if (iconElement && iconElement.outerHTML) {
            return iconElement.outerHTML;
        }
        return null;
    }

    generatePageId(element) {
        // Try to get a stable ID from the element
        const blockId = element.dataset?.blockId ||
            element.getAttribute('data-block-id') ||
            element.id;

        if (blockId) {
            return blockId;
        }

        // Try to extract from URL
        const href = element.href || element.getAttribute('href');
        if (href) {
            const urlMatch = href.match(/([a-f0-9]{32}|[a-f0-9-]{36})/);
            if (urlMatch) {
                return urlMatch[1];
            }
        }

        // Fallback to hash of the URL or text
        const text = this.extractPageName(element);
        const url = href || '';
        return 'page_' + this.simpleHash(url + text);
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    addPageToFolder(folderId, pageData) {
        const folder = this.folders[folderId];
        if (!folder) {
            console.error('❌ Folder not found:', folderId);
            return;
        }

        // Check if page already exists in this folder
        const exists = folder.pages.some(page => page.id === pageData.id);
        if (!exists) {
            console.log('➕ Adding page to folder:', pageData.name, '→', folder.name);
            folder.pages.push(pageData);

            // Save and re-render
            this.saveFolders().then(() => {
                this.renderFolders();
            });
        } else {
            console.log('ℹ️ Page already in folder:', pageData.name);
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new NotionFolders();
    });
} else {
    new NotionFolders();
}

