// NotebookLM User Manager - Content Script
console.log('NotebookLM User Manager: Content script loaded');

// NotebookLMのUI要素を特定するためのセレクター
const SELECTORS = {
  // 共有ボタンやメニュー
  shareButton: '[data-testid="share-button"], button[aria-label*="Share"], button[aria-label*="共有"]',
  shareMenu: '[role="menu"], .share-menu, [data-testid="share-menu"]',
  
  // ユーザー追加関連
  addUserButton: 'button[aria-label*="Add"], button[aria-label*="追加"], [data-testid="add-user"]',
  emailInput: 'input[type="email"], input[placeholder*="email"], input[placeholder*="メール"]',
  roleSelect: 'select, [role="combobox"], [data-testid="role-select"]',
  inviteButton: 'button[type="submit"], button[aria-label*="Invite"], button[aria-label*="招待"]',
  
  // 一般的なUI要素
  dialog: '[role="dialog"], .dialog, .modal',
  closeButton: 'button[aria-label*="Close"], button[aria-label*="閉じる"], [data-testid="close"]',
  confirmButton: 'button[aria-label*="Confirm"], button[aria-label*="確認"], [data-testid="confirm"]'
};

// 待機関数
function waitForElement(selector, timeout = 10000) {
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

// 要素をクリックする関数
async function clickElement(selector, description) {
  try {
    const element = await waitForElement(selector, 5000);
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 複数のクリック方法を試す
    if (element.click) {
      element.click();
    } else {
      element.dispatchEvent(new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      }));
    }
    
    console.log(`NotebookLM User Manager: ${description} clicked`);
    return true;
  } catch (error) {
    console.error(`NotebookLM User Manager: Failed to click ${description}:`, error);
    return false;
  }
}

// テキストを入力する関数
async function inputText(selector, text, description) {
  try {
    const element = await waitForElement(selector, 5000);
    element.focus();
    element.value = '';
    
    // テキストを入力
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log(`NotebookLM User Manager: ${description} input: ${text}`);
    return true;
  } catch (error) {
    console.error(`NotebookLM User Manager: Failed to input ${description}:`, error);
    return false;
  }
}

// ページ確認関数
async function checkNotebookLMPage() {
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
        console.log('NotebookLM User Manager: Page confirmed as NotebookLM');
        return { success: true, message: 'NotebookLMページが確認されました' };
      }
    }
    
    return { success: false, message: 'NotebookLMページではありません' };
  } catch (error) {
    return { success: false, message: 'ページ確認中にエラーが発生しました: ' + error.message };
  }
}

// ユーザー追加のメイン関数
async function addUser(email, role = 'Editor') {
  try {
    console.log(`NotebookLM User Manager: Starting to add user ${email} with role ${role}`);
    
    // ステップ1: 共有ボタンを探してクリック
    const shareClicked = await clickElement(SELECTORS.shareButton, 'Share button');
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
        if (await clickElement(selector, `Alternative share button (${selector})`)) {
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
    const addUserClicked = await clickElement(SELECTORS.addUserButton, 'Add user button');
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
        if (await clickElement(selector, `Alternative add user button (${selector})`)) {
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
    const emailInputted = await inputText(SELECTORS.emailInput, email, 'Email input');
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
        if (await inputText(selector, email, `Alternative email input (${selector})`)) {
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
        const roleElement = await waitForElement(SELECTORS.roleSelect, 3000);
        if (roleElement) {
          roleElement.value = role;
          roleElement.dispatchEvent(new Event('change', { bubbles: true }));
          console.log(`NotebookLM User Manager: Role set to ${role}`);
        }
      } catch (error) {
        console.warn('NotebookLM User Manager: Could not set role, using default');
      }
    }
    
    // ステップ5: 招待ボタンをクリック
    const inviteClicked = await clickElement(SELECTORS.inviteButton, 'Invite button');
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
        if (await clickElement(selector, `Alternative invite button (${selector})`)) {
          found = true;
          break;
        }
      }
      
      if (!found) {
        throw new Error('招待ボタンが見つかりません');
      }
    }
    
    console.log(`NotebookLM User Manager: Successfully added user ${email}`);
    return { success: true, message: `ユーザー ${email} の追加が完了しました` };
    
  } catch (error) {
    console.error('NotebookLM User Manager: Error adding user:', error);
    return { success: false, message: error.message };
  }
}

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('NotebookLM User Manager: Received message:', request);
  
  if (request.action === 'checkPage') {
    checkNotebookLMPage().then(sendResponse);
    return true; // 非同期レスポンスを示す
  }
  
  if (request.action === 'addUser') {
    addUser(request.email, request.role).then(sendResponse);
    return true; // 非同期レスポンスを示す
  }
});

// ページ読み込み完了時の初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('NotebookLM User Manager: DOM loaded, ready for operations');
  });
} else {
  console.log('NotebookLM User Manager: DOM already loaded, ready for operations');
}
