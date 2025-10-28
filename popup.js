document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('userForm');
  const checkPageBtn = document.getElementById('checkPage');
  const loading = document.getElementById('loading');
  const status = document.getElementById('status');

  // ページ確認ボタンのイベント
  checkPageBtn.addEventListener('click', async function() {
    try {
      showStatus('info', 'NotebookLMページを確認中...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('notebooklm.google.com')) {
        showStatus('error', 'NotebookLMページを開いてください');
        return;
      }
      
      // Content scriptにページ確認を依頼
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkPage' });
      
      if (response.success) {
        showStatus('success', 'NotebookLMページが正常に認識されました');
      } else {
        showStatus('error', 'NotebookLMページの認識に失敗しました: ' + response.message);
      }
    } catch (error) {
      showStatus('error', 'エラーが発生しました: ' + error.message);
    }
  });

  // フォーム送信のイベント
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const role = document.getElementById('role').value;
    
    if (!email) {
      showStatus('error', 'メールアドレスを入力してください');
      return;
    }
    
    try {
      showLoading(true);
      showStatus('info', 'ユーザー追加を実行中...');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('notebooklm.google.com')) {
        showStatus('error', 'NotebookLMページを開いてください');
        showLoading(false);
        return;
      }
      
      // Content scriptにユーザー追加を依頼
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'addUser',
        email: email,
        role: role
      });
      
      if (response.success) {
        showStatus('success', `ユーザー "${email}" の追加が完了しました`);
        form.reset();
      } else {
        showStatus('error', 'ユーザー追加に失敗しました: ' + response.message);
      }
    } catch (error) {
      showStatus('error', 'エラーが発生しました: ' + error.message);
    } finally {
      showLoading(false);
    }
  });

  function showStatus(type, message) {
    status.className = `status ${type}`;
    status.textContent = message;
    status.style.display = 'block';
    
    // 3秒後にステータスを非表示
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }

  function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
  }
});
