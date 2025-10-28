import { UserFormData, MessageResponse } from './types';

class PopupManager {
  private form: HTMLFormElement;
  private checkPageBtn: HTMLButtonElement;
  private loading: HTMLElement;
  private status: HTMLElement;

  constructor() {
    this.form = document.getElementById('userForm') as HTMLFormElement;
    this.checkPageBtn = document.getElementById('checkPage') as HTMLButtonElement;
    this.loading = document.getElementById('loading') as HTMLElement;
    this.status = document.getElementById('status') as HTMLElement;

    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // ページ確認ボタンのイベント
    this.checkPageBtn.addEventListener('click', this.handleCheckPage.bind(this));

    // フォーム送信のイベント
    this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
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
    const role = (document.getElementById('role') as HTMLInputElement).value;

    if (!email) {
      this.showStatus('error', 'メールアドレスを入力してください');
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
        response = await chrome.tabs.sendMessage(tab.id!, {
          action: 'addUser',
          email: email,
          role: role
        }) as MessageResponse;
      } catch (error) {
        // content scriptがまだ読み込まれていない場合
        this.showStatus('error', 'content scriptが読み込まれていません。ページを再読み込みしてください。');
        return;
      }

      if (response.success) {
        this.showStatus('success', `ユーザー "${email}" の追加が完了しました`);
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
}

// DOM読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
