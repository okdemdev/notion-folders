// Background service worker for Notion Folders extension

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Notion Folders extension installed');

        // Initialize storage
        chrome.storage.sync.get(['notionFolders'], (result) => {
            if (!result.notionFolders) {
                chrome.storage.sync.set({
                    notionFolders: {}
                });
            }
        });
    } else if (details.reason === 'update') {
        console.log('Notion Folders extension updated');
    }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getFolders') {
        chrome.storage.sync.get(['notionFolders'], (result) => {
            sendResponse({ folders: result.notionFolders || {} });
        });
        return true; // Keep message channel open for async response
    }

    if (request.action === 'saveFolders') {
        chrome.storage.sync.set({ notionFolders: request.folders }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
});

