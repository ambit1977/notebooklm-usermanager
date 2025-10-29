import { UserFormData, MessageResponse } from './types';

class PopupManager {
  private form: HTMLFormElement;
  private checkPageBtn: HTMLButtonElement;
  private debugUIBtn: HTMLButtonElement;
  private debugShareDialogBtn: HTMLButtonElement;
  private loading: HTMLElement;
  private status: HTMLElement;

  constructor() {
    this.form = document.getElementById('userForm') as HTMLFormElement;
    this.checkPageBtn = document.getElementById('checkPage') as HTMLButtonElement;
    this.debugUIBtn = document.getElementById('debugUI') as HTMLButtonElement;
    this.debugShareDialogBtn = document.getElementById('debugShareDialog') as HTMLButtonElement;
    this.loading = document.getElementById('loading') as HTMLElement;
    this.status = document.getElementById('status') as HTMLElement;

    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // ページ確認ボタンのイベント
    this.checkPageBtn.addEventListener('click', this.handleCheckPage.bind(this));

    // デバッグボタンのイベント
    this.debugUIBtn.addEventListener('click', this.handleDebugUI.bind(this));

    // 共有ダイアログデバッグボタンのイベント
    this.debugShareDialogBtn.addEventListener('click', this.handleDebugShareDialog.bind(this));

    // フォーム送信のイベント
    this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
  }

