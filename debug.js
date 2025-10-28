// NotebookLM User Manager - Debug Utilities
// このファイルは開発・デバッグ用です

class NotebookLMDebugger {
  constructor() {
    this.logs = [];
    this.isDebugMode = true;
  }

  log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data,
      url: window.location.href
    };
    
    this.logs.push(logEntry);
    
    if (this.isDebugMode) {
      console.log(`[NotebookLM Debug ${timestamp}]`, message, data || '');
    }
  }

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: 'ERROR',
      message,
      error: error ? error.toString() : null,
      url: window.location.href
    };
    
    this.logs.push(logEntry);
    
    if (this.isDebugMode) {
      console.error(`[NotebookLM Debug ${timestamp}]`, message, error || '');
    }
  }

  // ページの要素を分析
  analyzePage() {
    this.log('Starting page analysis...');
    
    const analysis = {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      elements: {
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        selects: document.querySelectorAll('select').length,
        dialogs: document.querySelectorAll('[role="dialog"]').length
      },
      potentialSelectors: this.findPotentialSelectors()
    };
    
    this.log('Page analysis completed', analysis);
    return analysis;
  }

  // 潜在的なセレクターを探す
  findPotentialSelectors() {
    const selectors = {
      shareButtons: [],
      emailInputs: [],
      addUserButtons: [],
      inviteButtons: []
    };

    // 共有ボタンを探す
    document.querySelectorAll('button').forEach((btn, index) => {
      const text = btn.textContent.toLowerCase();
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      
      if (text.includes('share') || text.includes('共有') || 
          ariaLabel.includes('share') || ariaLabel.includes('共有')) {
        selectors.shareButtons.push({
          index,
          text: btn.textContent,
          ariaLabel: btn.getAttribute('aria-label'),
          className: btn.className,
          id: btn.id
        });
      }
    });

    // メール入力フィールドを探す
    document.querySelectorAll('input').forEach((input, index) => {
      const type = input.type;
      const placeholder = input.placeholder?.toLowerCase() || '';
      
      if (type === 'email' || placeholder.includes('email') || placeholder.includes('メール')) {
        selectors.emailInputs.push({
          index,
          type,
          placeholder: input.placeholder,
          className: input.className,
          id: input.id
        });
      }
    });

    // ユーザー追加ボタンを探す
    document.querySelectorAll('button').forEach((btn, index) => {
      const text = btn.textContent.toLowerCase();
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
      
      if (text.includes('add') || text.includes('追加') || 
          ariaLabel.includes('add') || ariaLabel.includes('追加')) {
        selectors.addUserButtons.push({
          index,
          text: btn.textContent,
          ariaLabel: btn.getAttribute('aria-label'),
          className: btn.className,
          id: btn.id
        });
      }
    });

    return selectors;
  }

  // ログをエクスポート
  exportLogs() {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `notebooklm-debug-${Date.now()}.json`;
    link.click();
    
    this.log('Logs exported');
  }

  // ページのスクリーンショットを取得（開発者ツール用）
  takeScreenshot() {
    this.log('Taking screenshot...');
    // 実際のスクリーンショット機能はChrome拡張機能APIが必要
    return 'Screenshot functionality requires Chrome extension API';
  }
}

// グローバルデバッガーインスタンス
window.notebookLMDebugger = new NotebookLMDebugger();

// デバッグコマンドをコンソールに追加
window.debugNotebookLM = {
  analyze: () => window.notebookLMDebugger.analyzePage(),
  logs: () => window.notebookLMDebugger.logs,
  export: () => window.notebookLMDebugger.exportLogs(),
  clear: () => window.notebookLMDebugger.logs = [],
  enable: () => window.notebookLMDebugger.isDebugMode = true,
  disable: () => window.notebookLMDebugger.isDebugMode = false
};

console.log('NotebookLM Debug utilities loaded. Use debugNotebookLM.analyze() to analyze the page.');
