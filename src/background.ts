import { MessageRequest, MessageResponse } from './types';

class BackgroundManager {
  constructor() {
    this.initializeEventListeners();
    this.log('Background script loaded');
  }

  private initializeEventListeners(): void {
    // 拡張機能のインストール時の処理
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));

    // タブの更新を監視
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));

    // メッセージの処理
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // 拡張機能が無効化された時の処理
    chrome.runtime.onSuspend.addListener(this.handleSuspend.bind(this));
  }

  private handleInstalled(details: chrome.runtime.InstalledDetails): void {
    this.log('Extension installed/updated', details);

    if (details.reason === 'install') {
      // 初回インストール時の処理
      this.log('First time installation');
    } else if (details.reason === 'update') {
      // アップデート時の処理
      this.log('Extension updated');
    }
  }

  private handleTabUpdated(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab): void {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('notebooklm.google.com')) {
      this.log('NotebookLM page loaded');

      // 必要に応じてcontent scriptに通知
      chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' }).catch(() => {
        // content scriptがまだ読み込まれていない場合は無視
      });
    }
  }

  private handleMessage(request: MessageRequest, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void): boolean {
    this.log('Background received message:', request);

    if (request.action === 'log') {
      this.log('NotebookLM User Manager Log:', request.message);
      sendResponse({ success: true, message: 'Logged successfully' });
    }

    return true;
  }

  private handleSuspend(): void {
    this.log('Extension suspended');
  }

  private log(message: string, data?: any): void {
    console.log('NotebookLM User Manager:', message, data || '');
  }
}

// 拡張機能開始時の処理
chrome.runtime.onStartup.addListener(() => {
  new BackgroundManager();
});

// 即座に初期化
new BackgroundManager();
