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
      
      let successCount = 0;
      let failedUsers: string[] = [];
      
      // 各ユーザーを1人ずつ追加
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        if (!email) {
          this.log(`Skipping empty email at index ${i}`);
          continue;
        }
        this.log(`Adding user ${i + 1}/${emails.length}: ${email}`);
        
        try {
          // ステップ3: メールアドレスまたはユーザー名を入力
          const inputSuccess = await this.inputText(this.SELECTORS.emailInput, email, `Email input for ${email}`);
          if (!inputSuccess) {
            throw new Error(`メールアドレス入力フィールドが見つかりません: ${email}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // ステップ4: 候補の一番上をクリック（選択）
          const candidateSelected = await this.selectFirstCandidate();
          if (!candidateSelected) {
            throw new Error(`候補が見つかりません: ${email}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // ステップ5: 権限を設定
          const roleSet = await this.setUserRole(role);
          if (!roleSet) {
            this.log(`権限設定に失敗しましたが、続行します: ${email}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 次のユーザーを追加するためのボタンを探す
          if (i < emails.length - 1) {
            const nextUserAdded = await this.addNextUser();
            if (!nextUserAdded) {
              throw new Error(`次のユーザー追加ボタンが見つかりません: ${email}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          successCount++;
          this.log(`Successfully added user: ${email}`);
          
        } catch (error) {
          this.log(`Failed to add user ${email}:`, error);
          failedUsers.push(email);
          
          // エラーが発生した場合、次のユーザーに進むためにリセットを試行
          try {
            await this.resetUserAddition();
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (resetError) {
            this.log('Failed to reset user addition:', resetError);
          }
        }
      }
      
      // 最後に保存ボタンをクリック
      const saveClicked = await this.clickElement(this.SELECTORS.inviteButton, 'Save button');
      if (!saveClicked) {
        this.log('Save button not found, but users may have been added');
      }
      
      const message = `${successCount}人のユーザー追加が完了しました`;
      if (failedUsers.length > 0) {
        return { 
          success: successCount > 0, 
          message: `${message}。失敗: ${failedUsers.join(', ')}` 
        };
      }
      
      return { success: true, message };
      
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

  // 候補の一番上を選択
  private async selectFirstCandidate(): Promise<boolean> {
    try {
      // 候補リストのセレクター（ドロップダウンメニューやリスト）
      const candidateSelectors = [
        '[role="listbox"] li:first-child',
        '.suggestion-item:first-child',
        '.dropdown-item:first-child',
        '[data-testid*="suggestion"]:first-child',
        '.autocomplete-item:first-child',
        'li[role="option"]:first-child',
        '.user-suggestion:first-child'
      ];

      for (const selector of candidateSelectors) {
        try {
          const element = await this.waitForElement(selector, 2000);
          if (element) {
            (element as HTMLElement).click();
            this.log(`Selected first candidate with selector: ${selector}`);
            return true;
          }
        } catch (error) {
          // 次のセレクターを試す
          continue;
        }
      }

      // Enterキーを押して候補を選択
      const inputElement = document.querySelector(this.SELECTORS.emailInput) as HTMLInputElement;
      if (inputElement) {
        inputElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        this.log('Pressed Enter to select candidate');
        return true;
      }

      return false;
    } catch (error) {
      this.log('Failed to select first candidate:', error);
      return false;
    }
  }

  // ユーザーの権限を設定
  private async setUserRole(role: string): Promise<boolean> {
    try {
      // 権限設定のセレクター
      const roleSelectors = [
        'select[aria-label*="role"]',
        'select[aria-label*="権限"]',
        '.role-selector select',
        '[data-testid*="role"] select',
        'select[name*="role"]',
        'select[name*="permission"]'
      ];

      for (const selector of roleSelectors) {
        try {
          const roleElement = await this.waitForElement(selector, 2000) as HTMLSelectElement;
          if (roleElement) {
            // 権限の値を設定
            const roleValue = this.mapRoleToValue(role);
            roleElement.value = roleValue;
            roleElement.dispatchEvent(new Event('change', { bubbles: true }));
            this.log(`Role set to ${role} (${roleValue})`);
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      return false;
    } catch (error) {
      this.log('Failed to set user role:', error);
      return false;
    }
  }

  // 権限名を値にマッピング
  private mapRoleToValue(role: string): string {
    const roleMap: { [key: string]: string } = {
      'Editor': 'editor',
      'Viewer': 'viewer',
      'Owner': 'owner',
      '編集者': 'editor',
      '閲覧者': 'viewer',
      'オーナー': 'owner'
    };
    return roleMap[role] || 'editor';
  }

  // 次のユーザーを追加するボタンを探す
  private async addNextUser(): Promise<boolean> {
    try {
      const nextUserSelectors = [
        'button[aria-label*="Add"]',
        'button[aria-label*="追加"]',
        'button:contains("Add another")',
        'button:contains("別のユーザーを追加")',
        '[data-testid*="add-another"]',
        '.add-user-button',
        'button[title*="Add"]'
      ];

      for (const selector of nextUserSelectors) {
        try {
          const element = await this.waitForElement(selector, 2000);
          if (element) {
            (element as HTMLElement).click();
            this.log(`Clicked next user button with selector: ${selector}`);
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      return false;
    } catch (error) {
      this.log('Failed to find next user button:', error);
      return false;
    }
  }

  // ユーザー追加をリセット
  private async resetUserAddition(): Promise<boolean> {
    try {
      // 入力フィールドをクリア
      const inputElement = document.querySelector(this.SELECTORS.emailInput) as HTMLInputElement;
      if (inputElement) {
        inputElement.value = '';
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // キャンセルボタンがあればクリック
      const cancelSelectors = [
        'button[aria-label*="Cancel"]',
        'button[aria-label*="キャンセル"]',
        'button:contains("Cancel")',
        'button:contains("キャンセル")',
        '[data-testid*="cancel"]'
      ];

      for (const selector of cancelSelectors) {
        try {
          const element = await this.waitForElement(selector, 1000);
          if (element) {
            (element as HTMLElement).click();
            this.log(`Clicked cancel button with selector: ${selector}`);
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      return true;
    } catch (error) {
      this.log('Failed to reset user addition:', error);
      return false;
    }
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

