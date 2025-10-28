// NotebookLM User Manager - Background Script
console.log('NotebookLM User Manager: Background script loaded');

// 拡張機能のインストール時の処理
chrome.runtime.onInstalled.addListener((details) => {
  console.log('NotebookLM User Manager: Extension installed/updated', details);
  
  if (details.reason === 'install') {
    // 初回インストール時の処理
    console.log('NotebookLM User Manager: First time installation');
  } else if (details.reason === 'update') {
    // アップデート時の処理
    console.log('NotebookLM User Manager: Extension updated');
  }
});

// タブの更新を監視
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('notebooklm.google.com')) {
    console.log('NotebookLM User Manager: NotebookLM page loaded');
    
    // 必要に応じてcontent scriptに通知
    chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' }).catch(() => {
      // content scriptがまだ読み込まれていない場合は無視
    });
  }
});

// メッセージの処理
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('NotebookLM User Manager: Background received message:', request);
  
  if (request.action === 'log') {
    console.log('NotebookLM User Manager Log:', request.message);
    sendResponse({ success: true });
  }
  
  return true;
});

// エラーハンドリング
chrome.runtime.onStartup.addListener(() => {
  console.log('NotebookLM User Manager: Extension started');
});

// 拡張機能が無効化された時の処理
chrome.runtime.onSuspend.addListener(() => {
  console.log('NotebookLM User Manager: Extension suspended');
});
