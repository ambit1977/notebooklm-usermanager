import { Selectors, MessageRequest, MessageResponse } from './types';

class NotebookLMUserManager {
  private readonly SELECTORS: Selectors = {
    shareButton: '[data-testid="share-button"], button[aria-label*="Share"], button[aria-label*="共有"]',
    shareMenu: '[role="menu"], .share-menu, [data-testid="share-menu"]',
    addUserButton: 'button[aria-label*="Add"], button[aria-label*="追加"], [data-testid="add-user"]',
    emailInput: 'input[type="email"], input[placeholder*="email"], input[placeholder*="メール"]',
    roleSelect: 'select, [role="combobox"], [data-testid="role-select"]',
    inviteButton: 'button[type="submit"], button[aria-label*="Invite"], button[aria-label*="招待"]',
    dialog: '[role="dialog"], .dialog, .modal',
    closeButton: 'button[aria-label*="Close"], button[aria-label*="閉じる"], [data-testid="close"]',
    confirmButton: 'button[aria-label*="Confirm"], button[aria-label*="確認"], [data-testid="confirm"]'
  };

  constructor() {
    this.initializeMessageListener();
    this.log('Content script loaded');
  }

  private initializeMessageListener(): void {
    chrome.runtime.onMessage.addListener((request: MessageRequest, sender, sendResponse) => {
      this.log('Received message:', request);

      // pingハンドラー - content scriptが読み込まれているか確認
      if (request.action === 'ping') {
        sendResponse({ success: true, message: 'pong' });
        return true;
      }

      if (request.action === 'checkPage') {
        this.checkNotebookLMPage().then(sendResponse);
        return true; // 非同期レスポンスを示す
      }

      if (request.action === 'addUser') {
        this.addUser(request.email!, request.role).then(sendResponse);
        return true; // 非同期レスポンスを示す
      }

      if (request.action === 'addMultipleUsers') {
        this.addMultipleUsers(request.emails!, request.role).then(sendResponse);
        return true; // 非同期レスポンスを示す
      }

      if (request.action === 'log') {
        this.log('Content script log:', request.message);
        sendResponse({ success: true, message: 'Logged successfully' });
        return true;
      }

      return false;
    });
  }