  private async handleDebugUI(): Promise<void> {
    try {
      this.showStatus('info', 'NotebookLMのUI構造を調査中...');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url?.includes('notebooklm.google.com')) {
        this.showStatus('error', 'NotebookLMページを開いてください');
        return;
      }
      
      // content scriptが既に読み込まれているか確認
      await this.checkContentScriptReady(tab.id!);

      // Content scriptにUI調査を依頼
      let response: MessageResponse;
      try {
        response = await chrome.tabs.sendMessage(tab.id!, { action: 'debugUI' }) as MessageResponse;
      } catch (error) {
        this.showStatus('error', 'content scriptが読み込まれていません。ページを再読み込みしてください。');
        return;
      }

      if (response.success) {
        this.showStatus('success', 'UI構造の調査が完了しました。ブラウザの開発者ツールのコンソールで詳細を確認してください。');
      } else {
        this.showStatus('error', 'UI調査に失敗しました: ' + response.message);
      }
    } catch (error) {
      this.showStatus('error', 'エラーが発生しました: ' + (error as Error).message);
    }
  }

  private async handleDebugShareDialog(): Promise<void> {
    try {
      this.showStatus('info', '共有ダイアログの構造を調査中...');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url?.includes('notebooklm.google.com')) {
        this.showStatus('error', 'NotebookLMページを開いてください');
        return;
      }
      
      // content scriptが既に読み込まれているか確認
      await this.checkContentScriptReady(tab.id!);

      // Content scriptに共有ダイアログ調査を依頼
      let response: MessageResponse;
      try {
        response = await chrome.tabs.sendMessage(tab.id!, { action: 'debugShareDialog' }) as MessageResponse;
      } catch (error) {
        this.showStatus('error', 'content scriptが読み込まれていません。ページを再読み込みしてください。');
        return;
      }

      if (response.success) {
        this.showStatus('success', '共有ダイアログの調査が完了しました。ブラウザの開発者ツールのコンソールで詳細を確認してください。');
      } else {
        this.showStatus('error', '共有ダイアログ調査に失敗しました: ' + response.message);
      }
    } catch (error) {
      this.showStatus('error', 'エラーが発生しました: ' + (error as Error).message);
    }
  }
  
  // content scriptが準備できているか確認
  private async checkContentScriptReady(tabId: number): Promise<void> {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, { action: 'ping' }).then(() => {
        resolve();
      }).catch(async () => {
        // content scriptが読み込まれていない場合、手動で注入
        this.showStatus('info', 'content scriptを注入中...');
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        // 少し待ってから再試行
        await new Promise(resolve => setTimeout(resolve, 500));
        resolve();
      });
    });
  }

  private async handleCheckPage(): Promise<void> {
    try {
      this.showStatus('info', 'NotebookLMページを確認中...');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.url?.includes('notebooklm.google.com')) {
        this.showStatus('error', 'NotebookLMページを開いてください');
        return;
      }
      
      // content scriptが既に読み込まれているか確認
      await this.checkContentScriptReady(tab.id!);

      // Content scriptにページ確認を依頼
      let response: MessageResponse;
      try {
        response = await chrome.tabs.sendMessage(tab.id!, { action: 'checkPage' }) as MessageResponse;
      } catch (error) {
        // content scriptがまだ読み込まれていない場合
        this.showStatus('error', 'content scriptが読み込まれていません。ページを再読み込みしてください。');
        return;
      }

      if (response.success) {
        this.showStatus('success', 'NotebookLMページが正常に認識されました');
      } else {
        this.showStatus('error', 'NotebookLMページの認識に失敗しました: ' + response.message);
      }
    } catch (error) {
      this.showStatus('error', 'エラーが発生しました: ' + (error as Error).message);
    }
  }

  private async handleFormSubmit(e: Event): Promise<void> {
    e.preventDefault();

    const email = (document.getElementById('email') as HTMLInputElement).value;
    const emails = (document.getElementById('emails') as HTMLTextAreaElement).value;
    const csvFile = (document.getElementById('csvFile') as HTMLInputElement).files?.[0];
    const role = (document.getElementById('role') as HTMLInputElement).value;

    // どの方法でユーザーを追加するか判定
    let userEmails: string[] = [];
    
    if (csvFile) {
      // CSVファイルから読み込み
      userEmails = await this.parseCSVFile(csvFile);
    } else if (emails.trim()) {
      // カンマ区切りテキストから読み込み
      userEmails = emails.split(',').map(e => e.trim()).filter(e => e);
    } else if (email) {
      // 単一メールアドレス
      userEmails = [email];
    } else {
      this.showStatus('error', 'メールアドレスを入力するか、CSVファイルを選択してください');
      return;
    }

    if (userEmails.length === 0) {
      this.showStatus('error', '有効なメールアドレスが見つかりません');
      return;
    }

    try {
      this.showLoading(true);
      this.showStatus('info', 'ユーザー追加を実行中...');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab || !tab.url?.includes('notebooklm.google.com')) {
        this.showStatus('error', 'NotebookLMページを開いてください');
        this.showLoading(false);
        return;
      }

      // Content scriptにユーザー追加を依頼
      let response: MessageResponse;
      try {
        if (userEmails.length === 1) {
          response = await chrome.tabs.sendMessage(tab.id!, {
            action: 'addUser',
            email: userEmails[0],
            role: role
          }) as MessageResponse;
        } else {
          response = await chrome.tabs.sendMessage(tab.id!, {
            action: 'addMultipleUsers',
            emails: userEmails,
            role: role
          }) as MessageResponse;
        }
      } catch (error) {
        // content scriptがまだ読み込まれていない場合
        this.showStatus('error', 'content scriptが読み込まれていません。ページを再読み込みしてください。');
        return;
      }

      if (response.success) {
        this.showStatus('success', `${userEmails.length}人のユーザー追加が完了しました`);
        this.form.reset();
      } else {
        this.showStatus('error', 'ユーザー追加に失敗しました: ' + response.message);
      }
    } catch (error) {
      this.showStatus('error', 'エラーが発生しました: ' + (error as Error).message);
    } finally {
      this.showLoading(false);
    }
  }

  private showStatus(type: 'success' | 'error' | 'info', message: string): void {
    this.status.className = `status ${type}`;
    this.status.textContent = message;
    this.status.style.display = 'block';

    // 3秒後にステータスを非表示
    setTimeout(() => {
      this.status.style.display = 'none';
    }, 3000);
  }

  private showLoading(show: boolean): void {
    this.loading.style.display = show ? 'block' : 'none';
  }

  // CSVファイルを解析してメールアドレスを抽出
  private async parseCSVFile(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const emails: string[] = [];
          
          for (const line of lines) {
            // カンマ区切りで分割
            const columns = line.split(',');
            for (const column of columns) {
              const trimmed = column.trim();
              // メールアドレスの形式をチェック
              if (trimmed.includes('@') && trimmed.includes('.')) {
                emails.push(trimmed);
              }
            }
          }
          
          resolve(emails.filter(email => email));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
      reader.readAsText(file);
    });
  }
}

// DOM読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
