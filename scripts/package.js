const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PackageManager {
  private readonly distDir = path.join(__dirname, '..', 'dist');
  private readonly extensionDir = path.join(this.distDir, 'extension');

  public async package(): Promise<void> {
    console.log('Starting packaging process...');

    // ビルドディレクトリをクリーンアップ
    this.cleanDist();

    // ビルドを実行
    this.build();

    // パッケージ情報を生成
    this.generatePackageInfo();

    // ZIPファイルを作成
    this.createZip();

    console.log('Packaging completed successfully!');
  }

  private cleanDist(): void {
    if (fs.existsSync(this.distDir)) {
      fs.rmSync(this.distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.distDir, { recursive: true });
  }

  private build(): void {
    console.log('Building extension...');
    execSync('npm run build', { stdio: 'inherit' });
  }

  private generatePackageInfo(): void {
    const packageInfo = {
      name: 'NotebookLM User Manager',
      version: '1.0.0',
      description: 'NotebookLMの共有ユーザー追加を自動化するChrome拡張機能',
      buildDate: new Date().toISOString(),
      files: this.getExtensionFiles()
    };

    const packageInfoPath = path.join(this.distDir, 'package-info.json');
    fs.writeFileSync(packageInfoPath, JSON.stringify(packageInfo, null, 2));
    
    console.log('Package info generated:', packageInfoPath);
  }

  private getExtensionFiles(): string[] {
    const files: string[] = [];
    
    const scanDir = (dir: string, baseDir: string = ''): void => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(baseDir, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          scanDir(fullPath, relativePath);
        } else {
          files.push(relativePath);
        }
      }
    };

    if (fs.existsSync(this.extensionDir)) {
      scanDir(this.extensionDir);
    }

    return files;
  }

  private createZip(): void {
    console.log('Creating ZIP package...');
    
    const zipPath = path.join(this.distDir, 'notebooklm-usermanager.zip');
    
    try {
      execSync(`cd "${this.extensionDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
      console.log('ZIP package created:', zipPath);
    } catch (error) {
      console.error('Failed to create ZIP package:', error);
      throw error;
    }
  }
}

// スクリプトが直接実行された場合
if (require.main === module) {
  const packageManager = new PackageManager();
  packageManager.package().catch((error) => {
    console.error('Packaging failed:', error);
    process.exit(1);
  });
}

module.exports = PackageManager;
