// Popup script for Notion Folders

document.addEventListener('DOMContentLoaded', () => {
    loadStats();

    document.getElementById('refresh-btn').addEventListener('click', refreshExtension);
    document.getElementById('export-btn').addEventListener('click', exportFolders);
    document.getElementById('import-btn').addEventListener('click', importFolders);
});

function loadStats() {
    chrome.storage.sync.get(['notionFolders'], (result) => {
        const folders = result.notionFolders || {};
        const folderCount = Object.keys(folders).length;
        let pageCount = 0;

        Object.values(folders).forEach(folder => {
            pageCount += (folder.pages || []).length;
        });

        document.getElementById('folder-count').textContent = folderCount;
        document.getElementById('page-count').textContent = pageCount;
    });
}

function refreshExtension() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url && activeTab.url.includes('notion.so')) {
            chrome.tabs.reload(activeTab.id);
            window.close();
        } else {
            alert('Please navigate to a Notion page first');
        }
    });
}

function exportFolders() {
    chrome.storage.sync.get(['notionFolders'], (result) => {
        const folders = result.notionFolders || {};
        const dataStr = JSON.stringify(folders, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `notion-folders-backup-${Date.now()}.json`;
        link.click();

        URL.revokeObjectURL(url);
    });
}

function importFolders() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const folders = JSON.parse(event.target.result);

                chrome.storage.sync.set({ notionFolders: folders }, () => {
                    alert('Folders imported successfully! Please refresh your Notion page.');
                    loadStats();
                });
            } catch (err) {
                alert('Error importing folders. Please check the file format.');
                console.error('Import error:', err);
            }
        };

        reader.readAsText(file);
    });

    input.click();
}