  private async waitForElement(selector: string, timeout = 10000): Promise<Element> {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  private async clickElement(selector: string, description: string): Promise<boolean> {
    try {
      const element = await this.waitForElement(selector, 5000);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 500));

      // 複数のクリック方法を試す
      if ('click' in element && typeof element.click === 'function') {
        (element as HTMLElement).click();
      } else {
        element.dispatchEvent(new MouseEvent('click', {
          view: window,
          bubbles: true,
          cancelable: true
        }));
      }

      this.log(`${description} clicked`);
      return true;
    } catch (error) {
      this.log(`Failed to click ${description}:`, error);
      return false;
    }
  }

  private async inputText(selector: string, text: string, description: string): Promise<boolean> {
    try {
      const element = await this.waitForElement(selector, 5000) as HTMLInputElement;
      element.focus();
      element.value = '';

      // テキストを入力
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      this.log(`${description} input: ${text}`);
      return true;
    } catch (error) {
      this.log(`Failed to input ${description}:`, error);
      return false;
    }
  }

  private async checkNotebookLMPage(): Promise<MessageResponse> {
    try {
      // NotebookLMの特徴的な要素を確認
      const indicators = [
        'title', // ページタイトル
        '[data-testid*="notebook"]', // NotebookLM特有の要素
        'button[aria-label*="Share"]', // 共有ボタン
        'button[aria-label*="共有"]'
      ];

      for (const indicator of indicators) {
        const element = document.querySelector(indicator);
        if (element) {
          this.log('Page confirmed as NotebookLM');
          return { success: true, message: 'NotebookLMページが確認されました' };
        }
      }

      return { success: false, message: 'NotebookLMページではありません' };
    } catch (error) {
      return { success: false, message: 'ページ確認中にエラーが発生しました: ' + (error as Error).message };
    }
  }

  async addMultipleUsers(emails: string[], role = 'Editor'): Promise<MessageResponse> {
    try {
      this.log(`Starting to add ${emails.length} users with role ${role}`);
      
      // ステップ1: 共有ボタンをクリック
      const shareClicked = await this.clickElement(this.SELECTORS.shareButton, 'Share button');
      if (!shareClicked) {
        throw new Error('共有ボタンが見つかりません');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ステップ2: ユーザー追加ボタンをクリック
      const addUserClicked = await this.clickElement(this.SELECTORS.addUserButton, 'Add user button');
      if (!addUserClicked) {
        throw new Error('ユーザー追加ボタンが見つかりません');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ステップ3: 複数のメールアドレスを入力
      const emailText = emails.join(', ');
      const emailInputted = await this.inputText(this.SELECTORS.emailInput, emailText, 'Multiple email input');
      if (!emailInputted) {
        throw new Error('メールアドレス入力フィールドが見つかりません');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ステップ4: 権限を設定
      if (role && role !== 'Editor') {
        try {
          const roleElement = await this.waitForElement(this.SELECTORS.roleSelect, 3000) as HTMLSelectElement;
          if (roleElement) {
            roleElement.value = role;
            roleElement.dispatchEvent(new Event('change', { bubbles: true }));
            this.log(`Role set to ${role}`);
          }
        } catch (error) {
          this.log('Could not set role, using default');
        }
      }
      
      // ステップ5: 招待ボタンをクリック
      const inviteClicked = await this.clickElement(this.SELECTORS.inviteButton, 'Invite button');
      if (!inviteClicked) {
        throw new Error('招待ボタンが見つかりません');
      }
      
      this.log(`Successfully added ${emails.length} users: ${emails.join(', ')}`);
      return { success: true, message: `${emails.length}人のユーザー追加が完了しました` };
      
    } catch (error) {
      this.log('Error adding multiple users:', error);
      return { success: false, message: (error as Error).message };
    }
  }

  private async addUser(email: string, role = 'Editor'): Promise<MessageResponse> {
    try {
      this.log(`Starting to add user ${email} with role ${role}`);

      // ステップ1: 共有ボタンを探してクリック
      const shareClicked = await this.clickElement(this.SELECTORS.shareButton, 'Share button');
      if (!shareClicked) {
        // 代替の共有ボタンを探す
        const altShareSelectors = [
          'button[aria-label*="Share"]',
          'button[aria-label*="共有"]',
          '[data-testid*="share"]',
          'button:contains("Share")',
          'button:contains("共有")'
        ];

        let found = false;
        for (const selector of altShareSelectors) {
          if (await this.clickElement(selector, `Alternative share button (${selector})`)) {
            found = true;
            break;
          }
        }

        if (!found) {
          throw new Error('共有ボタンが見つかりません');
        }
      }

      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ステップ2: ユーザー追加ボタンを探してクリック
      const addUserClicked = await this.clickElement(this.SELECTORS.addUserButton, 'Add user button');
      if (!addUserClicked) {
        // 代替のユーザー追加ボタンを探す
        const altAddUserSelectors = [
          'button[aria-label*="Add"]',
          'button[aria-label*="追加"]',
          'button:contains("Add people")',
          'button:contains("人を追加")',
          '[data-testid*="add"]'
        ];

        let found = false;
        for (const selector of altAddUserSelectors) {
          if (await this.clickElement(selector, `Alternative add user button (${selector})`)) {
            found = true;
            break;
          }
        }

        if (!found) {
          throw new Error('ユーザー追加ボタンが見つかりません');
        }
      }

      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ステップ3: メールアドレスを入力
      const emailInputted = await this.inputText(this.SELECTORS.emailInput, email, 'Email input');
      if (!emailInputted) {
        // 代替のメール入力フィールドを探す
        const altEmailSelectors = [
          'input[type="email"]',
          'input[placeholder*="email"]',
          'input[placeholder*="メール"]',
          'input[placeholder*="Email"]',
          '[data-testid*="email"]'
        ];

        let found = false;
        for (const selector of altEmailSelectors) {
          if (await this.inputText(selector, email, `Alternative email input (${selector})`)) {
            found = true;
            break;
          }
        }

        if (!found) {
          throw new Error('メールアドレス入力フィールドが見つかりません');
        }
      }

      // 少し待機
      await new Promise(resolve => setTimeout(resolve, 500));

      // ステップ4: 権限を設定（オプション）
      if (role && role !== 'Editor') {
        try {
          const roleElement = await this.waitForElement(this.SELECTORS.roleSelect, 3000) as HTMLSelectElement;
          if (roleElement) {
            roleElement.value = role;
            roleElement.dispatchEvent(new Event('change', { bubbles: true }));
            this.log(`Role set to ${role}`);
          }
        } catch (error) {
          this.log('Could not set role, using default');
        }
      }

      // ステップ5: 招待ボタンをクリック
      const inviteClicked = await this.clickElement(this.SELECTORS.inviteButton, 'Invite button');
      if (!inviteClicked) {
        // 代替の招待ボタンを探す
        const altInviteSelectors = [
          'button[type="submit"]',
          'button[aria-label*="Invite"]',
          'button[aria-label*="招待"]',
          'button:contains("Send")',
          'button:contains("送信")',
          '[data-testid*="invite"]'
        ];

        let found = false;
        for (const selector of altInviteSelectors) {
          if (await this.clickElement(selector, `Alternative invite button (${selector})`)) {
            found = true;
            break;
          }
        }

        if (!found) {
          throw new Error('招待ボタンが見つかりません');
        }
      }

      this.log(`Successfully added user ${email}`);
      return { success: true, message: `ユーザー ${email} の追加が完了しました` };

    } catch (error) {
      this.log('Error adding user:', error);
      return { success: false, message: (error as Error).message };
    }
  }

  private log(message: string, data?: any): void {
    console.log('NotebookLM User Manager:', message, data || '');
  }
}

// ページ読み込み完了時の初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new NotebookLMUserManager();
  });
} else {
  new NotebookLMUserManager();
}
