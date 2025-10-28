interface LogEntry {
  timestamp: string;
  message: string;
  data?: any;
  url: string;
  level?: 'ERROR';
  error?: string;
}

interface PageAnalysis {
  url: string;
  title: string;
  timestamp: string;
  elements: {
    buttons: number;
    inputs: number;
    selects: number;
    dialogs: number;
  };
  potentialSelectors: {
    shareButtons: Array<{
      index: number;
      text: string;
      ariaLabel: string | null;
      className: string;
      id: string;
    }>;
    emailInputs: Array<{
      index: number;
      type: string;
      placeholder: string | null;
      className: string;
      id: string;
    }>;
    addUserButtons: Array<{
      index: number;
      text: string;
      ariaLabel: string | null;
      className: string;
      id: string;
    }>;
    inviteButtons: Array<{
      index: number;
      text: string;
      ariaLabel: string | null;
      className: string;
      id: string;
    }>;
  };
}

interface DebugCommands {
  analyze: () => PageAnalysis;
  logs: () => LogEntry[];
  export: () => void;
  clear: () => void;
  enable: () => void;
  disable: () => void;
}

class NotebookLMDebugger {
  private logs: LogEntry[] = [];
  private isDebugMode: boolean = true;

  constructor() {
    this.initializeGlobalCommands();
  }

  private initializeGlobalCommands(): void {
    (window as any).debugNotebookLM = {
      analyze: () => this.analyzePage(),
      logs: () => this.logs,
      export: () => this.exportLogs(),
      clear: () => this.logs = [],
      enable: () => this.isDebugMode = true,
      disable: () => this.isDebugMode = false
    };
  }

  public log(message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
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

  public error(message: string, error?: Error): void {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level: 'ERROR',
      message,
      error: error ? error.toString() : undefined,
      url: window.location.href
    };

    this.logs.push(logEntry);

    if (this.isDebugMode) {
      console.error(`[NotebookLM Debug ${timestamp}]`, message, error || '');
    }
  }

  public analyzePage(): PageAnalysis {
    this.log('Starting page analysis...');

    const analysis: PageAnalysis = {
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

  private findPotentialSelectors(): PageAnalysis['potentialSelectors'] {
    const selectors: PageAnalysis['potentialSelectors'] = {
      shareButtons: [],
      emailInputs: [],
      addUserButtons: [],
      inviteButtons: []
    };

    // 共有ボタンを探す
    document.querySelectorAll('button').forEach((btn, index) => {
      const text = btn.textContent?.toLowerCase() || '';
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';

      if (text.includes('share') || text.includes('共有') ||
          ariaLabel.includes('share') || ariaLabel.includes('共有')) {
        selectors.shareButtons.push({
          index,
          text: btn.textContent || '',
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
      const text = btn.textContent?.toLowerCase() || '';
      const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';

      if (text.includes('add') || text.includes('追加') ||
          ariaLabel.includes('add') || ariaLabel.includes('追加')) {
        selectors.addUserButtons.push({
          index,
          text: btn.textContent || '',
          ariaLabel: btn.getAttribute('aria-label'),
          className: btn.className,
          id: btn.id
        });
      }
    });

    return selectors;
  }

  public exportLogs(): void {
    const dataStr = JSON.stringify(this.logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `notebooklm-debug-${Date.now()}.json`;
    link.click();

    this.log('Logs exported');
  }
}

// グローバルデバッガーインスタンス
(window as any).notebookLMDebugger = new NotebookLMDebugger();

console.log('NotebookLM Debug utilities loaded. Use debugNotebookLM.analyze() to analyze the page.');
